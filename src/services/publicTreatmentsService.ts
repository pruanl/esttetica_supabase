import { supabase } from '../lib/supabaseClient';
import type { PublicTreatment } from '../types/database';

export interface PublicTreatmentInsert {
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
}

export interface PublicTreatmentUpdate {
  name?: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
}

export class PublicTreatmentsService {
  // Buscar todos os tratamentos públicos do usuário
  static async getAll(): Promise<PublicTreatment[]> {
    const { data, error } = await supabase
      .from('public_treatments')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar tratamentos: ${error.message}`);
    }

    return (data as PublicTreatment[]) || [];
  }

  // Buscar tratamentos ativos do usuário
  static async getActive(): Promise<PublicTreatment[]> {
    const { data, error } = await supabase
      .from('public_treatments')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar tratamentos ativos: ${error.message}`);
    }

    return (data as PublicTreatment[]) || [];
  }

  // Criar novo tratamento público
  static async create(treatment: PublicTreatmentInsert): Promise<PublicTreatment> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('public_treatments')
      .insert({
        ...treatment,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar tratamento: ${error.message}`);
    }

    return data as PublicTreatment;
  }

  // Atualizar tratamento público
  static async update(id: number, updates: PublicTreatmentUpdate): Promise<PublicTreatment> {
    const { data, error } = await supabase
      .from('public_treatments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar tratamento: ${error.message}`);
    }

    return data as PublicTreatment;
  }

  // Deletar tratamento público
  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('public_treatments')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao deletar tratamento: ${error.message}`);
    }
  }

  // Reordenar tratamentos
  static async reorder(treatments: { id: number; display_order: number }[]): Promise<void> {
    const updates = treatments.map(treatment => 
      supabase
        .from('public_treatments')
        .update({ display_order: treatment.display_order })
        .eq('id', treatment.id)
    );

    const results = await Promise.all(updates);
    
    for (const result of results) {
      if (result.error) {
        throw new Error(`Erro ao reordenar tratamentos: ${result.error.message}`);
      }
    }
  }

  // Importar tratamentos dos procedimentos existentes
  static async importFromProcedures(procedureIds: string[]): Promise<PublicTreatment[]> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Buscar procedimentos selecionados
    const { data: procedures, error: proceduresError } = await supabase
      .from('procedures')
      .select('*')
      .in('id', procedureIds)
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (proceduresError) {
      throw new Error(`Erro ao buscar procedimentos: ${proceduresError.message}`);
    }

    if (!procedures || procedures.length === 0) {
      return [];
    }

    // Buscar o próximo display_order
    const { data: existingTreatments } = await supabase
      .from('public_treatments')
      .select('display_order')
      .eq('user_id', user.id)
      .order('display_order', { ascending: false })
      .limit(1);

    let nextOrder = 1;
    if (existingTreatments && existingTreatments.length > 0) {
      nextOrder = existingTreatments[0].display_order + 1;
    }

    // Criar tratamentos públicos baseados nos procedimentos
    const treatmentsToInsert = procedures.map((procedure, index) => ({
      user_id: user.id,
      name: procedure.name,
      description: procedure.description || '',
      display_order: nextOrder + index,
      is_active: true
    }));

    const { data, error } = await supabase
      .from('public_treatments')
      .insert(treatmentsToInsert)
      .select();

    if (error) {
      throw new Error(`Erro ao importar tratamentos: ${error.message}`);
    }

    return (data as PublicTreatment[]) || [];
  }
}