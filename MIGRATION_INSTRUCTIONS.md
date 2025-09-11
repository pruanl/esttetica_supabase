# Instruções para Executar Migração

## Problema Resolvido
O erro `column appointments.is_active does not exist` foi causado porque o código estava tentando usar um campo `is_active` na tabela `appointments` que não existia no banco de dados.

## Solução Implementada
1. ✅ Criada migração `002_add_is_active_to_appointments.sql`
2. ✅ Atualizados os tipos TypeScript
3. ✅ Build testado com sucesso

## Como Executar a Migração

### Passo 1: Acesse o Supabase Dashboard
1. Vá para: https://supabase.com/dashboard
2. Selecione seu projeto
3. Navegue para "SQL Editor"

### Passo 2: Execute a Migração
1. Copie o conteúdo do arquivo: `migrations/002_add_is_active_to_appointments.sql`
2. Cole no SQL Editor do Supabase
3. Clique em "Run" para executar

### Conteúdo da Migração:
```sql
-- Migration: 002_add_is_active_to_appointments
-- Description: Add is_active column to appointments table for soft delete functionality
-- Created: 2024

-- Add is_active column to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for better performance on is_active queries
CREATE INDEX IF NOT EXISTS idx_appointments_is_active ON appointments(is_active);

-- Update existing records to have is_active = true
UPDATE appointments SET is_active = true WHERE is_active IS NULL;
```

### Passo 3: Verificar
Após executar a migração:
1. Vá para "Table Editor" no Supabase Dashboard
2. Selecione a tabela `appointments`
3. Verifique se a coluna `is_active` foi adicionada
4. Teste a aplicação para confirmar que o erro foi resolvido

## O que a Migração Faz
- ✅ Adiciona a coluna `is_active` (BOOLEAN) à tabela `appointments`
- ✅ Define valor padrão como `true`
- ✅ Cria índice para melhor performance
- ✅ Atualiza registros existentes para `is_active = true`

## Funcionalidade do Campo `is_active`
Este campo permite "soft delete" dos agendamentos:
- `true`: Agendamento ativo (visível)
- `false`: Agendamento "excluído" (oculto, mas mantido no banco)

Isso preserva o histórico e permite recuperação de dados se necessário.