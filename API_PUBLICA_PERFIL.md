# API Pública do Perfil da Clínica

## Visão Geral

Esta API permite que aplicações externas acessem dados públicos do perfil de clínicas cadastradas no sistema. Os dados incluem informações básicas da clínica, localização, redes sociais e galeria de fotos.

## Endpoints Disponíveis

### 1. Buscar Perfil por ID do Usuário

**Função:** `get_public_clinic_profile(clinic_user_id UUID)`

**Uso via Supabase Client:**
```javascript
const { data, error } = await supabase
  .rpc('get_public_clinic_profile', {
    clinic_user_id: 'uuid-do-usuario'
  });
```

**Uso via REST API:**
```
POST https://seu-projeto.supabase.co/rest/v1/rpc/get_public_clinic_profile
Content-Type: application/json
apikey: sua-anon-key

{
  "clinic_user_id": "uuid-do-usuario"
}
```

### 2. Buscar Perfil por Nome da Clínica

**Função:** `get_public_clinic_profile_by_name(clinic_name_param TEXT)`

**Uso via Supabase Client:**
```javascript
const { data, error } = await supabase
  .rpc('get_public_clinic_profile_by_name', {
    clinic_name_param: 'Nome da Clínica'
  });
```

**Uso via REST API:**
```
POST https://seu-projeto.supabase.co/rest/v1/rpc/get_public_clinic_profile_by_name
Content-Type: application/json
apikey: sua-anon-key

{
  "clinic_name_param": "Nome da Clínica"
}
```

## Estrutura da Resposta

```json
{
  "profile": {
    "id": "uuid-do-usuario",
    "clinic_name": "Nome da Clínica",
    "username": "clinica_exemplo",
    "about": "Descrição sobre a clínica",
    "whatsapp_number": "+5511999999999",
    "profile_avatar_url": "https://...",
    "cover_photo_url": "https://...",
    "address": "Endereço completo",
    "cep": "00000-000",
    "street": "Nome da Rua",
    "number": "123",
    "city": "Cidade",
    "state": "Estado",
    "latitude": -23.5505,
    "longitude": -46.6333,
    "instagram_url": "https://instagram.com/clinica",
    "tiktok_url": "https://tiktok.com/@clinica",
    "youtube_url": "https://youtube.com/c/clinica",
    "facebook_url": "https://facebook.com/clinica",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "gallery": [
    {
      "id": 1,
      "photo_url": "https://...",
      "description": "Descrição da foto",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "treatments": [
    {
      "id": 1,
      "name": "Limpeza de Pele",
      "description": "Limpeza profunda com extração",
      "display_order": 1
    },
    {
      "id": 2,
      "name": "Massagem Relaxante",
      "description": "Massagem corporal completa",
      "display_order": 2
    }
  ],
  "working_hours": [
    {
      "day_of_week": 1,
      "is_open": true,
      "open_time": "09:00",
      "close_time": "18:00"
    },
    {
      "day_of_week": 2,
      "is_open": true,
      "open_time": "09:00",
      "close_time": "18:00"
    },
    {
      "day_of_week": 0,
      "is_open": false,
      "open_time": null,
      "close_time": null
    }
  ],
  "success": true,
  "message": "Profile data retrieved successfully"
}
```

## Casos de Erro

### Clínica não encontrada:
```json
{
  "profile": null,
  "gallery": [],
  "treatments": [],
  "working_hours": [],
  "success": false,
  "message": "Clinic not found"
}
```

### Erro interno:
```json
{
  "profile": null,
  "gallery": [],
  "treatments": [],
  "working_hours": [],
  "success": false,
  "message": "Error retrieving profile data: [detalhes do erro]"
}
```

## Configuração de Segurança

- ✅ **Acesso Público**: As funções podem ser chamadas por usuários anônimos
- ✅ **RLS Habilitado**: Row Level Security está ativo nas tabelas
- ✅ **Dados Filtrados**: Apenas dados públicos são retornados
- ✅ **Galeria Filtrada**: Apenas fotos ativas são incluídas

## Exemplo de Uso em JavaScript

```javascript
// Usando Supabase Client
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://seu-projeto.supabase.co',
  'sua-anon-key'
);

// Buscar por ID
async function getClinicById(userId) {
  const { data, error } = await supabase
    .rpc('get_public_clinic_profile', {
      clinic_user_id: userId
    });
  
  if (error) {
    console.error('Erro:', error);
    return null;
  }
  
  return data;
}

// Buscar por nome
async function getClinicByName(clinicName) {
  const { data, error } = await supabase
    .rpc('get_public_clinic_profile_by_name', {
      clinic_name_param: clinicName
    });
  
  if (error) {
    console.error('Erro:', error);
    return null;
  }
  
  return data;
}

// Exemplo de uso
const clinicData = await getClinicByName('Clínica Exemplo');
if (clinicData && clinicData.success) {
  console.log('Perfil:', clinicData.profile);
  console.log('Galeria:', clinicData.gallery);
}
```

## Exemplo de Uso com Fetch API

```javascript
async function fetchClinicProfile(clinicName) {
  const response = await fetch(
    'https://seu-projeto.supabase.co/rest/v1/rpc/get_public_clinic_profile_by_name',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'sua-anon-key'
      },
      body: JSON.stringify({
        clinic_name_param: clinicName
      })
    }
  );
  
  const data = await response.json();
  return data;
}
```

## Notas Importantes

1. **Chave API**: Use a chave `anon` do Supabase para acesso público
2. **Rate Limiting**: Respeite os limites de taxa do Supabase
3. **Cache**: Considere implementar cache para melhor performance
4. **URLs de Imagem**: As URLs das imagens são públicas e podem ser usadas diretamente
5. **Coordenadas**: Latitude e longitude podem ser usadas para mapas e localização

## Configuração no Supabase Dashboard

Para usar esta API, você precisa:

1. Executar a migration `012_create_public_profile_api.sql` no SQL Editor
2. Verificar se as políticas RLS estão ativas
3. Testar as funções no SQL Editor
4. Obter sua chave `anon` nas configurações do projeto