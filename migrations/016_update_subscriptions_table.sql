-- Migration: Update subscriptions table with additional fields
-- Description: Adds missing fields for billing page functionality
-- Author: System
-- Date: 2024

-- Add missing columns to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS plan_type TEXT CHECK (plan_type IN ('monthly', 'yearly'));

-- Update existing records with default values (you can adjust these as needed)
UPDATE public.subscriptions 
SET 
  current_period_start = created_at,
  current_period_end = created_at + INTERVAL '1 month',
  plan_type = 'monthly'
WHERE current_period_start IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.subscriptions.current_period_start IS 'Start date of current billing period';
COMMENT ON COLUMN public.subscriptions.current_period_end IS 'End date of current billing period';
COMMENT ON COLUMN public.subscriptions.plan_type IS 'Type of subscription plan: monthly or yearly';

-- Create index for better performance on period queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON public.subscriptions(current_period_end);