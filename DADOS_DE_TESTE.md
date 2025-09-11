# 📊 Dados de Teste - Sistema Esttetica

Este documento explica como gerar e gerenciar dados de teste para o sistema de gestão estética.

## 🎯 Opções Disponíveis

### 1. Interface Web (Recomendado)

A maneira mais fácil é usar o botão "Gerar Dados de Teste" disponível no Dashboard:

1. Faça login no sistema
2. Acesse o Dashboard
3. Clique em "Gerar Dados de Teste"
4. Aguarde a confirmação

### 2. Script Node.js

Para executar via linha de comando:

```bash
# Instalar dependências necessárias
npm install @supabase/supabase-js dotenv

# Executar o script
node scripts/seed-data.js
```

### 3. Função TypeScript

Para desenvolvedores que querem integrar no código:

```typescript
import { seedTestData, clearTestData } from './src/utils/seedData'

// Gerar dados
const result = await seedTestData()
console.log(`Inseridos: ${result.patients} pacientes, ${result.procedures} procedimentos, ${result.appointments} agendamentos`)

// Limpar dados
await clearTestData()
```

## 📋 Dados Gerados

### Pacientes (8 registros)
- Maria Silva
- Ana Costa
- Carla Oliveira
- Juliana Santos
- Fernanda Lima
- Patricia Rocha
- Beatriz Almeida
- Camila Ferreira

### Procedimentos (10 registros)
- Limpeza de Pele (60min - R$ 120)
- Peeling Químico (45min - R$ 180)
- Hidratação Facial (50min - R$ 100)
- Microagulhamento (90min - R$ 250)
- Radiofrequência (75min - R$ 200)
- Drenagem Linfática Facial (40min - R$ 80)
- Aplicação de Botox (30min - R$ 400)
- Preenchimento com Ácido Hialurônico (45min - R$ 600)
- Massagem Relaxante Facial (35min - R$ 90)
- Tratamento Anti-idade (120min - R$ 350)

### Agendamentos (20 registros)
- Distribuídos nos próximos 30 dias
- Horários entre 9h e 18h
- Status variados: agendado (70%), concluído (20%), cancelado (10%)
- Combinações aleatórias de pacientes e procedimentos

## 🧹 Limpeza de Dados

Para remover todos os dados de teste:

### Via Interface
1. No Dashboard, clique em "Limpar Dados"
2. Confirme a ação

### Via Código
```typescript
import { clearTestData } from './src/utils/seedData'
await clearTestData()
```

## ⚠️ Importante

- **Backup**: Sempre faça backup dos dados importantes antes de usar os scripts
- **Ambiente**: Use preferencialmente em ambiente de desenvolvimento
- **Autenticação**: Você deve estar logado no sistema para executar os scripts
- **Permissões**: Certifique-se de ter permissões adequadas no Supabase

## 🔧 Personalização

Para personalizar os dados gerados, edite os arrays `patientsData` e `proceduresData` nos arquivos:
- `scripts/seed-data.js` (versão Node.js)
- `src/utils/seedData.ts` (versão TypeScript)

## 🐛 Solução de Problemas

### Erro de Autenticação
```
Usuário não encontrado. Faça login primeiro.
```
**Solução**: Faça login no sistema antes de executar os scripts.

### Erro de Permissão
```
Row Level Security policy violation
```
**Solução**: Verifique se as políticas RLS do Supabase estão configuradas corretamente.

### Dados Duplicados
```
Duplicate key value violates unique constraint
```
**Solução**: Limpe os dados existentes antes de gerar novos dados de teste.

## 📞 Suporte

Se encontrar problemas:
1. Verifique o console do navegador para erros detalhados
2. Confirme se o arquivo `.env` está configurado corretamente
3. Teste a conexão com o Supabase

---

*Este sistema foi desenvolvido para facilitar o teste e desenvolvimento do sistema de gestão estética.*