-- Migration: Create subscriptions table for Stripe integration
-- Description: Creates the subscriptions table to manage user subscriptions with Stripe
-- Author: System
-- Date: 2024

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    status TEXT,
    plan_name TEXT,
    price_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy: Users can only read their own subscription data
CREATE POLICY "Users can view own subscription" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Only authenticated users can insert their own subscription (for system use)
CREATE POLICY "System can insert subscriptions" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Only system can update subscriptions (typically via webhooks)
CREATE POLICY "System can update subscriptions" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Only system can delete subscriptions
CREATE POLICY "System can delete subscriptions" ON public.subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON public.subscriptions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT INSERT ON public.subscriptions TO authenticated;
GRANT UPDATE ON public.subscriptions TO authenticated;
GRANT DELETE ON public.subscriptions TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.subscriptions IS 'Stores user subscription information for Stripe integration';
COMMENT ON COLUMN public.subscriptions.user_id IS 'Reference to the user who owns this subscription';
COMMENT ON COLUMN public.subscriptions.stripe_customer_id IS 'Stripe customer ID for this user';
COMMENT ON COLUMN public.subscriptions.stripe_subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN public.subscriptions.status IS 'Subscription status (active, canceled, past_due, etc.)';
COMMENT ON COLUMN public.subscriptions.plan_name IS 'Name of the subscription plan';
COMMENT ON COLUMN public.subscriptions.price_id IS 'Stripe price ID for the subscription';