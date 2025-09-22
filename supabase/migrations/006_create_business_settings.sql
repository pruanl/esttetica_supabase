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