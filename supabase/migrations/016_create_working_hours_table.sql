-- Create working hours table
-- This table will store the working hours for each day of the week

CREATE TABLE IF NOT EXISTS public.working_hours (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  is_open BOOLEAN DEFAULT true,
  open_time TIME,
  close_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, day_of_week)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_working_hours_user_id ON public.working_hours(user_id);
CREATE INDEX IF NOT EXISTS idx_working_hours_day ON public.working_hours(user_id, day_of_week);

-- Enable RLS
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own working hours" ON public.working_hours
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own working hours" ON public.working_hours
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own working hours" ON public.working_hours
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own working hours" ON public.working_hours
  FOR DELETE USING (auth.uid() = user_id);

-- Allow public read access (for public profile pages)
CREATE POLICY "Public can view working hours" ON public.working_hours
  FOR SELECT USING (true);

-- Add comments
COMMENT ON TABLE public.working_hours IS 'Working hours for each day of the week for clinic profiles';
COMMENT ON COLUMN public.working_hours.day_of_week IS 'Day of week: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';
COMMENT ON COLUMN public.working_hours.is_open IS 'Whether the clinic is open on this day';
COMMENT ON COLUMN public.working_hours.open_time IS 'Opening time for this day';
COMMENT ON COLUMN public.working_hours.close_time IS 'Closing time for this day';