-- Migration: Update subscriptions table to focus on current status only
-- The subscription_history table will handle all historical data

-- Add new columns for better current status tracking
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP WITH TIME ZONE;

-- Add index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON public.subscriptions(current_period_end);

-- Update comments to reflect new purpose
COMMENT ON TABLE public.subscriptions IS 'Current subscription status for each user (one record per user)';
COMMENT ON COLUMN public.subscriptions.current_period_start IS 'Start of current billing period';
COMMENT ON COLUMN public.subscriptions.current_period_end IS 'End of current billing period';
COMMENT ON COLUMN public.subscriptions.cancel_at_period_end IS 'Whether subscription will cancel at period end';
COMMENT ON COLUMN public.subscriptions.cancelled_at IS 'When the subscription was cancelled';

-- Create or replace function to get user's current subscription
CREATE OR REPLACE FUNCTION get_user_current_subscription(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status TEXT,
    plan_name TEXT,
    price_id TEXT,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.user_id,
        s.stripe_customer_id,
        s.stripe_subscription_id,
        s.status,
        s.plan_name,
        s.price_id,
        s.current_period_start,
        s.current_period_end,
        s.cancel_at_period_end,
        s.created_at,
        s.updated_at
    FROM public.subscriptions s
    WHERE s.user_id = user_uuid
    AND s.status IN ('active', 'trialing', 'past_due')
    ORDER BY s.updated_at DESC
    LIMIT 1;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_current_subscription(UUID) TO authenticated;