import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente necessárias:')
  console.error('- SUPABASE_URL (ou VITE_SUPABASE_URL)')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Tabela para controlar migrations executadas
const MIGRATIONS_TABLE = 'schema_migrations'

interface Migration {
  id: string
  filename: string
  executed_at: string
}

class MigrationRunner {
  async init() {
    // Criar tabela de controle de migrations se não existir
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
          id VARCHAR(255) PRIMARY KEY,
          filename VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (error) {
      console.error('❌ Erro ao criar tabela de migrations:', error.message)
      throw error
    }
  }

  async getExecutedMigrations(): Promise<Migration[]> {
    const { data, error } = await supabase
      .from(MIGRATIONS_TABLE)
      .select('*')
      .order('id')

    if (error) {
      console.error('❌ Erro ao buscar migrations executadas:', error.message)
      throw error
    }

    return data || []
  }

  async getMigrationFiles(): Promise<string[]> {
    const migrationsDir = __dirname
    const files = fs.readdirSync(migrationsDir)
    
    return files
      .filter(file => file.endsWith('.sql') && file !== 'rollback.sql')
      .sort()
  }

  async executeMigration(filename: string): Promise<void> {
    const filePath = path.join(__dirname, filename)
    const sql = fs.readFileSync(filePath, 'utf8')
    
    console.log(`🔄 Executando migration: ${filename}`)
    
    // Executar o SQL da migration
    const { error: sqlError } = await supabase.rpc('exec_sql', { sql })
    
    if (sqlError) {
      console.error(`❌ Erro ao executar migration ${filename}:`, sqlError.message)
      throw sqlError
    }
    
    // Registrar migration como executada
    const migrationId = filename.replace('.sql', '')
    const { error: insertError } = await supabase
      .from(MIGRATIONS_TABLE)
      .insert({
        id: migrationId,
        filename: filename
      })
    
    if (insertError) {
      console.error(`❌ Erro ao registrar migration ${filename}:`, insertError.message)
      throw insertError
    }
    
    console.log(`✅ Migration executada com sucesso: ${filename}`)
  }

  async runPendingMigrations(): Promise<void> {
    try {
      await this.init()
      
      const executedMigrations = await this.getExecutedMigrations()
      const migrationFiles = await this.getMigrationFiles()
      
      const executedIds = new Set(executedMigrations.map(m => m.id))
      
      const pendingMigrations = migrationFiles.filter(file => {
        const id = file.replace('.sql', '')
        return !executedIds.has(id)
      })
      
      if (pendingMigrations.length === 0) {
        console.log('✅ Todas as migrations já foram executadas!')
        return
      }
      
      console.log(`📋 Encontradas ${pendingMigrations.length} migrations pendentes:`)
      pendingMigrations.forEach(file => console.log(`  - ${file}`))
      
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration)
      }
      
      console.log('🎉 Todas as migrations foram executadas com sucesso!')
      
    } catch (error) {
      console.error('❌ Erro durante execução das migrations:', error)
      process.exit(1)
    }
  }

  async status(): Promise<void> {
    try {
      await this.init()
      
      const executedMigrations = await this.getExecutedMigrations()
      const migrationFiles = await this.getMigrationFiles()
      
      console.log('📊 Status das Migrations:')
      console.log('========================')
      
      if (executedMigrations.length === 0) {
        console.log('❌ Nenhuma migration foi executada ainda.')
      } else {
        console.log('✅ Migrations executadas:')
        executedMigrations.forEach(m => {
          console.log(`  - ${m.filename} (${new Date(m.executed_at).toLocaleString()})`)
        })
      }
      
      const executedIds = new Set(executedMigrations.map(m => m.id))
      const pendingMigrations = migrationFiles.filter(file => {
        const id = file.replace('.sql', '')
        return !executedIds.has(id)
      })
      
      if (pendingMigrations.length > 0) {
        console.log('\n⏳ Migrations pendentes:')
        pendingMigrations.forEach(file => console.log(`  - ${file}`))
      } else {
        console.log('\n✅ Todas as migrations estão atualizadas!')
      }
      
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error)
      process.exit(1)
    }
  }
}

// CLI
const command = process.argv[2]
const runner = new MigrationRunner()

switch (command) {
  case 'run':
    runner.runPendingMigrations()
    break
  case 'status':
    runner.status()
    break
  default:
    console.log('📖 Uso:')
    console.log('  npm run migrate:run    - Executa migrations pendentes')
    console.log('  npm run migrate:status - Mostra status das migrations')
    process.exit(1)
}