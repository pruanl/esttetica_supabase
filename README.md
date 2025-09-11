# Sistema de Gestão para Clínica de Estética

Um sistema completo para gerenciamento de clínicas de estética, desenvolvido com React, TypeScript e Supabase.

## Funcionalidades

- 🔐 **Autenticação**: Login e cadastro de usuários
- 📋 **Dashboard**: Visão geral do sistema
- 💉 **Procedimentos**: Gerenciamento de procedimentos estéticos
- 👥 **Pacientes**: Cadastro e gerenciamento de pacientes (em desenvolvimento)
- 📅 **Agendamentos**: Sistema de agendamento de consultas (em desenvolvimento)
- 🎨 **Interface Moderna**: UI responsiva com Tailwind CSS e shadcn/ui
- 🗄️ **Migrations**: Sistema organizado de migrations para banco de dados

## Tecnologias

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Roteamento**: React Router DOM
- **Ícones**: Lucide React
- **Database**: Sistema de migrations estruturado

## Configuração

### 1. Clone o repositório

```bash
git clone <repository-url>
cd esttetica_supabase
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_supabase_url
VITE_SUPABASE_ANON_KEY=sua_supabase_anon_key
```

### 4. Execute as migrations do banco de dados

```bash
# Método automatizado (recomendado)
npm run migrate:run

# Ou execute manualmente no Supabase Dashboard
# Copie o conteúdo de migrations/001_initial_schema.sql
```

### 5. Execute o projeto

```bash
npm run dev
```

## Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes de UI (shadcn/ui)
│   ├── ProcedureForm.tsx
│   └── ProtectedRoute.tsx
├── contexts/           # Contextos React
│   └── AuthContext.tsx
├── lib/               # Utilitários e configurações
│   ├── supabaseClient.ts
│   └── utils.ts
├── pages/             # Páginas da aplicação
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   ├── SignUp.tsx
│   └── Procedures.tsx
├── services/          # Serviços de API
│   └── proceduresService.ts
├── types/             # Definições de tipos
│   └── database.ts
└── App.tsx            # Componente principal

migrations/             # Sistema de migrations
├── 001_initial_schema.sql
├── migration_runner.ts
└── README.md

scripts/               # Scripts utilitários
└── run-migrations.js
```

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run lint` - Executa o linter
- `npm run preview` - Visualiza o build de produção
- `npm run migrate:run` - Executa migrations pendentes
- `npm run migrate:status` - Verifica status das migrations

## Sistema de Migrations

O projeto utiliza um sistema organizado de migrations para gerenciar mudanças no banco de dados:

- **Versionamento**: Cada migration tem um número sequencial
- **Rastreamento**: Controle de quais migrations foram executadas
- **Rollback**: Possibilidade de reverter mudanças (com cuidado)
- **Documentação**: Cada migration é documentada

Veja `migrations/README.md` para mais detalhes.

## Banco de Dados

### Tabelas Principais

- **procedures**: Procedimentos estéticos oferecidos
- **patients**: Informações dos pacientes
- **appointments**: Agendamentos e consultas

### Recursos Implementados

- ✅ Row Level Security (RLS)
- ✅ Políticas de acesso por usuário
- ✅ Índices para performance
- ✅ Triggers para campos `updated_at`
- ✅ Relacionamentos entre tabelas

## Status de Desenvolvimento

### ✅ Concluído
- Sistema de autenticação
- CRUD de procedimentos
- Interface responsiva
- Sistema de migrations
- Tipagem TypeScript completa

### 🚧 Em Desenvolvimento
- CRUD de pacientes
- Sistema de agendamentos
- Relatórios e dashboards
- Notificações

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
