import { supabase } from '../lib/supabaseClient';
import type { WorkingHours } from '../types/database';

export interface WorkingHoursInsert {
  day_of_week: number;
  is_open: boolean;
  open_time?: string;
  close_time?: string;
}

export interface WorkingHoursUpdate {
  is_open?: boolean;
  open_time?: string;
  close_time?: string;
}

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' }
];

export class WorkingHoursService {
  // Buscar todos os horários de funcionamento do usuário
  static async getAll(): Promise<WorkingHours[]> {
    const { data, error } = await supabase
      .from('working_hours')
      .select('*')
      .order('day_of_week', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar horários: ${error.message}`);
    }

    return (data as WorkingHours[]) || [];
  }

  // Criar ou atualizar horários de funcionamento
  static async upsert(workingHours: WorkingHoursInsert[]): Promise<WorkingHours[]> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const hoursWithUserId = workingHours.map(hours => ({
      ...hours,
      user_id: user.id
    }));

    const { data, error } = await supabase
      .from('working_hours')
      .upsert(hoursWithUserId, {
        onConflict: 'user_id,day_of_week'
      })
      .select();

    if (error) {
      throw new Error(`Erro ao salvar horários: ${error.message}`);
    }

    return (data as WorkingHours[]) || [];
  }

  // Atualizar horário específico de um dia
  static async updateDay(dayOfWeek: number, updates: WorkingHoursUpdate): Promise<WorkingHours> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('working_hours')
      .update(updates)
      .eq('user_id', user.id)
      .eq('day_of_week', dayOfWeek)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar horário: ${error.message}`);
    }

    return data as WorkingHours;
  }

  // Criar horários padrão para todos os dias
  static async createDefault(): Promise<WorkingHours[]> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const defaultHours = DAYS_OF_WEEK.map(day => ({
      user_id: user.id,
      day_of_week: day.value,
      is_open: day.value >= 1 && day.value <= 5, // Segunda a sexta aberto por padrão
      open_time: day.value >= 1 && day.value <= 5 ? '09:00' : null,
      close_time: day.value >= 1 && day.value <= 5 ? '18:00' : null
    }));

    const { data, error } = await supabase
      .from('working_hours')
      .upsert(defaultHours, {
        onConflict: 'user_id,day_of_week'
      })
      .select();

    if (error) {
      throw new Error(`Erro ao criar horários padrão: ${error.message}`);
    }

    return (data as WorkingHours[]) || [];
  }

  // Formatar horários para exibição
  static formatWorkingHours(workingHours: WorkingHours[]): string[] {
    const formatted: string[] = [];
    const sortedHours = [...workingHours].sort((a, b) => a.day_of_week - b.day_of_week);

    for (const hours of sortedHours) {
      const dayName = DAYS_OF_WEEK.find(d => d.value === hours.day_of_week)?.label || '';
      
      if (!hours.is_open) {
        formatted.push(`${dayName}: Fechado`);
      } else if (hours.open_time && hours.close_time) {
        formatted.push(`${dayName}: ${hours.open_time} às ${hours.close_time}`);
      } else {
        formatted.push(`${dayName}: Aberto`);
      }
    }

    return formatted;
  }

  // Agrupar horários consecutivos com mesmo horário
  static groupConsecutiveHours(workingHours: WorkingHours[]): string[] {
    const sortedHours = [...workingHours].sort((a, b) => a.day_of_week - b.day_of_week);
    const grouped: string[] = [];
    let currentGroup: WorkingHours[] = [];

    for (let i = 0; i < sortedHours.length; i++) {
      const current = sortedHours[i];
      
      if (currentGroup.length === 0) {
        currentGroup = [current];
      } else {
        const last = currentGroup[currentGroup.length - 1];
        
        // Verificar se pode agrupar (mesmo horário e dias consecutivos)
        if (
          current.is_open === last.is_open &&
          current.open_time === last.open_time &&
          current.close_time === last.close_time &&
          current.day_of_week === last.day_of_week + 1
        ) {
          currentGroup.push(current);
        } else {
          // Finalizar grupo atual
          grouped.push(this.formatGroup(currentGroup));
          currentGroup = [current];
        }
      }
    }

    // Finalizar último grupo
    if (currentGroup.length > 0) {
      grouped.push(this.formatGroup(currentGroup));
    }

    return grouped;
  }

  private static formatGroup(group: WorkingHours[]): string {
    if (group.length === 1) {
      const hours = group[0];
      const dayName = DAYS_OF_WEEK.find(d => d.value === hours.day_of_week)?.label || '';
      
      if (!hours.is_open) {
        return `${dayName}: Fechado`;
      } else if (hours.open_time && hours.close_time) {
        return `${dayName}: ${hours.open_time} às ${hours.close_time}`;
      } else {
        return `${dayName}: Aberto`;
      }
    } else {
      const firstDay = DAYS_OF_WEEK.find(d => d.value === group[0].day_of_week)?.label || '';
      const lastDay = DAYS_OF_WEEK.find(d => d.value === group[group.length - 1].day_of_week)?.label || '';
      const hours = group[0];
      
      if (!hours.is_open) {
        return `${firstDay} à ${lastDay}: Fechado`;
      } else if (hours.open_time && hours.close_time) {
        return `${firstDay} à ${lastDay}: ${hours.open_time} às ${hours.close_time}`;
      } else {
        return `${firstDay} à ${lastDay}: Aberto`;
      }
    }
  }
}