import { createClient } from '@supabase/supabase-js'
import type { Procedure, ProcedureInsert, ProcedureUpdate } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export class ProceduresService {
  // Buscar todos os procedimentos do usuário
  static async getAll(): Promise<Procedure[]> {
    const { data, error } = await supabase
      .from('procedures')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      throw new Error(`Erro ao buscar procedimentos: ${error.message}`)
    }

    return (data as Procedure[]) || []
  }

  // Buscar procedimento por ID
  static async getById(id: string): Promise<Procedure | null> {
    const { data, error } = await supabase
      .from('procedures')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Não encontrado
      }
      throw new Error(`Erro ao buscar procedimento: ${error.message}`)
    }

    return data as Procedure
  }

  // Criar novo procedimento
  static async create(procedure: Omit<ProcedureInsert, 'user_id'>): Promise<Procedure> {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado')
    }

    const { data, error } = await supabase
      .from('procedures')
      .insert({
        ...procedure,
        user_id: user.id
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar procedimento: ${error.message}`)
    }

    return data as Procedure
  }

  // Atualizar procedimento
  static async update(id: string, updates: ProcedureUpdate): Promise<Procedure> {
    const { data, error } = await supabase
      .from('procedures')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar procedimento: ${error.message}`)
    }

    return data as Procedure
  }

  // Desativar procedimento (soft delete)
  static async deactivate(id: string): Promise<void> {
    const { error } = await supabase
      .from('procedures')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      throw new Error(`Erro ao desativar procedimento: ${error.message}`)
    }
  }

  // Deletar procedimento permanentemente
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('procedures')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Erro ao deletar procedimento: ${error.message}`)
    }
  }

  // Buscar procedimentos por categoria
  static async getByCategory(category: string): Promise<Procedure[]> {
    const { data, error } = await supabase
      .from('procedures')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('name')

    if (error) {
      throw new Error(`Erro ao buscar procedimentos por categoria: ${error.message}`)
    }

    return (data as Procedure[]) || []
  }

  // Buscar categorias únicas
  static async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('procedures')
      .select('category')
      .eq('is_active', true)
      .not('category', 'is', null)

    if (error) {
      throw new Error(`Erro ao buscar categorias: ${error.message}`)
    }

    // Extrair categorias únicas
    const categories = [...new Set((data as any[])?.map(item => item.category).filter(Boolean))]
    return categories.sort()
  }

  static async isUsedInAppointments(procedureId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('id')
        .eq('procedure_id', procedureId)
        .eq('is_active', true)
        .limit(1)

      if (error) {
        console.error('Erro ao verificar uso do procedimento:', error)
        throw error
      }

      return data && data.length > 0
    } catch (error) {
      console.error('Erro ao verificar uso do procedimento:', error)
      throw error
    }
  }

  static async archive(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('procedures')
        .update({ is_active: false })
        .eq('id', id)

      if (error) {
        console.error('Erro ao arquivar procedimento:', error)
        throw error
      }
    } catch (error) {
      console.error('Erro ao arquivar procedimento:', error)
      throw error
    }
  }
}