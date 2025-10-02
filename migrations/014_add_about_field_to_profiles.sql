-- Add about field to profiles table
-- This field will store a description about the clinic or professional

-- Add the about column to the profiles table
ALTER TABLE public.profiles
ADD COLUMN about TEXT;

-- Add comment to the column
COMMENT ON COLUMN public.profiles.about IS 'Description about the clinic or professional';