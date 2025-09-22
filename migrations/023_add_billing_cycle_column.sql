-- Migration: Add billing_cycle column to subscriptions table
-- This field will store the billing cycle (daily, weekly, monthly, yearly) from Stripe

-- Add billing_cycle column to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN billing_cycle TEXT;

-- Add comment to document the field
COMMENT ON COLUMN subscriptions.billing_cycle IS 'Billing cycle from Stripe (daily, weekly, monthly, yearly)';

-- Create index for better query performance
CREATE INDEX idx_subscriptions_billing_cycle ON subscriptions(billing_cycle);

-- Drop existing function first to avoid return type conflict
DROP FUNCTION IF EXISTS get_user_current_subscription(UUID);

-- Update the get_user_current_subscription function to include billing_cycle
CREATE OR REPLACE FUNCTION get_user_current_subscription(user_uuid UUID)
RETURNS TABLE (
  id BIGINT,
  user_id UUID,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT,
  plan_name TEXT,
  price_id TEXT,
  billing_cycle TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
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
    s.billing_cycle,
    s.current_period_start,
    s.current_period_end,
    s.next_billing_date,
    s.cancel_at_period_end,
    s.created_at,
    s.updated_at
  FROM subscriptions s
  WHERE s.user_id = user_uuid
    AND s.status IN ('active', 'trialing', 'past_due', 'cancellation_requested')
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_current_subscription(UUID) TO authenticated;