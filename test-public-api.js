// Script de teste para a API pública do perfil da clínica
// Execute com: node test-public-api.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🧪 Testando API Pública do Perfil da Clínica');
console.log('===========================================\n');

async function testPublicAPI() {
  try {
    // Primeiro, vamos listar alguns perfis existentes para teste
    console.log('📋 1. Listando perfis existentes...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, clinic_name')
      .limit(5);

    if (profilesError) {
      console.error('❌ Erro ao listar perfis:', profilesError);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️  Nenhum perfil encontrado. Crie um perfil primeiro na aplicação.');
      return;
    }

    console.log('✅ Perfis encontrados:');
    profiles.forEach((profile, index) => {
      console.log(`   ${index + 1}. ${profile.clinic_name || 'Sem nome'} (ID: ${profile.id})`);
    });

    // Testar função por ID
    console.log('\n🔍 2. Testando busca por ID...');
    const testProfile = profiles[0];
    
    const { data: profileById, error: byIdError } = await supabase
      .rpc('get_public_clinic_profile', {
        clinic_user_id: testProfile.id
      });

    if (byIdError) {
      console.error('❌ Erro na busca por ID:', byIdError);
    } else {
      console.log('✅ Busca por ID bem-sucedida!');
      console.log('📊 Resultado:', JSON.stringify(profileById, null, 2));
    }

    // Testar função por nome (se houver nome)
    if (testProfile.clinic_name) {
      console.log('\n🔍 3. Testando busca por nome...');
      
      const { data: profileByName, error: byNameError } = await supabase
        .rpc('get_public_clinic_profile_by_name', {
          clinic_name_param: testProfile.clinic_name
        });

      if (byNameError) {
        console.error('❌ Erro na busca por nome:', byNameError);
      } else {
        console.log('✅ Busca por nome bem-sucedida!');
        console.log('📊 Resultado:', JSON.stringify(profileByName, null, 2));
      }
    } else {
      console.log('\n⚠️  3. Pulando teste por nome (perfil sem nome)');
    }

    // Testar busca por nome inexistente
    console.log('\n🔍 4. Testando busca por nome inexistente...');
    
    const { data: notFound, error: notFoundError } = await supabase
      .rpc('get_public_clinic_profile_by_name', {
        clinic_name_param: 'Clínica Inexistente XYZ123'
      });

    if (notFoundError) {
      console.error('❌ Erro inesperado:', notFoundError);
    } else {
      console.log('✅ Teste de nome inexistente funcionou!');
      console.log('📊 Resultado esperado (não encontrado):', JSON.stringify(notFound, null, 2));
    }

    console.log('\n🎉 Todos os testes concluídos!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Execute a migration no Supabase Dashboard');
    console.log('   2. Teste as funções no SQL Editor');
    console.log('   3. Use os endpoints em sua aplicação externa');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar testes
testPublicAPI();