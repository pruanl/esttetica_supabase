-- ========================================
-- Migration: 001_initial_schema.sql
-- ========================================

-- Migration: 001_initial_schema
-- Description: Create initial database schema for aesthetic clinic management
-- Created: 2024

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create procedures table
CREATE TABLE IF NOT EXISTS procedures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  birth_date DATE,
  address TEXT,
  medical_history TEXT,
  allergies TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  procedure_id UUID NOT NULL REFERENCES procedures(id) ON DELETE RESTRICT,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  total_price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_procedures_user_id ON procedures(user_id);
CREATE INDEX IF NOT EXISTS idx_procedures_category ON procedures(category);
CREATE INDEX IF NOT EXISTS idx_procedures_is_active ON procedures(is_active);

CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_patients_is_active ON patients(is_active);

CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_procedure_id ON appointments(procedure_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_procedures_updated_at
  BEFORE UPDATE ON procedures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for procedures
CREATE POLICY "Users can view their own procedures" ON procedures
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own procedures" ON procedures
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own procedures" ON procedures
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own procedures" ON procedures
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for patients
CREATE POLICY "Users can view their own patients" ON patients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own patients" ON patients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patients" ON patients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own patients" ON patients
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for appointments
CREATE POLICY "Users can view their own appointments" ON appointments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own appointments" ON appointments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments" ON appointments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointments" ON appointments
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- Migration: 002_add_is_active_to_appointments.sql
-- ========================================

-- Migration: 002_add_is_active_to_appointments
-- Description: Add is_active column to appointments table for soft delete functionality
-- Created: 2024

-- Add is_active column to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for better performance on is_active queries
CREATE INDEX IF NOT EXISTS idx_appointments_is_active ON appointments(is_active);

-- Update existing records to have is_active = true
UPDATE appointments SET is_active = true WHERE is_active IS NULL;

-- ========================================
-- Migration: 003_create_fixed_expenses.sql
-- ========================================

-- Migration: Create fixed_expenses table
-- Description: Table to store user's fixed monthly expenses for cost calculation

-- Create the fixed_expenses table
CREATE TABLE IF NOT EXISTS public.fixed_expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    category TEXT,
    user_id UUID DEFAULT auth.uid() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.fixed_expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy for SELECT: Users can only view their own expenses
CREATE POLICY "Users can view own fixed expenses" ON public.fixed_expenses
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for INSERT: Users can only insert their own expenses
CREATE POLICY "Users can insert own fixed expenses" ON public.fixed_expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE: Users can only update their own expenses
CREATE POLICY "Users can update own fixed expenses" ON public.fixed_expenses
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy for DELETE: Users can only delete their own expenses
CREATE POLICY "Users can delete own fixed expenses" ON public.fixed_expenses
    FOR DELETE USING (auth.uid() = user_id);

-- Create index for better performance on user_id queries
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_user_id ON public.fixed_expenses(user_id);

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_category ON public.fixed_expenses(category);

-- Grant necessary permissions
GRANT ALL ON public.fixed_expenses TO authenticated;
GRANT ALL ON public.fixed_expenses TO service_role;

-- ========================================
-- Migration: 004_add_cost_to_procedures.sql
-- ========================================

-- Migration: Add cost column to procedures table
-- Description: Add material cost column to procedures for profit calculation

-- Add cost column to procedures table
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2) DEFAULT 0.00;

-- Add comment to the column
COMMENT ON COLUMN procedures.cost IS 'Material cost for the procedure';

-- Update existing procedures to have a default cost of 0
UPDATE procedures SET cost = 0.00 WHERE cost IS NULL;

-- ========================================
-- Migration: 005_create_profit_calculation_function.sql
-- ========================================

-- Migration: Create profit calculation function
-- Description: Function to calculate appointment profit based on fixed expenses and procedure costs

-- Create the profit calculation function
CREATE OR REPLACE FUNCTION calculate_appointment_profit(appointment_id_param int8)
RETURNS JSON AS $$
DECLARE
    appointment_user_id UUID;
    total_fixed_expenses DECIMAL(10,2) := 0;
    cost_per_hour DECIMAL(10,2) := 0;
    procedure_price DECIMAL(10,2) := 0;
    procedure_cost DECIMAL(10,2) := 0;
    procedure_duration INTEGER := 0;
    time_cost DECIMAL(10,2) := 0;
    total_cost DECIMAL(10,2) := 0;
    profit DECIMAL(10,2) := 0;
    result JSON;
BEGIN
    -- 1. Get user_id from appointment
    SELECT user_id INTO appointment_user_id
    FROM appointments
    WHERE id = appointment_id_param::UUID;
    
    -- Check if appointment exists
    IF appointment_user_id IS NULL THEN
        RETURN json_build_object(
            'error', 'Appointment not found',
            'appointment_id', appointment_id_param
        );
    END IF;
    
    -- 2. Calculate total fixed expenses for the user
    SELECT COALESCE(SUM(amount), 0) INTO total_fixed_expenses
    FROM fixed_expenses
    WHERE user_id = appointment_user_id;
    
    -- 3. Calculate cost per hour (assuming 160 hours per month)
    cost_per_hour := total_fixed_expenses / 160;
    
    -- 4. Get procedure details (price, cost, duration)
    SELECT p.price, COALESCE(p.cost, 0), p.duration_minutes
    INTO procedure_price, procedure_cost, procedure_duration
    FROM appointments a
    JOIN procedures p ON a.procedure_id = p.id
    WHERE a.id = appointment_id_param::UUID;
    
    -- Check if procedure data was found
    IF procedure_price IS NULL THEN
        RETURN json_build_object(
            'error', 'Procedure data not found for appointment',
            'appointment_id', appointment_id_param
        );
    END IF;
    
    -- 5. Calculate time cost = (cost_per_hour / 60) * duration_in_minutes
    time_cost := (cost_per_hour / 60) * procedure_duration;
    
    -- 6. Calculate total cost = time_cost + material_cost
    total_cost := time_cost + procedure_cost;
    
    -- 7. Calculate profit = price - total_cost
    profit := procedure_price - total_cost;
    
    -- 8. Return JSON with all calculated values
    result := json_build_object(
        'price', procedure_price,
        'material_cost', procedure_cost,
        'time_cost', time_cost,
        'total_cost', total_cost,
        'profit', profit,
        'fixed_expenses_total', total_fixed_expenses,
        'cost_per_hour', cost_per_hour,
        'duration_minutes', procedure_duration
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'error', 'Error calculating profit: ' || SQLERRM,
            'appointment_id', appointment_id_param
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION calculate_appointment_profit(int8) TO authenticated;

-- ========================================
-- Migration: 006_create_business_settings.sql
-- ========================================

-- Criar tabela business_settings para configurações financeiras do negócio
CREATE TABLE business_settings (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    work_days_per_week INTEGER NOT NULL DEFAULT 5,
    work_hours_per_day NUMERIC(4,2) NOT NULL DEFAULT 8.0,
    desired_profit_margin NUMERIC(5,4) NOT NULL DEFAULT 0.30
);

-- Habilitar RLS
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas suas próprias configurações
CREATE POLICY "Users can view own business settings" ON business_settings
    FOR SELECT USING (auth.uid() = id);

-- Política para permitir que usuários insiram suas próprias configurações
CREATE POLICY "Users can insert own business settings" ON business_settings
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Política para permitir que usuários atualizem suas próprias configurações
CREATE POLICY "Users can update own business settings" ON business_settings
    FOR UPDATE USING (auth.uid() = id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at na tabela business_settings
CREATE TRIGGER update_business_settings_updated_at
    BEFORE UPDATE ON business_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE business_settings IS 'Configurações financeiras e de trabalho do negócio por usuário';
COMMENT ON COLUMN business_settings.work_days_per_week IS 'Número de dias trabalhados por semana (ex: 5)';
COMMENT ON COLUMN business_settings.work_hours_per_day IS 'Horas trabalhadas por dia (ex: 8.5)';
COMMENT ON COLUMN business_settings.desired_profit_margin IS 'Margem de lucro desejada como decimal (ex: 0.30 para 30%)';

-- ========================================
-- Migration: 007_add_reminder_sent_to_appointments.sql
-- ========================================

-- Migration: Add reminder_sent column to appointments table
-- This column will track whether a reminder has been sent for each appointment

ALTER TABLE appointments 
ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE;

-- Add comment to document the purpose of this column
COMMENT ON COLUMN appointments.reminder_sent IS 'Tracks whether a reminder has been sent for this appointment';

-- ========================================
-- Migration: 008_create_transactions_table.sql
-- ========================================

-- ========================================
-- Migration: 008_create_transactions_table.sql
-- Descrição: Cria a tabela transactions para o fluxo de caixa
-- ========================================

-- Criar a tabela transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    entry_date DATE DEFAULT CURRENT_DATE NOT NULL,
    user_id UUID DEFAULT auth.uid() NOT NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_entry_date ON public.transactions(entry_date);
CREATE INDEX IF NOT EXISTS idx_transactions_appointment_id ON public.transactions(appointment_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Política para SELECT (usuário só vê suas próprias transações)
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Política para INSERT (usuário só pode criar transações para si mesmo)
CREATE POLICY "Users can insert own transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE (usuário só pode atualizar suas próprias transações)
CREATE POLICY "Users can update own transactions" ON public.transactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para DELETE (usuário só pode deletar suas próprias transações)
CREATE POLICY "Users can delete own transactions" ON public.transactions
    FOR DELETE USING (auth.uid() = user_id);

-- Comentários para documentação
COMMENT ON TABLE public.transactions IS 'Tabela para registrar transações financeiras (entradas e saídas)';
COMMENT ON COLUMN public.transactions.type IS 'Tipo da transação: income (entrada) ou expense (saída)';
COMMENT ON COLUMN public.transactions.amount IS 'Valor da transação (sempre positivo, o tipo define se é entrada ou saída)';
COMMENT ON COLUMN public.transactions.entry_date IS 'Data da transação (pode ser diferente da data de criação)';
COMMENT ON COLUMN public.transactions.appointment_id IS 'Referência opcional ao agendamento relacionado';

-- ========================================
-- Migration: 009_create_public_profile_structure.sql
-- ========================================

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

-- ========================================
-- Migration: 010_add_address_fields_to_profiles.sql
-- ========================================

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

-- ========================================
-- Migration: 011_add_social_media_fields_to_profiles.sql
-- ========================================

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

-- ========================================
-- Migration: 012_create_public_profile_api.sql
-- ========================================

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
    ) ORDER BY created_at DESC
  ) INTO gallery_data
  FROM public.gallery_photos 
  WHERE user_id = clinic_user_id 
    AND is_active = true;

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

-- ========================================
-- Migration: 013_add_username_to_profiles.sql
-- ========================================

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

-- ========================================
-- Migration: 014_add_about_field_to_profiles.sql
-- ========================================

-- Add about field to profiles table
-- This field will store a description about the clinic or professional

-- Add the about column to the profiles table
ALTER TABLE public.profiles
ADD COLUMN about TEXT;

-- Add comment to the column
COMMENT ON COLUMN public.profiles.about IS 'Description about the clinic or professional';

-- ========================================
-- Migration: 014_create_message_templates.sql
-- ========================================

-- Migration 014: Create message templates table
-- This migration creates a table to store customizable message templates for WhatsApp reminders

-- Create message_templates table
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_type VARCHAR(50) NOT NULL DEFAULT 'reminder',
  message_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_message_templates_user_id ON message_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_message_templates_type ON message_templates(template_type);

-- Enable RLS
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own message templates" ON message_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own message templates" ON message_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own message templates" ON message_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own message templates" ON message_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Insert default message template for existing users
INSERT INTO message_templates (user_id, template_type, message_template)
SELECT 
  id as user_id,
  'reminder' as template_type,
  'Olá {nome}! 👋

Este é um lembrete do seu agendamento para amanhã, dia {data}.

Nos vemos em breve! 😊

Se precisar reagendar, entre em contato conosco.' as message_template
FROM auth.users
WHERE id NOT IN (
  SELECT user_id FROM message_templates WHERE template_type = 'reminder'
);

-- Add comment to table
COMMENT ON TABLE message_templates IS 'Stores customizable message templates for WhatsApp reminders and other communications';
COMMENT ON COLUMN message_templates.template_type IS 'Type of template: reminder, birthday, etc.';
COMMENT ON COLUMN message_templates.message_template IS 'Template text with placeholders like {nome}, {data}, etc.';

-- ========================================
-- Migration: 015_create_public_treatments_table.sql
-- ========================================

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

-- ========================================
-- Migration: 015_create_subscriptions_table.sql
-- ========================================

-- Migration: Create subscriptions table for Stripe integration
-- Description: Creates the subscriptions table to manage user subscriptions with Stripe
-- Author: System
-- Date: 2024

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    status TEXT,
    plan_name TEXT,
    price_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy: Users can only read their own subscription data
CREATE POLICY "Users can view own subscription" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Only authenticated users can insert their own subscription (for system use)
CREATE POLICY "System can insert subscriptions" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Only system can update subscriptions (typically via webhooks)
CREATE POLICY "System can update subscriptions" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Only system can delete subscriptions
CREATE POLICY "System can delete subscriptions" ON public.subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON public.subscriptions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT INSERT ON public.subscriptions TO authenticated;
GRANT UPDATE ON public.subscriptions TO authenticated;
GRANT DELETE ON public.subscriptions TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.subscriptions IS 'Stores user subscription information for Stripe integration';
COMMENT ON COLUMN public.subscriptions.user_id IS 'Reference to the user who owns this subscription';
COMMENT ON COLUMN public.subscriptions.stripe_customer_id IS 'Stripe customer ID for this user';
COMMENT ON COLUMN public.subscriptions.stripe_subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN public.subscriptions.status IS 'Subscription status (active, canceled, past_due, etc.)';
COMMENT ON COLUMN public.subscriptions.plan_name IS 'Name of the subscription plan';
COMMENT ON COLUMN public.subscriptions.price_id IS 'Stripe price ID for the subscription';

-- ========================================
-- Migration: 016_create_working_hours_table.sql
-- ========================================

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

-- ========================================
-- Migration: 016_update_subscriptions_table.sql
-- ========================================

-- Migration: Update subscriptions table with additional fields
-- Description: Adds missing fields for billing page functionality
-- Author: System
-- Date: 2024

-- Add missing columns to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS plan_type TEXT CHECK (plan_type IN ('monthly', 'yearly'));

-- Update existing records with default values (you can adjust these as needed)
UPDATE public.subscriptions 
SET 
  current_period_start = created_at,
  current_period_end = created_at + INTERVAL '1 month',
  plan_type = 'monthly'
WHERE current_period_start IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.subscriptions.current_period_start IS 'Start date of current billing period';
COMMENT ON COLUMN public.subscriptions.current_period_end IS 'End date of current billing period';
COMMENT ON COLUMN public.subscriptions.plan_type IS 'Type of subscription plan: monthly or yearly';

-- Create index for better performance on period queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON public.subscriptions(current_period_end);

-- ========================================
-- Migration: 017_create_cancellation_feedback_table.sql
-- ========================================

-- Migration: Create cancellation feedback table
-- Description: Creates table to store user feedback when canceling subscriptions
-- Author: System
-- Date: 2024

-- Create cancellation_feedback table
CREATE TABLE IF NOT EXISTS public.cancellation_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    reason TEXT CHECK (reason IN (
        'no_time_to_test',
        'platform_complicated',
        'missing_functionality',
        'price_not_suitable',
        'using_other_solution',
        'other'
    )),
    other_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cancellation_feedback_user_id ON public.cancellation_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_feedback_subscription_id ON public.cancellation_feedback(subscription_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_feedback_reason ON public.cancellation_feedback(reason);

-- Enable Row Level Security (RLS)
ALTER TABLE public.cancellation_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy: Users can only read their own feedback
CREATE POLICY "Users can view own cancellation feedback" ON public.cancellation_feedback
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own feedback
CREATE POLICY "Users can insert own cancellation feedback" ON public.cancellation_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT ON public.cancellation_feedback TO authenticated;
GRANT INSERT ON public.cancellation_feedback TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.cancellation_feedback IS 'Stores user feedback when canceling subscriptions';
COMMENT ON COLUMN public.cancellation_feedback.user_id IS 'Reference to the user who provided feedback';
COMMENT ON COLUMN public.cancellation_feedback.subscription_id IS 'Reference to the canceled subscription';
COMMENT ON COLUMN public.cancellation_feedback.reason IS 'Predefined reason for cancellation';
COMMENT ON COLUMN public.cancellation_feedback.other_reason IS 'Custom reason when "other" is selected';

-- ========================================
-- Migration: 017_update_public_profile_api.sql
-- ========================================

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

-- ========================================
-- Migration: 018_add_cancellation_fields.sql
-- ========================================

-- Migration: Add cancellation fields to subscriptions table
-- Description: Adds fields to handle cancellation requests and status
-- Author: System
-- Date: 2024

-- Add cancellation-related columns
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS cancellation_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN public.subscriptions.cancellation_requested_at IS 'When the user requested cancellation';
COMMENT ON COLUMN public.subscriptions.cancellation_reason IS 'Reason provided by user for cancellation';
COMMENT ON COLUMN public.subscriptions.cancel_at_period_end IS 'Whether subscription will cancel at period end';
COMMENT ON COLUMN public.subscriptions.canceled_at IS 'When the subscription was actually canceled';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_cancellation_requested ON public.subscriptions(cancellation_requested_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_cancel_at_period_end ON public.subscriptions(cancel_at_period_end);

-- ========================================
-- Migration: 019_add_cancellation_requested_status.sql
-- ========================================

-- Migration: Add cancellation_requested status to subscriptions table
-- This allows tracking when a user has requested cancellation within 14 days

-- Since the original table uses TEXT for status, we don't need to modify an enum
-- The status field already accepts any text value

-- Add a check constraint to ensure valid status values
ALTER TABLE subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_status_check 
CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete', 'cancellation_requested'));

-- Update the status column comment
COMMENT ON COLUMN subscriptions.status IS 'Current subscription status - cancellation_requested indicates user requested cancellation within 14 days';

-- ========================================
-- Migration: 020_create_subscription_history.sql
-- ========================================

-- Migration: Create subscription_history table for tracking all subscription changes
-- This table will store every subscription event (created, updated, cancelled, etc.)

-- Create subscription_history table
CREATE TABLE IF NOT EXISTS public.subscription_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT NOT NULL,
    stripe_subscription_id TEXT,
    stripe_checkout_session_id TEXT,
    event_type TEXT NOT NULL, -- 'created', 'updated', 'cancelled', 'reactivated', etc.
    status TEXT NOT NULL, -- 'active', 'canceled', 'past_due', 'unpaid', 'incomplete', etc.
    plan_name TEXT,
    price_id TEXT,
    amount_paid DECIMAL(10,2),
    currency TEXT DEFAULT 'BRL',
    billing_cycle TEXT, -- 'monthly', 'yearly'
    event_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stripe_event_id TEXT, -- Store the Stripe event ID for deduplication
    metadata JSONB, -- Store additional Stripe metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON public.subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_stripe_customer_id ON public.subscription_history(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_stripe_subscription_id ON public.subscription_history(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_event_date ON public.subscription_history(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_history_stripe_event_id ON public.subscription_history(stripe_event_id);

-- Enable RLS
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own subscription history" ON public.subscription_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscription history" ON public.subscription_history
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON public.subscription_history TO authenticated;
GRANT INSERT ON public.subscription_history TO authenticated;
GRANT UPDATE ON public.subscription_history TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.subscription_history IS 'Complete history of all subscription events and changes';
COMMENT ON COLUMN public.subscription_history.user_id IS 'Reference to the user who owns this subscription';
COMMENT ON COLUMN public.subscription_history.stripe_customer_id IS 'Stripe customer ID';
COMMENT ON COLUMN public.subscription_history.stripe_subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN public.subscription_history.event_type IS 'Type of subscription event (created, updated, cancelled, etc.)';
COMMENT ON COLUMN public.subscription_history.status IS 'Subscription status at the time of this event';
COMMENT ON COLUMN public.subscription_history.stripe_event_id IS 'Stripe webhook event ID for deduplication';

-- ========================================
-- Migration: 021_update_subscriptions_table.sql
-- ========================================

-- Migration: Update subscriptions table to focus on current status only
-- The subscription_history table will handle all historical data

-- Add new columns for better current status tracking
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP WITH TIME ZONE;

-- Add index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON public.subscriptions(current_period_end);

-- Update comments to reflect new purpose
COMMENT ON TABLE public.subscriptions IS 'Current subscription status for each user (one record per user)';
COMMENT ON COLUMN public.subscriptions.current_period_start IS 'Start of current billing period';
COMMENT ON COLUMN public.subscriptions.current_period_end IS 'End of current billing period';
COMMENT ON COLUMN public.subscriptions.cancel_at_period_end IS 'Whether subscription will cancel at period end';
COMMENT ON COLUMN public.subscriptions.cancelled_at IS 'When the subscription was cancelled';

-- Create or replace function to get user's current subscription
CREATE OR REPLACE FUNCTION get_user_current_subscription(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status TEXT,
    plan_name TEXT,
    price_id TEXT,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.user_id,
        s.stripe_customer_id,
        s.stripe_subscription_id,
        s.status,
        s.plan_name,
        s.price_id,
        s.current_period_start,
        s.current_period_end,
        s.cancel_at_period_end,
        s.created_at,
        s.updated_at
    FROM public.subscriptions s
    WHERE s.user_id = user_uuid
    AND s.status IN ('active', 'trialing', 'past_due')
    ORDER BY s.updated_at DESC
    LIMIT 1;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_current_subscription(UUID) TO authenticated;

-- ========================================
-- Migration: 022_add_next_billing_date.sql
-- ========================================

-- Migration: Add next_billing_date field to subscriptions table
-- This field will store the next billing date extracted from Stripe webhooks

-- Add next_billing_date column to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN next_billing_date TIMESTAMPTZ;

-- Add comment to document the field
COMMENT ON COLUMN subscriptions.next_billing_date IS 'Next billing date extracted from Stripe current_period_end';

-- Create index for better query performance
CREATE INDEX idx_subscriptions_next_billing_date ON subscriptions(next_billing_date);

-- Drop existing function first to avoid return type conflict
DROP FUNCTION IF EXISTS get_user_current_subscription(UUID);

-- Update the get_user_current_subscription function to include next_billing_date
CREATE OR REPLACE FUNCTION get_user_current_subscription(user_uuid UUID)
RETURNS TABLE (
  id BIGINT,
  user_id UUID,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT,
  plan_name TEXT,
  price_id TEXT,
  billing_cycle TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    s.stripe_customer_id,
    s.stripe_subscription_id,
    s.status,
    s.plan_name,
    s.price_id,
    s.billing_cycle,
    s.current_period_start,
    s.current_period_end,
    s.next_billing_date,
    s.cancel_at_period_end,
    s.created_at,
    s.updated_at
  FROM subscriptions s
  WHERE s.user_id = user_uuid
    AND s.status IN ('active', 'trialing', 'past_due', 'cancellation_requested')
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_current_subscription(UUID) TO authenticated;

-- ========================================
-- Migration: 023_add_billing_cycle_column.sql
-- ========================================

-- Migration: Add billing_cycle column to subscriptions table
-- This field will store the billing cycle (daily, weekly, monthly, yearly) from Stripe

-- Add billing_cycle column to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN billing_cycle TEXT;

-- Add comment to document the field
COMMENT ON COLUMN subscriptions.billing_cycle IS 'Billing cycle from Stripe (daily, weekly, monthly, yearly)';

-- Create index for better query performance
CREATE INDEX idx_subscriptions_billing_cycle ON subscriptions(billing_cycle);

-- Drop existing function first to avoid return type conflict
DROP FUNCTION IF EXISTS get_user_current_subscription(UUID);

-- Update the get_user_current_subscription function to include billing_cycle
CREATE OR REPLACE FUNCTION get_user_current_subscription(user_uuid UUID)
RETURNS TABLE (
  id BIGINT,
  user_id UUID,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT,
  plan_name TEXT,
  price_id TEXT,
  billing_cycle TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    s.stripe_customer_id,
    s.stripe_subscription_id,
    s.status,
    s.plan_name,
    s.price_id,
    s.billing_cycle,
    s.current_period_start,
    s.current_period_end,
    s.next_billing_date,
    s.cancel_at_period_end,
    s.created_at,
    s.updated_at
  FROM subscriptions s
  WHERE s.user_id = user_uuid
    AND s.status IN ('active', 'trialing', 'past_due', 'cancellation_requested')
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_current_subscription(UUID) TO authenticated;

