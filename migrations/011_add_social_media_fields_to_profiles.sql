-- Migration: Add social media fields to profiles table
-- Description: Adds Instagram, TikTok, YouTube, and Facebook URL fields to the profiles table

-- Add social media fields to profiles table
ALTER TABLE profiles 
ADD COLUMN instagram_url TEXT,
ADD COLUMN tiktok_url TEXT,
ADD COLUMN youtube_url TEXT,
ADD COLUMN facebook_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN profiles.instagram_url IS 'Instagram profile URL';
COMMENT ON COLUMN profiles.tiktok_url IS 'TikTok profile URL';
COMMENT ON COLUMN profiles.youtube_url IS 'YouTube channel URL';
COMMENT ON COLUMN profiles.facebook_url IS 'Facebook page URL';