# Guia de Integração - API Pública de Perfis para Next.js

## 📋 Visão Geral

Este guia mostra como integrar a API pública de perfis de clínicas em um projeto Next.js. A API permite buscar dados públicos de clínicas através do **username** (nome de usuário da loja).

## 🔧 Configuração Inicial

### 1. Instalar Dependências

```bash
npm install @supabase/supabase-js
# ou
yarn add @supabase/supabase-js
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` no seu projeto Next.js:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

> **⚠️ Importante**: Use apenas a chave `anon` (pública) do Supabase, nunca a chave `service_role`.

### 3. Criar Cliente Supabase

Crie o arquivo `lib/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## 🎯 Principais Endpoints

### 1. Buscar Perfil por Username (Recomendado)

**Função**: `get_public_clinic_profile_by_username`

```javascript
const { data, error } = await supabase
  .rpc('get_public_clinic_profile_by_username', {
    username_param: 'username_da_loja'
  });
```

### 2. Buscar Perfil por Nome da Clínica

**Função**: `get_public_clinic_profile_by_name`

```javascript
const { data, error } = await supabase
  .rpc('get_public_clinic_profile_by_name', {
    clinic_name_param: 'Nome da Clínica'
  });
```

### 3. Buscar Perfil por ID do Usuário

**Função**: `get_public_clinic_profile`

```javascript
const { data, error } = await supabase
  .rpc('get_public_clinic_profile', {
    clinic_user_id: 'uuid-do-usuario'
  });
```

## 📊 Estrutura da Resposta

```json
{
  "profile": {
    "id": "uuid-do-usuario",
    "clinic_name": "Nome da Clínica",
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
  "success": true,
  "message": "Profile data retrieved successfully"
}
```

## 🚀 Implementação Prática

### Service para Perfis Públicos

Crie o arquivo `services/clinicService.js`:

```javascript
import { supabase } from '../lib/supabase'

export class ClinicService {
  /**
   * Busca perfil público por username
   * @param {string} username - Username da clínica (ex: "clinica_exemplo")
   * @returns {Promise<Object>} Dados do perfil e galeria
   */
  static async getProfileByUsername(username) {
    try {
      const { data, error } = await supabase
        .rpc('get_public_clinic_profile_by_username', {
          username_param: username.toLowerCase()
        });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return {
        profile: null,
        gallery: [],
        success: false,
        message: 'Erro ao buscar perfil da clínica'
      };
    }
  }

  /**
   * Busca perfil público por nome da clínica
   * @param {string} clinicName - Nome da clínica
   * @returns {Promise<Object>} Dados do perfil e galeria
   */
  static async getProfileByName(clinicName) {
    try {
      const { data, error } = await supabase
        .rpc('get_public_clinic_profile_by_name', {
          clinic_name_param: clinicName
        });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return {
        profile: null,
        gallery: [],
        success: false,
        message: 'Erro ao buscar perfil da clínica'
      };
    }
  }
}
```

### Página de Perfil Dinâmica

Crie o arquivo `pages/clinica/[username].js` (ou `app/clinica/[username]/page.js` para App Router):

```javascript
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { ClinicService } from '../../services/clinicService'

export default function ClinicProfile() {
  const router = useRouter()
  const { username } = router.query
  const [clinic, setClinic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (username) {
      loadClinicProfile()
    }
  }, [username])

  const loadClinicProfile = async () => {
    try {
      setLoading(true)
      const result = await ClinicService.getProfileByUsername(username)
      
      if (result.success) {
        setClinic(result)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('Erro ao carregar perfil da clínica')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Carregando perfil...</div>
  }

  if (error || !clinic?.profile) {
    return <div>Clínica não encontrada: {error}</div>
  }

  const { profile, gallery } = clinic

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header da Clínica */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {profile.cover_photo_url && (
          <img 
            src={profile.cover_photo_url} 
            alt="Capa da clínica"
            className="w-full h-48 object-cover"
          />
        )}
        
        <div className="p-6">
          <div className="flex items-center space-x-4">
            {profile.profile_avatar_url && (
              <img 
                src={profile.profile_avatar_url} 
                alt={profile.clinic_name}
                className="w-20 h-20 rounded-full object-cover"
              />
            )}
            
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {profile.clinic_name}
              </h1>
              <p className="text-gray-600">@{username}</p>
            </div>
          </div>

          {/* Informações de Contato */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.whatsapp_number && (
              <div>
                <strong>WhatsApp:</strong>
                <a 
                  href={`https://wa.me/${profile.whatsapp_number.replace(/\D/g, '')}`}
                  className="ml-2 text-green-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {profile.whatsapp_number}
                </a>
              </div>
            )}

            {profile.address && (
              <div>
                <strong>Endereço:</strong>
                <span className="ml-2">{profile.address}</span>
              </div>
            )}
          </div>

          {/* Redes Sociais */}
          <div className="mt-6 flex space-x-4">
            {profile.instagram_url && (
              <a 
                href={profile.instagram_url}
                className="text-pink-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
            )}
            
            {profile.facebook_url && (
              <a 
                href={profile.facebook_url}
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Facebook
              </a>
            )}
            
            {profile.tiktok_url && (
              <a 
                href={profile.tiktok_url}
                className="text-black hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                TikTok
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Galeria de Fotos */}
      {gallery && gallery.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Galeria</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gallery.map((photo) => (
              <div key={photo.id} className="bg-white rounded-lg shadow overflow-hidden">
                <img 
                  src={photo.photo_url} 
                  alt={photo.description || 'Foto da galeria'}
                  className="w-full h-48 object-cover"
                />
                {photo.description && (
                  <div className="p-3">
                    <p className="text-sm text-gray-600">{photo.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

### Hook Personalizado (Opcional)

Crie o arquivo `hooks/useClinicProfile.js`:

```javascript
import { useState, useEffect } from 'react'
import { ClinicService } from '../services/clinicService'

export function useClinicProfile(username) {
  const [clinic, setClinic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (username) {
      loadProfile()
    }
  }, [username])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await ClinicService.getProfileByUsername(username)
      
      if (result.success) {
        setClinic(result)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('Erro ao carregar perfil')
    } finally {
      setLoading(false)
    }
  }

  return { clinic, loading, error, refetch: loadProfile }
}
```

## 🔍 Exemplos de Uso

### 1. Busca Simples por Username

```javascript
import { ClinicService } from '../services/clinicService'

// Buscar perfil da clínica "beleza_total"
const result = await ClinicService.getProfileByUsername('beleza_total')

if (result.success) {
  console.log('Nome da clínica:', result.profile.clinic_name)
  console.log('WhatsApp:', result.profile.whatsapp_number)
  console.log('Fotos da galeria:', result.gallery.length)
} else {
  console.log('Erro:', result.message)
}
```

### 2. Componente de Busca

```javascript
import { useState } from 'react'
import { ClinicService } from '../services/clinicService'

export function ClinicSearch() {
  const [username, setUsername] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!username.trim()) return

    setLoading(true)
    const clinicData = await ClinicService.getProfileByUsername(username)
    setResult(clinicData)
    setLoading(false)
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="mb-4">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Digite o username da clínica"
          className="border p-2 mr-2"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {result && (
        <div>
          {result.success ? (
            <div>
              <h3>{result.profile.clinic_name}</h3>
              <p>WhatsApp: {result.profile.whatsapp_number}</p>
            </div>
          ) : (
            <p>Clínica não encontrada</p>
          )}
        </div>
      )}
    </div>
  )
}
```

## 🛡️ Tratamento de Erros

```javascript
const handleClinicSearch = async (username) => {
  try {
    const result = await ClinicService.getProfileByUsername(username)
    
    if (!result.success) {
      // Clínica não encontrada ou erro na API
      console.log('Erro:', result.message)
      return null
    }
    
    if (!result.profile) {
      // Perfil não existe
      console.log('Perfil não encontrado')
      return null
    }
    
    // Sucesso
    return result
    
  } catch (error) {
    // Erro de rede ou outro erro inesperado
    console.error('Erro ao buscar clínica:', error)
    return null
  }
}
```

## 📱 Integração com App Router (Next.js 13+)

Para projetos usando App Router, crie `app/clinica/[username]/page.js`:

```javascript
import { ClinicService } from '../../../services/clinicService'
import ClinicProfileClient from './ClinicProfileClient'

// Server Component
export default async function ClinicProfilePage({ params }) {
  const { username } = params
  
  // Buscar dados no servidor
  const clinicData = await ClinicService.getProfileByUsername(username)
  
  if (!clinicData.success) {
    return <div>Clínica não encontrada</div>
  }
  
  return <ClinicProfileClient initialData={clinicData} />
}

// Gerar metadata dinâmica
export async function generateMetadata({ params }) {
  const { username } = params
  const clinicData = await ClinicService.getProfileByUsername(username)
  
  if (!clinicData.success) {
    return {
      title: 'Clínica não encontrada'
    }
  }
  
  return {
    title: clinicData.profile.clinic_name,
    description: `Perfil da ${clinicData.profile.clinic_name} - ${clinicData.profile.address}`,
    openGraph: {
      title: clinicData.profile.clinic_name,
      description: `Conheça a ${clinicData.profile.clinic_name}`,
      images: clinicData.profile.cover_photo_url ? [clinicData.profile.cover_photo_url] : [],
    }
  }
}
```

## 🔗 URLs de Exemplo

Depois da implementação, suas URLs ficarão assim:

- `https://seusite.com/clinica/beleza_total`
- `https://seusite.com/clinica/estetica_premium`
- `https://seusite.com/clinica/spa_relaxante`

## 📝 Notas Importantes

1. **Chave API**: Use apenas a chave `anon` do Supabase
2. **Cache**: Considere implementar cache para melhor performance
3. **SEO**: Use Server-Side Rendering para melhor indexação
4. **Imagens**: As URLs das imagens são públicas e podem ser usadas diretamente
5. **Rate Limiting**: Respeite os limites de taxa do Supabase
6. **Username**: Sempre converta para lowercase na busca

## 🚀 Deploy

Certifique-se de configurar as variáveis de ambiente no seu provedor de deploy:

- **Vercel**: Adicione as variáveis no dashboard
- **Netlify**: Configure no arquivo `netlify.toml` ou dashboard
- **Outros**: Consulte a documentação específica

## 📞 Suporte

Se encontrar problemas:

1. Verifique se as funções SQL estão criadas no Supabase
2. Confirme se as permissões estão corretas
3. Teste as funções diretamente no SQL Editor do Supabase
4. Verifique os logs do navegador para erros de CORS ou autenticação

---

**Exemplo de comando para testar:**

```bash
# No seu projeto Next.js
npm run dev

# Acesse: http://localhost:3000/clinica/username_da_loja
```

Este guia fornece tudo que você precisa para integrar a API de perfis públicos em qualquer projeto Next.js! 🎉