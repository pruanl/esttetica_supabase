-- Create public treatments table
-- This table will store treatments/services that appear on the public profile

CREATE TABLE IF NOT EXISTS public.public_treatments (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_public_treatments_user_id ON public.public_treatments(user_id);
CREATE INDEX IF NOT EXISTS idx_public_treatments_active ON public.public_treatments(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_public_treatments_order ON public.public_treatments(user_id, display_order);

-- Enable RLS
ALTER TABLE public.public_treatments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own public treatments" ON public.public_treatments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own public treatments" ON public.public_treatments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own public treatments" ON public.public_treatments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own public treatments" ON public.public_treatments
  FOR DELETE USING (auth.uid() = user_id);

-- Allow public read access for active treatments (for public profile pages)
CREATE POLICY "Public can view active treatments" ON public.public_treatments
  FOR SELECT USING (is_active = true);

-- Add comments
COMMENT ON TABLE public.public_treatments IS 'Treatments/services that appear on public clinic profiles';
COMMENT ON COLUMN public.public_treatments.name IS 'Name of the treatment/service';
COMMENT ON COLUMN public.public_treatments.description IS 'Description of the treatment/service';
COMMENT ON COLUMN public.public_treatments.display_order IS 'Order in which treatments appear on public profile';
COMMENT ON COLUMN public.public_treatments.is_active IS 'Whether the treatment is visible on public profile';