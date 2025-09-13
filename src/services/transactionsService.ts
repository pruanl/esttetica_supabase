import { supabase } from '../lib/supabaseClient';
import type { Transaction } from '../types/database';

export interface CreateTransactionData {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  entry_date: string;
  appointment_id?: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

export const transactionsService = {
  // Buscar todas as transações do usuário para um mês específico
  async getTransactionsByMonth(year: number, month: number): Promise<Transaction[]> {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .gte('entry_date', startDate)
      .lte('entry_date', endDate)
      .order('entry_date', { ascending: false });

    if (error) {
      console.error('Erro ao buscar transações:', error);
      throw error;
    }

    return data || [];
  },

  // Buscar resumo financeiro do mês
  async getMonthSummary(year: number, month: number): Promise<TransactionSummary> {
    const transactions = await this.getTransactionsByMonth(year, month);
    
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const balance = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      balance
    };
  },

  // Criar nova transação
  async createTransaction(transactionData: CreateTransactionData): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          description: transactionData.description,
          amount: transactionData.amount,
          type: transactionData.type,
          entry_date: transactionData.entry_date,
          appointment_id: transactionData.appointment_id || null
        }
      ] as any)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar transação:', error);
      throw error;
    }

    return data;
  },

  // Atualizar transação
  async updateTransaction(id: number, updates: Partial<CreateTransactionData>): Promise<Transaction> {
    const { data, error } = await (supabase
      .from('transactions') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar transação:', error);
      throw error;
    }

    return data;
  },

  // Deletar transação
  async deleteTransaction(id: number): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar transação:', error);
      throw error;
    }
  },

  // Verificar se um agendamento já foi lançado no caixa
  async isAppointmentAlreadyLaunched(appointmentId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('transactions')
      .select('id')
      .eq('appointment_id', appointmentId)
      .limit(1);

    if (error) {
      console.error('Erro ao verificar lançamento do agendamento:', error);
      throw error;
    }

    return (data && data.length > 0) || false;
  },

  // Criar transação a partir de agendamento
  async createTransactionFromAppointment(
    appointmentId: string,
    procedureName: string,
    amount: number,
    appointmentDate: string
  ): Promise<Transaction> {
    // Verificar se já foi lançado
    const alreadyLaunched = await this.isAppointmentAlreadyLaunched(appointmentId);
    if (alreadyLaunched) {
      throw new Error('Este agendamento já foi lançado no caixa');
    }

    // Criar a transação
    const transactionData: CreateTransactionData = {
      description: procedureName,
      amount: amount,
      type: 'income',
      entry_date: appointmentDate.split('T')[0], // Usar apenas a data, sem horário
      appointment_id: appointmentId
    };

    return await this.createTransaction(transactionData);
  }
};