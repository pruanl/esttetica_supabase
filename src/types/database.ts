export interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  address?: string;
  notes?: string;
  allergies?: string;
  medical_history?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Procedure {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
  cost?: number;
  category?: string;
  user_id: string;
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
  total_price: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppointmentWithDetails extends Appointment {
  patient: Patient;
  procedure: Procedure;
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  category?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessSettings {
  id: string;
  user_id: string;
  working_hours_per_day: number;
  working_days_per_month: number;
  work_days_per_week: number;
  work_hours_per_day: number;
  desired_profit_margin?: number;
  created_at: string;
  updated_at: string;
}

// Insert types
export type PatientInsert = Omit<Patient, 'id' | 'created_at' | 'updated_at'>;
export type ProcedureInsert = Omit<Procedure, 'id' | 'created_at' | 'updated_at'>;
export type AppointmentInsert = Omit<Appointment, 'id' | 'created_at' | 'updated_at'>;
export type FixedExpenseInsert = Omit<FixedExpense, 'id' | 'created_at' | 'updated_at'>;
export type BusinessSettingsInsert = Omit<BusinessSettings, 'id' | 'created_at' | 'updated_at'>;

// Update types
export type PatientUpdate = Partial<PatientInsert>;
export type ProcedureUpdate = Partial<ProcedureInsert>;
export type AppointmentUpdate = Partial<AppointmentInsert>;
export type FixedExpenseUpdate = Partial<FixedExpenseInsert>;
export type BusinessSettingsUpdate = Partial<BusinessSettingsInsert>;

// Database type for Supabase
export interface Database {
  public: {
    Tables: {
      patients: {
        Row: Patient;
        Insert: PatientInsert;
        Update: PatientUpdate;
      };
      procedures: {
        Row: Procedure;
        Insert: ProcedureInsert;
        Update: ProcedureUpdate;
      };
      appointments: {
        Row: Appointment;
        Insert: AppointmentInsert;
        Update: AppointmentUpdate;
      };
      fixed_expenses: {
        Row: FixedExpense;
        Insert: FixedExpenseInsert;
        Update: FixedExpenseUpdate;
      };
      business_settings: {
        Row: BusinessSettings;
        Insert: BusinessSettingsInsert;
        Update: BusinessSettingsUpdate;
      };
    };
  };
}