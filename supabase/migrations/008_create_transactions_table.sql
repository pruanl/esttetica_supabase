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