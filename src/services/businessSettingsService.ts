import { supabase } from '@/lib/supabaseClient';
import type { BusinessSettings } from '@/types/database';

export interface BusinessSettingsData {
  work_days_per_week: number;
  work_hours_per_day: number;
  desired_profit_margin: number;
}

class BusinessSettingsService {
  /**
   * Busca as configurações do usuário atual
   */
  async getSettings(): Promise<BusinessSettings | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      throw error;
    }
  }

  /**
   * Cria ou atualiza as configurações do usuário
   */
  async upsertSettings(settingsData: BusinessSettingsData): Promise<BusinessSettings> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('business_settings')
        .upsert({
          id: user.id,
          work_days_per_week: settingsData.work_days_per_week,
          work_hours_per_day: settingsData.work_hours_per_day,
          desired_profit_margin: settingsData.desired_profit_margin,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      throw error;
    }
  }

  /**
   * Verifica se o usuário já possui configurações
   */
  async hasSettings(): Promise<boolean> {
    try {
      const settings = await this.getSettings();
      return settings !== null;
    } catch (error) {
      console.error('Erro ao verificar configurações:', error);
      return false;
    }
  }

  /**
   * Calcula o total de horas trabalhadas por semana
   */
  async getTotalWeeklyHours(): Promise<number> {
    try {
      const settings = await this.getSettings();
      if (!settings) {
        throw new Error('Configurações não encontradas');
      }
      
      return settings.work_days_per_week * settings.work_hours_per_day;
    } catch (error) {
      console.error('Erro ao calcular horas semanais:', error);
      throw error;
    }
  }

  /**
   * Calcula o total de horas trabalhadas por mês (considerando 4.33 semanas por mês)
   */
  async getTotalMonthlyHours(): Promise<number> {
    try {
      const weeklyHours = await this.getTotalWeeklyHours();
      return weeklyHours * 4.33; // Média de semanas por mês
    } catch (error) {
      console.error('Erro ao calcular horas mensais:', error);
      throw error;
    }
  }
}

export const businessSettingsService = new BusinessSettingsService();