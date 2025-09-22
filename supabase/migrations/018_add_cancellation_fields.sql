-- Migration: Add cancellation fields to subscriptions table
-- Description: Adds fields to handle cancellation requests and status
-- Author: System
-- Date: 2024

-- Add cancellation-related columns
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS cancellation_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN public.subscriptions.cancellation_requested_at IS 'When the user requested cancellation';
COMMENT ON COLUMN public.subscriptions.cancellation_reason IS 'Reason provided by user for cancellation';
COMMENT ON COLUMN public.subscriptions.cancel_at_period_end IS 'Whether subscription will cancel at period end';
COMMENT ON COLUMN public.subscriptions.canceled_at IS 'When the subscription was actually canceled';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_cancellation_requested ON public.subscriptions(cancellation_requested_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_cancel_at_period_end ON public.subscriptions(cancel_at_period_end);