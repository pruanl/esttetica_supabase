-- Migration: Create subscription_history table for tracking all subscription changes
-- This table will store every subscription event (created, updated, cancelled, etc.)

-- Create subscription_history table
CREATE TABLE IF NOT EXISTS public.subscription_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT NOT NULL,
    stripe_subscription_id TEXT,
    stripe_checkout_session_id TEXT,
    event_type TEXT NOT NULL, -- 'created', 'updated', 'cancelled', 'reactivated', etc.
    status TEXT NOT NULL, -- 'active', 'canceled', 'past_due', 'unpaid', 'incomplete', etc.
    plan_name TEXT,
    price_id TEXT,
    amount_paid DECIMAL(10,2),
    currency TEXT DEFAULT 'BRL',
    billing_cycle TEXT, -- 'monthly', 'yearly'
    event_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stripe_event_id TEXT, -- Store the Stripe event ID for deduplication
    metadata JSONB, -- Store additional Stripe metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON public.subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_stripe_customer_id ON public.subscription_history(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_stripe_subscription_id ON public.subscription_history(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_event_date ON public.subscription_history(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_history_stripe_event_id ON public.subscription_history(stripe_event_id);

-- Enable RLS
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own subscription history" ON public.subscription_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscription history" ON public.subscription_history
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON public.subscription_history TO authenticated;
GRANT INSERT ON public.subscription_history TO authenticated;
GRANT UPDATE ON public.subscription_history TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.subscription_history IS 'Complete history of all subscription events and changes';
COMMENT ON COLUMN public.subscription_history.user_id IS 'Reference to the user who owns this subscription';
COMMENT ON COLUMN public.subscription_history.stripe_customer_id IS 'Stripe customer ID';
COMMENT ON COLUMN public.subscription_history.stripe_subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN public.subscription_history.event_type IS 'Type of subscription event (created, updated, cancelled, etc.)';
COMMENT ON COLUMN public.subscription_history.status IS 'Subscription status at the time of this event';
COMMENT ON COLUMN public.subscription_history.stripe_event_id IS 'Stripe webhook event ID for deduplication';