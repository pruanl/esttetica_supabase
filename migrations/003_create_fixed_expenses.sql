-- Migration: Create fixed_expenses table
-- Description: Table to store user's fixed monthly expenses for cost calculation

-- Create the fixed_expenses table
CREATE TABLE IF NOT EXISTS public.fixed_expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    category TEXT,
    user_id UUID DEFAULT auth.uid() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.fixed_expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy for SELECT: Users can only view their own expenses
CREATE POLICY "Users can view own fixed expenses" ON public.fixed_expenses
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for INSERT: Users can only insert their own expenses
CREATE POLICY "Users can insert own fixed expenses" ON public.fixed_expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE: Users can only update their own expenses
CREATE POLICY "Users can update own fixed expenses" ON public.fixed_expenses
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy for DELETE: Users can only delete their own expenses
CREATE POLICY "Users can delete own fixed expenses" ON public.fixed_expenses
    FOR DELETE USING (auth.uid() = user_id);

-- Create index for better performance on user_id queries
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_user_id ON public.fixed_expenses(user_id);

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_category ON public.fixed_expenses(category);

-- Grant necessary permissions
GRANT ALL ON public.fixed_expenses TO authenticated;
GRANT ALL ON public.fixed_expenses TO service_role;