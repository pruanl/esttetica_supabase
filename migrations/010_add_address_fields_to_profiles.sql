-- Migration: Add detailed address fields to profiles table
-- Description: Adds CEP, street, number, city, and state fields to profiles table for better address management

-- Add address fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cep VARCHAR(10),
ADD COLUMN IF NOT EXISTS street TEXT,
ADD COLUMN IF NOT EXISTS number VARCHAR(20),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(50),
ADD COLUMN IF NOT EXISTS address TEXT; -- Keep existing address field for backward compatibility

-- Add comments to document the new fields
COMMENT ON COLUMN public.profiles.cep IS 'CEP/Postal code (format: 00000-000)';
COMMENT ON COLUMN public.profiles.street IS 'Street name';
COMMENT ON COLUMN public.profiles.number IS 'Street number';
COMMENT ON COLUMN public.profiles.city IS 'City name';
COMMENT ON COLUMN public.profiles.state IS 'State/Province name';
COMMENT ON COLUMN public.profiles.address IS 'Complete address (legacy field, kept for compatibility)';

-- Create indexes for address fields to improve search performance
CREATE INDEX IF NOT EXISTS idx_profiles_cep ON public.profiles(cep);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_state ON public.profiles(state);