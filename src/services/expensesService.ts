import { supabase } from '../lib/supabaseClient';
import type { FixedExpense, FixedExpenseInsert, FixedExpenseUpdate } from '../types/database';

export const expensesService = {
  // Buscar todas as despesas fixas do usuário
  async getAll(): Promise<FixedExpense[]> {
    const { data, error } = await supabase
      .from('fixed_expenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar despesas:', error);
      throw new Error('Erro ao carregar despesas');
    }

    return data || [];
  },

  // Buscar despesa por ID
  async getById(id: string): Promise<FixedExpense | null> {
    const { data, error } = await supabase
      .from('fixed_expenses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar despesa:', error);
      return null;
    }

    return data;
  },

  // Criar nova despesa
  async create(expense: FixedExpenseInsert): Promise<FixedExpense> {
    const { data, error } = await supabase
      .from('fixed_expenses')
      .insert(expense)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar despesa:', error);
      throw new Error('Erro ao criar despesa');
    }

    return data;
  },

  // Atualizar despesa
  async update(id: string, updates: FixedExpenseUpdate): Promise<FixedExpense> {
    const { data, error } = await supabase
      .from('fixed_expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar despesa:', error);
      throw new Error('Erro ao atualizar despesa');
    }

    return data;
  },

  // Deletar despesa
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('fixed_expenses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar despesa:', error);
      throw new Error('Erro ao deletar despesa');
    }
  },

  // Calcular total das despesas fixas
  async getTotalAmount(): Promise<number> {
    const expenses = await this.getAll();
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  }
};