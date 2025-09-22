// Edge Function for processing pending cancellations
// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe((globalThis as any).Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export const config = {
  auth: false
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      (globalThis as any).Deno.env.get('SUPABASE_URL') ?? '',
      (globalThis as any).Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Find subscriptions with cancellation_requested status older than 14 days
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const { data: pendingCancellations, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'cancellation_requested')
      .lt('cancellation_requested_at', fourteenDaysAgo.toISOString())

    if (fetchError) {
      console.error('Error fetching pending cancellations:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Database error', details: fetchError.message }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    if (!pendingCancellations || pendingCancellations.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No pending cancellations to process',
          processed: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    let processedCount = 0
    const errors: string[] = []

    for (const subscription of pendingCancellations) {
      try {
        // Cancel the subscription in Stripe
        if (subscription.stripe_subscription_id) {
          await stripe.subscriptions.cancel(subscription.stripe_subscription_id, {
            prorate: false, // Don't prorate the final invoice
          })
        }

        // Update the subscription status in our database
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({ 
            status: 'canceled',
            canceled_at: new Date().toISOString()
          })
          .eq('id', subscription.id)

        if (updateError) {
          console.error(`Error updating subscription ${subscription.id}:`, updateError)
          errors.push(`Failed to update subscription ${subscription.id}: ${updateError.message}`)
        } else {
          processedCount++
          console.log(`Successfully canceled subscription ${subscription.id}`)
        }
      } catch (stripeError: any) {
        console.error(`Error canceling Stripe subscription ${subscription.stripe_subscription_id}:`, stripeError)
        errors.push(`Failed to cancel Stripe subscription ${subscription.stripe_subscription_id}: ${stripeError.message}`)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${processedCount} cancellations`,
        processed: processedCount,
        total: pendingCancellations.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error: any) {
    console.error('Error processing pending cancellations:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})