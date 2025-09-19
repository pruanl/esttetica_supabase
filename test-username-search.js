import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUsernameSearch() {
  try {
    console.log('🔍 Testando busca por username...\n');

    // Primeiro, vamos listar alguns perfis com username para teste
    console.log('📋 1. Listando perfis com username...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, clinic_name, username')
      .not('username', 'is', null)
      .limit(5);

    if (profilesError) {
      console.error('❌ Erro ao listar perfis:', profilesError);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️  Nenhum perfil com username encontrado. Crie um username primeiro na aplicação.');
      return;
    }

    console.log('✅ Perfis com username encontrados:');
    profiles.forEach((profile, index) => {
      console.log(`   ${index + 1}. ${profile.clinic_name || 'Sem nome'} (@${profile.username})`);
    });

    // Testar função por username
    console.log('\n🔍 2. Testando busca por username...');
    const testProfile = profiles[0];
    
    const { data: profileByUsername, error: byUsernameError } = await supabase
      .rpc('get_public_clinic_profile_by_username', {
        username_param: testProfile.username
      });

    if (byUsernameError) {
      console.error('❌ Erro na busca por username:', byUsernameError);
    } else {
      console.log('✅ Busca por username bem-sucedida!');
      console.log('📊 Resultado:', JSON.stringify(profileByUsername, null, 2));
    }

    // Testar busca por username inexistente
    console.log('\n🔍 3. Testando busca por username inexistente...');
    
    const { data: notFound, error: notFoundError } = await supabase
      .rpc('get_public_clinic_profile_by_username', {
        username_param: 'username_inexistente_xyz123'
      });

    if (notFoundError) {
      console.error('❌ Erro inesperado:', notFoundError);
    } else {
      console.log('✅ Teste de username inexistente funcionou!');
      console.log('📊 Resultado esperado (não encontrado):', JSON.stringify(notFound, null, 2));
    }

    // Testar com diferentes formatos de username
    if (profiles.length > 0) {
      console.log('\n🔍 4. Testando busca com username em maiúscula...');
      const upperUsername = testProfile.username.toUpperCase();
      
      const { data: upperResult, error: upperError } = await supabase
        .rpc('get_public_clinic_profile_by_username', {
          username_param: upperUsername
        });

      if (upperError) {
        console.error('❌ Erro na busca por username maiúsculo:', upperError);
      } else {
        console.log('✅ Busca por username maiúsculo funcionou!');
        console.log(`📊 Buscou por: ${upperUsername}, encontrou: ${upperResult?.profile?.username || 'nenhum'}`);
      }
    }

    console.log('\n🎉 Todos os testes de username concluídos!');
    console.log('\n📝 Como usar na sua aplicação:');
    console.log('```javascript');
    console.log('import { ProfileService } from "./services/profileService";');
    console.log('');
    console.log('// Buscar perfil por username');
    console.log('const result = await ProfileService.getPublicProfileByUsername("username");');
    console.log('');
    console.log('if (result.success) {');
    console.log('  console.log("Perfil:", result.profile);');
    console.log('  console.log("Galeria:", result.gallery);');
    console.log('} else {');
    console.log('  console.log("Erro:", result.message);');
    console.log('}');
    console.log('```');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar testes
testUsernameSearch();