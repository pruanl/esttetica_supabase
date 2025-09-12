# Anotações de Desenvolvimento - Esttetica Sistema

## Parte 1 - Concluída ✅

### Estrutura do Projeto
- **Framework**: React + TypeScript + Vite
- **Styling**: TailwindCSS + ShadCN/UI
- **Backend**: Supabase
- **Autenticação**: Context API (AuthContext)
- **Roteamento**: React Router DOM

### Componentes Principais Implementados

#### 1. Layout e Navegação
- **Layout.tsx**: Layout principal com sidebar desktop e bottom nav mobile
- **BottomNav.tsx**: Navegação inferior mobile-first com 4 tabs principais
- **AppSidebar.tsx**: Sidebar para desktop
- **Sidebar.tsx**: Componente base do sidebar

#### 2. Páginas Principais
- **Dashboard.tsx**: Página inicial com cards de navegação e calendário
- **Appointments.tsx**: Gestão de agendamentos
- **Patients.tsx**: Gestão de pacientes
- **Procedures.tsx**: Gestão de procedimentos
- **Settings.tsx**: Configurações básicas

#### 3. Componentes Específicos
- **DashboardCalendar.tsx**: Calendário FullCalendar responsivo
- **AppointmentDialog.tsx**: Modal para agendamentos
- **AppointmentForm.tsx**: Formulário de agendamentos
- **PatientForm.tsx**: Formulário de pacientes
- **ProcedureForm.tsx**: Formulário de procedimentos

### Padrões de Design Estabelecidos

#### Responsividade
- **Mobile-first**: Todas as interfaces começam mobile e expandem para desktop
- **Breakpoints**: `md:` para desktop (768px+)
- **Padding responsivo**: `p-3 md:p-6`
- **Texto responsivo**: `text-lg md:text-xl`
- **Grid responsivo**: `grid-cols-2 md:grid-cols-4`

#### Navegação
- **Desktop**: Sidebar fixa à esquerda
- **Mobile**: Bottom navigation com 4 tabs principais
- **Menu secundário**: Sheet component para opções menos frequentes
- **Tabs principais**: Dashboard, Agenda, Pacientes, Mais

#### Componentes UI (ShadCN)
- **Card**: Container principal para seções
- **Button**: Botões com variantes (default, outline, ghost)
- **Sheet**: Modal lateral para menus secundários
- **Dialog**: Modais para formulários
- **Input**: Campos de entrada padronizados
- **Select**: Dropdowns padronizados
- **Calendar**: Seletor de datas

#### Ícones
- **Biblioteca**: Lucide React
- **Tamanho padrão**: `h-4 w-4` para ícones pequenos, `h-5 w-5` para médios
- **Ícones principais**:
  - Dashboard: LayoutDashboard
  - Agenda: Calendar
  - Pacientes: Users
  - Mais: MoreHorizontal
  - Configurações: Settings
  - Sair: LogOut

### Estrutura de Dados

#### Tipos Principais
- **Patient**: id, name, email, phone, birth_date, address, notes
- **Procedure**: id, name, description, duration_minutes, price
- **Appointment**: id, patient_id, procedure_id, appointment_date, status, notes

#### Status de Agendamentos
- **scheduled**: Agendado (azul)
- **confirmed**: Confirmado (verde)
- **completed**: Concluído (cinza)
- **cancelled**: Cancelado (vermelho)

### Serviços
- **appointmentsService**: CRUD de agendamentos
- **patientsService**: CRUD de pacientes
- **proceduresService**: CRUD de procedimentos

### Configurações do Calendário
- **FullCalendar**: Configurado para português brasileiro
- **Visualizações**: Mês (padrão), Semana, Dia
- **Responsivo**: Header adaptativo para mobile
- **Cores**: Sistema de cores por status
- **Horário**: 08:00-20:00, formato 24h

### Melhorias de UX Implementadas
- **Loading states**: Indicadores de carregamento
- **Error handling**: Tratamento básico de erros
- **Feedback visual**: Cores por status, hover effects
- **Acessibilidade**: Navegação por teclado, labels apropriados

### Próximas Partes - Diretrizes

#### Manter Consistência
1. **Usar os mesmos padrões de responsividade**
2. **Seguir a estrutura de componentes ShadCN**
3. **Manter o sistema de cores estabelecido**
4. **Usar os mesmos ícones e tamanhos**
5. **Seguir a estrutura de serviços**

#### Padrões de Código
- **TypeScript**: Sempre tipar interfaces e props
- **Hooks**: useState, useEffect, useAuth consistentes
- **Error handling**: try/catch em operações async
- **Loading**: Estados de loading para operações demoradas

#### Estrutura de Arquivos
```
src/
├── components/     # Componentes reutilizáveis
├── pages/         # Páginas principais
├── services/      # Serviços de API
├── contexts/      # Contexts do React
├── types/         # Tipos TypeScript
├── lib/          # Utilitários e configurações
└── hooks/        # Custom hooks
```

---

## Módulo 3 - Calculadora de Preços e Simulador ✅

### Funcionalidades Implementadas

#### 1. Calculadora de Preço Sugerido no ProcedureForm
- **Accordion "Calculadora de Preço Sugerido"** integrado ao formulário de procedimentos
- **Campo de Custo de Material**: Input para inserir custos de materiais necessários
- **Cálculos Automáticos em Tempo Real**:
  - Custo do Tempo de Trabalho: baseado no custo/hora da profissional
  - Custo Total: tempo + materiais
  - Preço Sugerido: custo total + margem de lucro configurada
- **Botão "Preencher Preço Automaticamente"**: aplica o preço calculado ao campo principal
- **Integração com Dados Financeiros**: busca automática de configurações de custo/hora e margem

#### 2. Simulador de Preços Autônomo
- **Página Independente**: `/tools/price-simulator` (PriceSimulatorPage.tsx)
- **Layout Responsivo**: duas colunas (inputs à esquerda, resultados à direita)
- **Inputs Dinâmicos**:
  - Campo de tempo estimado (minutos)
  - Seção de materiais com botão "Adicionar Material"
  - Linhas dinâmicas com nome e custo de produtos
  - Campo editável de margem de lucro
- **Cálculos em Tempo Real com useMemo**:
  - Custo do Tempo: (custo/hora ÷ 60) × minutos
  - Custo de Materiais: soma de todos os materiais
  - Preço Mínimo: tempo + materiais
  - Valor do Lucro: preço mínimo × margem
  - Preço de Venda Sugerido: preço mínimo + lucro

#### 3. Integração de Navegação
- **Rota Protegida**: `/tools/price-simulator` configurada no App.tsx
- **Menu Mobile**: link "Calculadora Rápida" no Sheet do BottomNav
- **Menu Desktop**: item "Calculadora Rápida" na AppSidebar
- **Breadcrumb**: "Simulador de Preços" no Layout
- **Ícones Diferenciados**: Calculator para simulador, TrendingUp para config. financeiras

### Arquivos Criados/Modificados

#### Novos Arquivos
- **src/pages/tools/PriceSimulatorPage.tsx**: Página completa do simulador

#### Arquivos Modificados
- **src/components/ProcedureForm.tsx**: Adicionada calculadora integrada
- **src/App.tsx**: Nova rota protegida
- **src/components/BottomNav.tsx**: Link no menu mobile
- **src/components/AppSidebar.tsx**: Link no menu desktop
- **src/components/Layout.tsx**: Breadcrumb atualizado

### Padrões Técnicos Estabelecidos

#### Cálculos Financeiros
- **Custo por Hora**: Obtido via businessSettingsService
- **Fórmula Padrão**: (Custo/Hora ÷ 60) × Minutos + Materiais
- **Margem de Lucro**: Percentual aplicado sobre custo total
- **Atualização em Tempo Real**: useMemo para performance

#### UX/UI Patterns
- **Accordion para Funcionalidades Extras**: Mantém formulários limpos
- **Inputs Dinâmicos**: Botões de adicionar/remover para listas
- **Feedback Visual**: Resultados destacados em cards
- **Responsividade**: Layout adaptativo mobile/desktop

---

**Data de conclusão da Parte 1**: $(date)
**Status**: ✅ Concluída e testada
**Build**: ✅ Funcionando (npm run build)
**Preview**: ✅ Responsivo em todas as telas

## Parte 2 - Concluída ✅

### Widget de Aniversariantes

#### Componente BirthdayWidget.tsx
- **Funcionalidade**: Exibe pacientes que fazem aniversário no mês atual
- **Integração**: Conectado ao Supabase via patientsService
- **Filtro**: Busca e filtra pacientes por mês de nascimento
- **UI**: Card do ShadCN com lista de aniversariantes
- **Estados**: Loading, erro e lista vazia tratados
- **Responsivo**: Adaptado para mobile e desktop

#### Integração no Dashboard
- **Layout**: Adicionado à grade principal do Dashboard
- **Posicionamento**: Junto com SeedDataButton e DashboardCalendar
- **Estilo**: Consistente com outros cards do sistema

#### Correções de Funcionalidade
- **Edição de Pacientes**: Corrigido problema que criava novos registros ao invés de editar
- **Modal vs Navegação**: Separado botões de ação para evitar conflitos
- **Botões de Ação**: 
  - Eye (👁️): Ver detalhes (navega para página)
  - Edit (✏️): Editar (abre modal)
  - Trash2 (🗑️): Excluir (confirmação)
- **Ícones**: Padronizado com Lucide React para consistência visual

#### Melhorias de UX
- **Títulos explicativos**: Tooltips nos botões de ação
- **Separação clara**: Funcionalidades distintas para cada botão
- **Feedback visual**: Estados de loading e erro apropriados

---

**Data de conclusão da Parte 2**: $(date)
**Status**: ✅ Concluída e testada
**Funcionalidades**: ✅ Widget de aniversariantes, edição de pacientes corrigida
**UI/UX**: ✅ Ícones padronizados, botões de ação organizados

## Parte 3 - Em Desenvolvimento 🚧

### Próximas Funcionalidades
- [ ] A definir conforme necessidades do projeto
- [ ] Manter padrões estabelecidos nas partes anteriores
- [ ] Seguir diretrizes de responsividade e UX

---

**Início da Parte 3**: $(date)
**Status**: 🚧 Em desenvolvimento