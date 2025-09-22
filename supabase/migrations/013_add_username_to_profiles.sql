-- Migration: Add username field to profiles table
-- Description: Adds a unique username field for public profile URLs

-- Add username field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN username VARCHAR(50) UNIQUE;

-- Add constraint to ensure username follows rules:
-- - Only lowercase letters, numbers, and hyphens
-- - Cannot start or end with hyphen
-- - Cannot have consecutive hyphens
-- - Minimum 3 characters, maximum 50 characters
ALTER TABLE public.profiles 
ADD CONSTRAINT username_format_check 
CHECK (
  username IS NULL OR (
    username ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$' AND
    length(username) >= 3 AND
    length(username) <= 50 AND
    username NOT LIKE '%-%-%'
  )
);

-- Create index for username for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.username IS 'Unique username for public profile URL (3-50 chars, lowercase letters, numbers, hyphens only)';

-- Create function to validate and format username
CREATE OR REPLACE FUNCTION public.validate_username(input_username TEXT)
RETURNS TEXT AS $$
DECLARE
  formatted_username TEXT;
BEGIN
  -- Return null if input is null or empty
  IF input_username IS NULL OR trim(input_username) = '' THEN
    RETURN NULL;
  END IF;
  
  -- Convert to lowercase and trim
  formatted_username := lower(trim(input_username));
  
  -- Replace spaces and underscores with hyphens
  formatted_username := regexp_replace(formatted_username, '[_\s]+', '-', 'g');
  
  -- Remove any character that is not a letter, number, or hyphen
  formatted_username := regexp_replace(formatted_username, '[^a-z0-9-]', '', 'g');
  
  -- Remove leading and trailing hyphens
  formatted_username := regexp_replace(formatted_username, '^-+|-+$', '', 'g');
  
  -- Replace multiple consecutive hyphens with single hyphen
  formatted_username := regexp_replace(formatted_username, '-+', '-', 'g');
  
  -- Check minimum length
  IF length(formatted_username) < 3 THEN
    RETURN NULL;
  END IF;
  
  -- Check maximum length
  IF length(formatted_username) > 50 THEN
    formatted_username := substring(formatted_username, 1, 50);
    -- Remove trailing hyphen if truncation created one
    formatted_username := regexp_replace(formatted_username, '-+$', '', 'g');
  END IF;
  
  RETURN formatted_username;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to check username availability
CREATE OR REPLACE FUNCTION public.check_username_availability(input_username TEXT, user_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  formatted_username TEXT;
  existing_count INTEGER;
BEGIN
  -- Validate and format username
  formatted_username := public.validate_username(input_username);
  
  -- If validation failed
  IF formatted_username IS NULL THEN
    RETURN json_build_object(
      'available', false,
      'formatted_username', NULL,
      'message', 'Username inválido. Use apenas letras, números e hífens (3-50 caracteres).'
    );
  END IF;
  
  -- Check if username already exists (excluding current user if provided)
  SELECT COUNT(*) INTO existing_count
  FROM public.profiles 
  WHERE username = formatted_username 
    AND (user_id IS NULL OR id != user_id);
  
  -- Return result
  RETURN json_build_object(
    'available', existing_count = 0,
    'formatted_username', formatted_username,
    'message', CASE 
      WHEN existing_count = 0 THEN 'Username disponível!'
      ELSE 'Username já está em uso.'
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.validate_username(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_username_availability(TEXT, UUID) TO authenticated;

-- Grant execute permissions to anonymous users for public access
GRANT EXECUTE ON FUNCTION public.validate_username(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_username_availability(TEXT, UUID) TO anon;