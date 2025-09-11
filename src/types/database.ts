// Tipos TypeScript para as tabelas do banco de dados

export interface Procedure {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  category?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  address?: string;
  medical_history?: string;
  allergies?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  patient_id: string;
  procedure_id: string;
  appointment_date: string;
  duration_minutes: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  total_price?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Tipos para inserção (sem campos auto-gerados)
export interface ProcedureInsert {
  user_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  category?: string;
  is_active?: boolean;
}

export interface PatientInsert {
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  address?: string;
  medical_history?: string;
  allergies?: string;
  notes?: string;
  is_active?: boolean;
}

export interface AppointmentInsert {
  user_id: string;
  patient_id: string;
  procedure_id: string;
  appointment_date: string;
  duration_minutes: number;
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  total_price?: number;
  is_active?: boolean;
}

// Tipos para atualização (todos os campos opcionais exceto id)
export interface ProcedureUpdate {
  name?: string;
  description?: string;
  duration_minutes?: number;
  price?: number;
  category?: string;
  is_active?: boolean;
}

export interface PatientUpdate {
  name?: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  address?: string;
  medical_history?: string;
  allergies?: string;
  notes?: string;
  is_active?: boolean;
}

export interface AppointmentUpdate {
  patient_id?: string;
  procedure_id?: string;
  appointment_date?: string;
  duration_minutes?: number;
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  total_price?: number;
  is_active?: boolean;
}

// Tipos para views com relacionamentos
export interface AppointmentWithDetails extends Appointment {
  patient: Patient;
  procedure: Procedure;
}

// Tipo para o schema do Supabase
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      procedures: {
        Row: Procedure
        Insert: ProcedureInsert
        Update: ProcedureUpdate
        Relationships: []
      }
      patients: {
        Row: Patient
        Insert: PatientInsert
        Update: PatientUpdate
        Relationships: []
      }
      appointments: {
        Row: Appointment
        Insert: AppointmentInsert
        Update: AppointmentUpdate
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}