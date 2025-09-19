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