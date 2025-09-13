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

