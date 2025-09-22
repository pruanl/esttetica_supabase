// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

// Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
})

// Function to map price_id to plan name and billing cycle
function getPlanDetails(priceId: string): { planName: string; billingCycle: string } {
  const planMap: Record<string, { planName: string; billingCycle: string }> = {
    'price_1SAFNkBe0ycHroRBidLX2jgZ': { planName: 'Diário', billingCycle: 'daily' },
    'price_1S9YdXBe0ycHroRB9sDH7MJO': { planName: 'Mensal', billingCycle: 'monthly' },
    'price_1S9YdXBe0ycHroRBqz8Yr30h': { planName: 'Anual', billingCycle: 'yearly' }
  }
  
  return planMap[priceId] || { planName: 'Plano Premium', billingCycle: 'monthly' }
}

async function processCheckoutSessionCompleted(session: any) {
  console.log('Processing checkout session completed:', session.id)

  // Initialize Supabase client with service role key for admin operations
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Extract user ID from session metadata or find by email
  let userId = session.metadata?.user_id
  
  if (!userId) {
    // Fallback: find user by email from customer_details
    const customerEmail = session.customer_details?.email
    if (!customerEmail) {
      console.error('No user_id in metadata and no customer email')
      return new Response('Missing user identification', { status: 400 })
    }

    const { data: user, error: userError } = await supabase.auth.admin.listUsers()
    const foundUser = user?.users?.find(u => u.email === customerEmail)
    
    if (!foundUser) {
      console.error('User not found with email:', customerEmail)
      return new Response('User not found', { status: 404 })
    }
    
    userId = foundUser.id
  }

  // Get subscription details from Stripe to extract billing dates
  let stripeSubscription = null
  let nextBillingDate = null
  
  if (session.subscription) {
    try {
      stripeSubscription = await stripe.subscriptions.retrieve(session.subscription)
      // Extract next billing date from current_period_end
      if (stripeSubscription.current_period_end) {
        nextBillingDate = new Date(stripeSubscription.current_period_end * 1000).toISOString()
        console.log('Next billing date extracted:', nextBillingDate)
      }
    } catch (error) {
      console.error('Error retrieving subscription from Stripe:', error)
    }
  }

  // Get plan details from price_id
  const planDetails = getPlanDetails(session.metadata?.price_id || stripeSubscription?.items?.data[0]?.price?.id || 'unknown')

  // First, insert into subscription_history for complete tracking
  const historyData = {
    user_id: userId,
    stripe_customer_id: session.customer,
    stripe_subscription_id: session.subscription,
    stripe_checkout_session_id: session.id,
    event_type: 'created',
    status: 'active',
    plan_name: planDetails.planName,
    price_id: session.metadata?.price_id || 'price_premium',
    amount_paid: session.amount_total ? session.amount_total / 100 : null, // Convert from cents
    currency: session.currency || 'BRL',
    billing_cycle: planDetails.billingCycle,
    stripe_event_id: `checkout_${session.id}`,
    metadata: {
      checkout_session: session.id,
      customer_email: session.customer_details?.email,
      payment_status: session.payment_status
    }
  }

  const { error: historyError } = await supabase
    .from('subscription_history')
    .insert(historyData)

  if (historyError) {
    console.error('Error inserting subscription history:', historyError)
  }

  // Check if subscription already exists for this customer
  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('id, status')
    .eq('stripe_customer_id', session.customer)
    .single()

  // Prepare current subscription data
  const subscriptionData = {
    user_id: userId,
    stripe_customer_id: session.customer,
    stripe_subscription_id: session.subscription,
    status: 'active',
    plan_name: planDetails.planName,
    price_id: session.metadata?.price_id || 'price_premium',
    next_billing_date: nextBillingDate,
    current_period_start: stripeSubscription?.current_period_start ? 
      new Date(stripeSubscription.current_period_start * 1000).toISOString() : null,
    current_period_end: stripeSubscription?.current_period_end ? 
      new Date(stripeSubscription.current_period_end * 1000).toISOString() : null,
    billing_cycle: planDetails.billingCycle
  }

  let result
  if (existingSubscription) {
    // Update existing subscription
    result = await supabase
      .from('subscriptions')
      .update({
        stripe_subscription_id: session.subscription,
        status: 'active',
        plan_name: planDetails.planName,
        price_id: session.metadata?.price_id || 'price_premium',
        next_billing_date: nextBillingDate,
        current_period_start: stripeSubscription?.current_period_start ? 
          new Date(stripeSubscription.current_period_start * 1000).toISOString() : null,
        current_period_end: stripeSubscription?.current_period_end ? 
          new Date(stripeSubscription.current_period_end * 1000).toISOString() : null,
        billing_cycle: planDetails.billingCycle,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_customer_id', session.customer)
      .select()
  } else {
    // Insert new subscription
    result = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
  }

  const { data: subscription, error: subscriptionError } = result

  if (subscriptionError) {
    console.error('Error processing subscription:', subscriptionError)
    return new Response(
      JSON.stringify({ error: 'Database error', details: subscriptionError.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Subscription updated successfully',
      subscription_id: session.subscription,
      user_id: userId
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    }
  )
}

async function processSubscriptionUpdate(subscription: any) {
  console.log('Processing subscription update:', subscription.id)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Insert into subscription_history first
  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (existingSubscription) {
    // Get plan details from price_id
    const planDetails = getPlanDetails(subscription.items?.data[0]?.price?.id || 'unknown')
    
    const historyData = {
      user_id: existingSubscription.user_id,
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
      event_type: subscription.cancel_at_period_end ? 'cancellation_requested' : 'updated',
      status: subscription.status,
      plan_name: planDetails.planName,
      price_id: subscription.items?.data[0]?.price?.id,
      billing_cycle: planDetails.billingCycle,
      stripe_event_id: `subscription_update_${subscription.id}_${Date.now()}`,
      metadata: {
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end
      }
    }

    await supabase
      .from('subscription_history')
      .insert(historyData)
  }

  // Check if subscription is set to cancel at period end
  if (subscription.cancel_at_period_end) {
    console.log('Subscription set to cancel at period end:', subscription.id)
    
    // Update subscription to show cancellation requested
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'cancellation_requested',
        cancel_at_period_end: true,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)
      .select()

    if (updateError) {
      console.error('Error updating subscription for cancellation request:', updateError)
      return new Response(
        JSON.stringify({ error: 'Database error', details: updateError.message }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    console.log('Subscription marked for cancellation at period end:', subscription.id)
  } else {
    // Check if subscription was reactivated (cancel_at_period_end changed from true to false)
    const { data: currentSub } = await supabase
      .from('subscriptions')
      .select('cancel_at_period_end, status')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (currentSub?.cancel_at_period_end && currentSub?.status === 'cancellation_requested') {
      console.log('Subscription reactivated:', subscription.id)
      
      // Reactivate subscription
      const { error: reactivateError } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'active',
          cancellation_requested_at: null,
          cancel_at_period_end: false,
          canceled_at: null, // Clear canceled_at when reactivating
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
        })
        .eq('stripe_subscription_id', subscription.id)

      if (reactivateError) {
        console.error('Error reactivating subscription:', reactivateError)
        return new Response(
          JSON.stringify({ error: 'Database error', details: reactivateError.message }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        )
      }

      console.log('Subscription reactivated successfully:', subscription.id)
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Subscription update processed successfully',
      subscription_id: subscription.id
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    }
  )
}

async function processSubscriptionCancellation(subscription: any) {
  console.log('Processing subscription cancellation (deleted):', subscription.id)
  console.log('Subscription data:', JSON.stringify(subscription, null, 2))

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Insert into subscription_history first
  const { data: existingSubscription, error: selectError } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  console.log('Existing subscription found:', existingSubscription)
  console.log('Select error:', selectError)

  if (existingSubscription) {
    // Get plan details from price_id
    const planDetails = getPlanDetails(subscription.items?.data[0]?.price?.id || 'unknown')
    
    const historyData = {
      user_id: existingSubscription.user_id,
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
      event_type: 'cancelled',
      status: 'canceled',
      plan_name: planDetails.planName,
      price_id: subscription.items?.data[0]?.price?.id,
      billing_cycle: planDetails.billingCycle,
      stripe_event_id: `subscription_cancel_${subscription.id}_${Date.now()}`,
      metadata: {
        canceled_at: subscription.canceled_at 
          ? new Date(subscription.canceled_at * 1000).toISOString() 
          : new Date().toISOString(),
        cancellation_reason: subscription.cancellation_details?.reason
      }
    }

    console.log('Inserting history data:', historyData)
    const { error: historyError } = await supabase
      .from('subscription_history')
      .insert(historyData)
    
    if (historyError) {
      console.error('Error inserting history:', historyError)
    }
  } else {
    console.log('No existing subscription found for stripe_subscription_id:', subscription.id)
  }

  // Update subscription status to canceled
  console.log('Updating subscription status to canceled for:', subscription.id)
  const { data: updatedSubscription, error: updateError } = await supabase
    .from('subscriptions')
    .update({ 
      status: 'canceled',
      canceled_at: subscription.canceled_at 
        ? new Date(subscription.canceled_at * 1000).toISOString() 
        : new Date().toISOString(),
      cancel_at_period_end: false // Reset this flag when actually canceled
    })
    .eq('stripe_subscription_id', subscription.id)
    .select()

  console.log('Updated subscription:', updatedSubscription)
  console.log('Update error:', updateError)

  if (updateError) {
    console.error('Error updating subscription:', updateError)
    return new Response(
      JSON.stringify({ error: 'Database error', details: updateError.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }

  if (!updatedSubscription || updatedSubscription.length === 0) {
    console.log('No subscription was updated - subscription may not exist in database')
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Subscription not found in database',
        subscription_id: subscription.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404 
      }
    )
  }

  console.log('Subscription canceled successfully:', subscription.id)

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Subscription canceled successfully',
      subscription_id: subscription.id
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    }
  )
}

// Configure function to allow public access (no auth required)
export const config = {
  auth: false
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const signature = req.headers.get('stripe-signature')
    let event: any
    
    // In production, verify the webhook signature
    if (Deno.env.get('ENVIRONMENT') === 'production' && signature) {
      const body = await req.text()
      const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
      
      if (!endpointSecret) {
        console.error('STRIPE_WEBHOOK_SECRET not configured')
        return new Response('Webhook secret not configured', { status: 500 })
      }

      try {
        stripe.webhooks.constructEvent(body, signature, endpointSecret)
        // Parse the event again since we consumed the body
        event = JSON.parse(body)
      } catch (err) {
        console.error('Webhook signature verification failed:', err)
        return new Response('Invalid signature', { status: 400 })
      }
    } else {
      // For development, just parse the JSON
      event = await req.json()
    }
    console.log('Processing event:', event.type)

    if (event.type === 'checkout.session.completed') {
      return await processCheckoutSessionCompleted(event.data.object)
    }

    if (event.type === 'customer.subscription.updated') {
      return await processSubscriptionUpdate(event.data.object)
    }

    if (event.type === 'customer.subscription.deleted') {
      return await processSubscriptionCancellation(event.data.object)
    }

    return new Response(
      JSON.stringify({ received: true, message: 'Event processed successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})