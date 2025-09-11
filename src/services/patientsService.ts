import { supabase } from '../lib/supabaseClient';
import type { Patient } from '../types/database';

export const patientsService = {
  // Buscar todos os pacientes do usuário
  async getPatients(): Promise<Patient[]> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar pacientes:', error);
      throw new Error('Erro ao buscar pacientes');
    }

    return data || [];
  },

  // Buscar paciente por ID
  async getPatientById(id: string): Promise<Patient | null> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Paciente não encontrado
      }
      console.error('Erro ao buscar paciente:', error);
      throw new Error('Erro ao buscar paciente');
    }

    return data;
  },

  // Criar novo paciente
  async createPatient(patient: any): Promise<Patient> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('patients')
      .insert({
        ...patient,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar paciente:', error);
      throw new Error('Erro ao criar paciente');
    }

    return data;
  },

  // Atualizar paciente
  async updatePatient(id: string, patient: any): Promise<Patient> {
    const { data, error } = await (supabase as any)
      .from('patients')
      .update(patient)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar paciente:', error);
      throw new Error('Erro ao atualizar paciente');
    }

    return data;
  },

  // Deletar paciente (soft delete)
  async deletePatient(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('patients')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar paciente:', error);
      throw new Error('Erro ao deletar paciente');
    }
  },

  // Buscar pacientes por nome (para busca)
  async searchPatients(searchTerm: string): Promise<Patient[]> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar pacientes:', error);
      throw new Error('Erro ao buscar pacientes');
    }

    return data || [];
  },

  // Verificar se email já existe
  async checkEmailExists(email: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from('patients')
      .select('id')
      .eq('email', email)
      .eq('is_active', true);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao verificar email:', error);
      return false;
    }

    return (data && data.length > 0);
  }
};