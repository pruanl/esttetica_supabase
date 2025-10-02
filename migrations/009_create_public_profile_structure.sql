-- Migration: Create public profile structure
-- Description: Creates storage buckets, profiles table, and gallery_photos table for public clinic profile

-- 1. Create storage buckets for avatars and gallery
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('gallery', 'gallery', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Create profiles table with one-to-one relationship with users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_name TEXT,
  whatsapp_number TEXT,
  profile_avatar_url TEXT,
  cover_photo_url TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create gallery_photos table
CREATE TABLE IF NOT EXISTS public.gallery_photos (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  photo_url TEXT NOT NULL,
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT,
  is_active BOOLEAN DEFAULT true
);

-- 4. Enable RLS on both tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for profiles table
-- Allow users to read all profiles (public access)
CREATE POLICY "Allow public read access to profiles" ON public.profiles
  FOR SELECT USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Allow users to insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Allow users to update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to delete their own profile
CREATE POLICY "Allow users to delete their own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- 6. Create RLS policies for gallery_photos table
-- Allow public read access to active gallery photos
CREATE POLICY "Allow public read access to gallery photos" ON public.gallery_photos
  FOR SELECT USING (is_active = true);

-- Allow users to insert their own gallery photos
CREATE POLICY "Allow users to insert their own gallery photos" ON public.gallery_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own gallery photos
CREATE POLICY "Allow users to update their own gallery photos" ON public.gallery_photos
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own gallery photos
CREATE POLICY "Allow users to delete their own gallery photos" ON public.gallery_photos
  FOR DELETE USING (auth.uid() = user_id);

-- 7. Create storage policies for avatars bucket
CREATE POLICY "Allow public read access to avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Allow authenticated users to upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Allow users to update their own avatars" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Allow users to delete their own avatars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 8. Create storage policies for gallery bucket
CREATE POLICY "Allow public read access to gallery" ON storage.objects
  FOR SELECT USING (bucket_id = 'gallery');

CREATE POLICY "Allow authenticated users to upload gallery photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'gallery' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Allow users to update their own gallery photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'gallery' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Allow users to delete their own gallery photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'gallery' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 9. Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. Create updated_at trigger for profiles table
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();