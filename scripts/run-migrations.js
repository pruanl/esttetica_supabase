import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente necessárias não encontradas:')
  console.error('- VITE_SUPABASE_URL')
  console.error('- VITE_SUPABASE_ANON_KEY')
  console.error('\nVerifique se o arquivo .env está configurado corretamente.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function runMigrations() {
  try {
    console.log('🚀 Sistema de Migrations - Clínica de Estética')
    console.log('=============================================')
    
    // Verificar conexão com Supabase
    console.log('🔍 Verificando conexão com Supabase...')
    
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.log('⚠️  Não foi possível verificar a sessão, mas isso é normal para migrations')
    }
    
    // Ler o arquivo de migration
    const migrationsDir = path.join(__dirname, '..', 'migrations')
    const migrationFile = path.join(migrationsDir, '001_initial_schema.sql')
    
    if (!fs.existsSync(migrationFile)) {
      console.error('❌ Arquivo de migration não encontrado:', migrationFile)
      process.exit(1)
    }
    
    const sql = fs.readFileSync(migrationFile, 'utf8')
    
    console.log('\n📄 Migration encontrada: 001_initial_schema.sql')
    console.log('📊 Tamanho do arquivo:', (sql.length / 1024).toFixed(2), 'KB')
    
    console.log('\n⚠️  IMPORTANTE: Execução Manual Necessária')
    console.log('==========================================\n')
    
    console.log('🔧 Para executar esta migration, siga os passos:')
    console.log('\n1. Acesse: https://supabase.com/dashboard')
    console.log('2. Selecione seu projeto')
    console.log('3. Vá para "SQL Editor"')
    console.log('4. Copie o conteúdo do arquivo:')
    console.log('   📁', migrationFile)
    console.log('5. Cole no editor SQL e execute')
    
    console.log('\n📋 O que será criado:')
    console.log('✅ Tabela: procedures (procedimentos estéticos)')
    console.log('✅ Tabela: patients (pacientes)')
    console.log('✅ Tabela: appointments (agendamentos)')
    console.log('✅ Índices para performance')
    console.log('✅ Triggers para updated_at')
    console.log('✅ Row Level Security (RLS)')
    console.log('✅ Políticas de acesso por usuário')
    
    console.log('\n🎯 Após executar a migration:')
    console.log('1. Verifique se as tabelas foram criadas no "Table Editor"')
    console.log('2. Teste a aplicação fazendo login')
    console.log('3. Tente criar um procedimento para validar')
    
    console.log('\n💡 Dica: Salve o conteúdo da migration em um arquivo .sql')
    console.log('para facilitar a execução no Supabase Dashboard.')
    
    // Criar arquivo temporário para facilitar
    const tempFile = path.join(process.cwd(), 'temp_migration.sql')
    fs.writeFileSync(tempFile, sql)
    console.log('\n📝 Arquivo temporário criado:', tempFile)
    console.log('   Você pode copiar este arquivo e colar no Supabase Dashboard')
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
    console.error('\n💡 Verifique:')
    console.error('- Se as variáveis de ambiente estão corretas no .env')
    console.error('- Se o projeto Supabase está ativo')
    console.error('- Execute a migration manualmente no Supabase Dashboard')
  }
}

// Executar migrations
runMigrations()