-- Migration: Create public profile API function
-- Description: Creates a SQL function to return public clinic profile data for external applications

-- Create function to get public clinic profile by user ID
CREATE OR REPLACE FUNCTION public.get_public_clinic_profile(clinic_user_id UUID)
RETURNS JSON AS $$
DECLARE
  profile_data JSON;
  gallery_data JSON;
  result JSON;
BEGIN
  -- Get profile data
  SELECT to_json(p.*) INTO profile_data
  FROM (
    SELECT 
      id,
      clinic_name,
      whatsapp_number,
      profile_avatar_url,
      cover_photo_url,
      address,
      cep,
      street,
      number,
      city,
      state,
      latitude,
      longitude,
      instagram_url,
      tiktok_url,
      youtube_url,
      facebook_url,
      created_at,
      updated_at
    FROM public.profiles 
    WHERE id = clinic_user_id
  ) p;

  -- Get gallery photos
  SELECT json_agg(
    json_build_object(
      'id', id,
      'photo_url', photo_url,
      'description', description,
      'created_at', created_at
    )
  ) INTO gallery_data
  FROM public.gallery_photos 
  WHERE user_id = clinic_user_id 
    AND is_active = true
  ORDER BY created_at DESC;

  -- Build final result
  SELECT json_build_object(
    'profile', profile_data,
    'gallery', COALESCE(gallery_data, '[]'::json),
    'success', true,
    'message', 'Profile data retrieved successfully'
  ) INTO result;

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'profile', null,
      'gallery', '[]'::json,
      'success', false,
      'message', 'Error retrieving profile data: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get public clinic profile by clinic name (slug-friendly)
CREATE OR REPLACE FUNCTION public.get_public_clinic_profile_by_name(clinic_name_param TEXT)
RETURNS JSON AS $$
DECLARE
  clinic_user_id UUID;
  result JSON;
BEGIN
  -- Find user ID by clinic name
  SELECT id INTO clinic_user_id
  FROM public.profiles 
  WHERE LOWER(clinic_name) = LOWER(clinic_name_param)
  LIMIT 1;

  -- If clinic not found
  IF clinic_user_id IS NULL THEN
    RETURN json_build_object(
      'profile', null,
      'gallery', '[]'::json,
      'success', false,
      'message', 'Clinic not found'
    );
  END IF;

  -- Get profile data using the main function
  SELECT public.get_public_clinic_profile(clinic_user_id) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get public clinic profile by username
CREATE OR REPLACE FUNCTION public.get_public_clinic_profile_by_username(username_param TEXT)
RETURNS JSON AS $$
DECLARE
  clinic_user_id UUID;
  result JSON;
BEGIN
  -- Find user ID by username
  SELECT id INTO clinic_user_id
  FROM public.profiles 
  WHERE username = LOWER(username_param)
  LIMIT 1;

  -- If clinic not found
  IF clinic_user_id IS NULL THEN
    RETURN json_build_object(
      'profile', null,
      'gallery', '[]'::json,
      'success', false,
      'message', 'Clinic not found'
    );
  END IF;

  -- Get profile data using the main function
  SELECT public.get_public_clinic_profile(clinic_user_id) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to anonymous users (public access)
GRANT EXECUTE ON FUNCTION public.get_public_clinic_profile(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_clinic_profile_by_name(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_clinic_profile_by_username(TEXT) TO anon;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_public_clinic_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_clinic_profile_by_name(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_clinic_profile_by_username(TEXT) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION public.get_public_clinic_profile(UUID) IS 'Returns public clinic profile data including gallery photos by user ID';
COMMENT ON FUNCTION public.get_public_clinic_profile_by_name(TEXT) IS 'Returns public clinic profile data including gallery photos by clinic name';
COMMENT ON FUNCTION public.get_public_clinic_profile_by_username(TEXT) IS 'Returns public clinic profile data including gallery photos by username';