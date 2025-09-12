import { supabase } from '../lib/supabaseClient'
import type { Appointment, AppointmentWithDetails } from '../types/database'

export const appointmentsService = {
  // Buscar todos os agendamentos do usuário com detalhes de paciente e procedimento
  async getAll(userId: string): Promise<AppointmentWithDetails[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(*),
        procedure:procedures(*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('appointment_date', { ascending: true })

    if (error) {
      console.error('Erro ao buscar agendamentos:', error)
      throw error
    }

    return data || []
  },

  // Buscar agendamento por ID
  async getById(id: string): Promise<AppointmentWithDetails | null> {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(*),
        procedure:procedures(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erro ao buscar agendamento:', error)
      throw error
    }

    return data
  },

  // Criar novo agendamento
  async create(appointment: any): Promise<Appointment> {
    const { data, error } = await (supabase as any)
      .from('appointments')
      .insert(appointment)
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar agendamento:', error)
      throw error
    }

    return data
  },

  // Atualizar agendamento
  async update(id: string, appointment: any): Promise<Appointment> {
    const { data, error } = await (supabase as any)
      .from('appointments')
      .update({
        ...appointment,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar agendamento:', error)
      throw error
    }

    return data
  },

  // Excluir agendamento (soft delete)
  async delete(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('appointments')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Erro ao excluir agendamento:', error)
      throw error
    }
  },

  // Buscar agendamentos por data
  async getByDate(userId: string, date: string): Promise<AppointmentWithDetails[]> {
    const startDate = new Date(date)
    startDate.setHours(0, 0, 0, 0)
    
    const endDate = new Date(date)
    endDate.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(*),
        procedure:procedures(*)
      `)
      .eq('user_id', userId)
      .gte('appointment_date', startDate.toISOString())
      .lte('appointment_date', endDate.toISOString())
      .order('appointment_date', { ascending: true })

    if (error) {
      console.error('Erro ao buscar agendamentos por data:', error)
      throw error
    }

    return data || []
  },

  // Buscar agendamentos por status
  async getByStatus(userId: string, status: string): Promise<AppointmentWithDetails[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(*),
        procedure:procedures(*)
      `)
      .eq('user_id', userId)
      .eq('status', status)
      .order('appointment_date', { ascending: true })

    if (error) {
      console.error('Erro ao buscar agendamentos por status:', error)
      throw error
    }

    return data || []
  },

  // Buscar agendamentos por paciente
  async getByPatientId(patientId: string, userId: string): Promise<AppointmentWithDetails[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(*),
        procedure:procedures(*)
      `)
      .eq('patient_id', patientId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('appointment_date', { ascending: false })

    if (error) {
      console.error('Erro ao buscar agendamentos por paciente:', error)
      throw error
    }

    return data || []
  }
}