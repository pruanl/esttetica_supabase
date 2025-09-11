# Sistema de Migrations

Este diretório contém as migrations do banco de dados para o sistema de estética.

## Estrutura

```
migrations/
├── 001_initial_schema.sql    # Schema inicial (tabelas, índices, RLS)
├── migration_runner.ts       # Runner avançado (futuro)
└── README.md                # Este arquivo
```

## Como Executar Migrations

### Método 1: Script Automatizado (Recomendado)

```bash
# Executar todas as migrations pendentes
npm run migrate:run

# Verificar status
npm run migrate:status
```

### Método 2: Manual no Supabase Dashboard

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para seu projeto
3. Navegue até **SQL Editor**
4. Copie e cole o conteúdo de `001_initial_schema.sql`
5. Execute o SQL

## Migrations Disponíveis

### 001_initial_schema.sql

Cria a estrutura inicial do banco:

**Tabelas:**
- `procedures` - Procedimentos estéticos
- `patients` - Pacientes
- `appointments` - Agendamentos

**Recursos:**
- ✅ Índices para performance
- ✅ Triggers para `updated_at`
- ✅ Row Level Security (RLS)
- ✅ Políticas de acesso por usuário
- ✅ Relacionamentos entre tabelas

## Verificação

Após executar as migrations, verifique se as tabelas foram criadas:

1. No Supabase Dashboard → **Table Editor**
2. Você deve ver as tabelas: `procedures`, `patients`, `appointments`
3. Teste inserindo dados através da aplicação

## Troubleshooting

### Erro de Permissão
- Verifique se as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão corretas no `.env`
- Confirme se o projeto Supabase está ativo

### Tabelas Não Criadas
- Execute manualmente no SQL Editor do Supabase
- Verifique se não há conflitos com tabelas existentes

### RLS Não Funcionando
- Confirme se o usuário está autenticado
- Verifique as políticas no Dashboard → **Authentication** → **Policies**

## Próximas Migrations

Para criar novas migrations:

1. Crie um arquivo `002_nome_da_migration.sql`
2. Siga o padrão de numeração sequencial
3. Inclua comentários explicativos
4. Teste antes de aplicar em produção

## Rollback

Para reverter migrations (use com cuidado):

```sql
-- Exemplo de rollback da migration 001
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS procedures;
DROP FUNCTION IF EXISTS update_updated_at_column();
```

⚠️ **Atenção**: Rollbacks podem causar perda de dados. Sempre faça backup antes.