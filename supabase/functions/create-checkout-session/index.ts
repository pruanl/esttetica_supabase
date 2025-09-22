// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe((globalThis as any).Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Initialize Supabase client
    const supabaseClient = createClient(
      (globalThis as any).Deno.env.get('SUPABASE_URL') ?? '',
      (globalThis as any).Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse request body
    const { price_id } = await req.json()

    if (!price_id) {
      return new Response(
        JSON.stringify({ error: 'price_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if user already has a subscription record
    const { data: existingSubscription, error: subscriptionError } = await supabaseClient
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    let customerId = existingSubscription?.stripe_customer_id

    // If no customer ID exists, create a new Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          supabase_user_id: user.id,
        },
      })

      customerId = customer.id

      // Save the customer ID to our database
      const { error: insertError } = await supabaseClient
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          status: 'incomplete',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (insertError) {
        console.error('Error saving customer ID:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to save customer information' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/dashboard?success=true`,
      cancel_url: `${req.headers.get('origin')}/subscribe?canceled=true`,
      metadata: {
        user_id: user.id,
      },
    })

    return new Response(
      JSON.stringify({ sessionId: session.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})