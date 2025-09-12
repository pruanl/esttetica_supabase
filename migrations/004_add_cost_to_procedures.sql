-- Migration: Add cost column to procedures table
-- Description: Add material cost column to procedures for profit calculation

-- Add cost column to procedures table
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2) DEFAULT 0.00;

-- Add comment to the column
COMMENT ON COLUMN procedures.cost IS 'Material cost for the procedure';

-- Update existing procedures to have a default cost of 0
UPDATE procedures SET cost = 0.00 WHERE cost IS NULL;