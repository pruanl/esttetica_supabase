-- Migration: Add reminder_sent column to appointments table
-- This column will track whether a reminder has been sent for each appointment

ALTER TABLE appointments 
ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE;

-- Add comment to document the purpose of this column
COMMENT ON COLUMN appointments.reminder_sent IS 'Tracks whether a reminder has been sent for this appointment';