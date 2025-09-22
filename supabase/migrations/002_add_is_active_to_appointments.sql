-- Migration: 002_add_is_active_to_appointments
-- Description: Add is_active column to appointments table for soft delete functionality
-- Created: 2024

-- Add is_active column to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for better performance on is_active queries
CREATE INDEX IF NOT EXISTS idx_appointments_is_active ON appointments(is_active);

-- Update existing records to have is_active = true
UPDATE appointments SET is_active = true WHERE is_active IS NULL;