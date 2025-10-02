-- Migration: Update public profile API to include treatments and working hours
-- Description: Updates the public profile API functions to include public treatments and working hours

-- Update function to get public clinic profile by user ID
CREATE OR REPLACE FUNCTION public.get_public_clinic_profile(clinic_user_id UUID)
RETURNS JSON AS $$
DECLARE
  profile_data JSON;
  gallery_data JSON;
  treatments_data JSON;
  working_hours_data JSON;
  result JSON;
BEGIN
  -- Get profile data (including the new about field)
  SELECT to_json(p.*) INTO profile_data
  FROM (
    SELECT 
      id,
      clinic_name,
      username,
      about,
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
    ) ORDER BY created_at DESC
  ) INTO gallery_data
  FROM public.gallery_photos 
  WHERE user_id = clinic_user_id 
    AND is_active = true;

  -- Get public treatments
  SELECT json_agg(
    json_build_object(
      'id', id,
      'name', name,
      'description', description,
      'display_order', display_order
    ) ORDER BY display_order ASC
  ) INTO treatments_data
  FROM public.public_treatments 
  WHERE user_id = clinic_user_id 
    AND is_active = true;

  -- Get working hours
  SELECT json_agg(
    json_build_object(
      'day_of_week', day_of_week,
      'is_open', is_open,
      'open_time', open_time,
      'close_time', close_time
    ) ORDER BY day_of_week ASC
  ) INTO working_hours_data
  FROM public.working_hours 
  WHERE user_id = clinic_user_id;

  -- Build final result
  SELECT json_build_object(
    'profile', profile_data,
    'gallery', COALESCE(gallery_data, '[]'::json),
    'treatments', COALESCE(treatments_data, '[]'::json),
    'working_hours', COALESCE(working_hours_data, '[]'::json),
    'success', true,
    'message', 'Profile data retrieved successfully'
  ) INTO result;

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'profile', null,
      'gallery', '[]'::json,
      'treatments', '[]'::json,
      'working_hours', '[]'::json,
      'success', false,
      'message', 'Error retrieving profile data: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update function to get public clinic profile by clinic name (slug-friendly)
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
      'treatments', '[]'::json,
      'working_hours', '[]'::json,
      'success', false,
      'message', 'Clinic not found'
    );
  END IF;

  -- Get profile data using the main function
  SELECT public.get_public_clinic_profile(clinic_user_id) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update function to get public clinic profile by username
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
      'treatments', '[]'::json,
      'working_hours', '[]'::json,
      'success', false,
      'message', 'Clinic not found'
    );
  END IF;

  -- Get profile data using the main function
  SELECT public.get_public_clinic_profile(clinic_user_id) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON FUNCTION public.get_public_clinic_profile(UUID) IS 'Returns public clinic profile data including gallery photos, treatments and working hours by user ID';
COMMENT ON FUNCTION public.get_public_clinic_profile_by_name(TEXT) IS 'Returns public clinic profile data including gallery photos, treatments and working hours by clinic name';
COMMENT ON FUNCTION public.get_public_clinic_profile_by_username(TEXT) IS 'Returns public clinic profile data including gallery photos, treatments and working hours by username';