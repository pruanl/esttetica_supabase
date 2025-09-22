-- Migration: Create cancellation feedback table
-- Description: Creates table to store user feedback when canceling subscriptions
-- Author: System
-- Date: 2024

-- Create cancellation_feedback table
CREATE TABLE IF NOT EXISTS public.cancellation_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    reason TEXT CHECK (reason IN (
        'no_time_to_test',
        'platform_complicated',
        'missing_functionality',
        'price_not_suitable',
        'using_other_solution',
        'other'
    )),
    other_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cancellation_feedback_user_id ON public.cancellation_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_feedback_subscription_id ON public.cancellation_feedback(subscription_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_feedback_reason ON public.cancellation_feedback(reason);

-- Enable Row Level Security (RLS)
ALTER TABLE public.cancellation_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy: Users can only read their own feedback
CREATE POLICY "Users can view own cancellation feedback" ON public.cancellation_feedback
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own feedback
CREATE POLICY "Users can insert own cancellation feedback" ON public.cancellation_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT ON public.cancellation_feedback TO authenticated;
GRANT INSERT ON public.cancellation_feedback TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.cancellation_feedback IS 'Stores user feedback when canceling subscriptions';
COMMENT ON COLUMN public.cancellation_feedback.user_id IS 'Reference to the user who provided feedback';
COMMENT ON COLUMN public.cancellation_feedback.subscription_id IS 'Reference to the canceled subscription';
COMMENT ON COLUMN public.cancellation_feedback.reason IS 'Predefined reason for cancellation';
COMMENT ON COLUMN public.cancellation_feedback.other_reason IS 'Custom reason when "other" is selected';