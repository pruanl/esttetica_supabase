-- Migration: Add cancellation_requested status to subscriptions table
-- This allows tracking when a user has requested cancellation within 14 days

-- Since the original table uses TEXT for status, we don't need to modify an enum
-- The status field already accepts any text value

-- Add a check constraint to ensure valid status values
ALTER TABLE subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_status_check 
CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete', 'cancellation_requested'));

-- Update the status column comment
COMMENT ON COLUMN subscriptions.status IS 'Current subscription status - cancellation_requested indicates user requested cancellation within 14 days';