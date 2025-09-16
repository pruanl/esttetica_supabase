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
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppointmentWithDetails extends Appointment {
  patient: Patient
  procedure: Procedure
}

export interface Transaction {
  id: number
  created_at: string
  description: string
  amount: number
  type: 'income' | 'expense'
  entry_date: string
  user_id: string
  appointment_id?: string
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

export interface Profile {
  id: string;
  clinic_name?: string;
  whatsapp_number?: string;
  profile_avatar_url?: string;
  cover_photo_url?: string;
  address?: string;
  cep?: string;
  street?: string;
  number?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  instagram_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
  facebook_url?: string;
  created_at: string;
  updated_at: string;
}

export interface GalleryPhoto {
  id: number;
  photo_url: string;
  user_id: string;
  created_at: string;
}

// Insert types
export type PatientInsert = Omit<Patient, 'id' | 'created_at' | 'updated_at'>;
export type ProcedureInsert = Omit<Procedure, 'id' | 'created_at' | 'updated_at'>;
export type AppointmentInsert = Omit<Appointment, 'id' | 'created_at' | 'updated_at'>;
export type TransactionInsert = Omit<Transaction, 'id' | 'created_at'>;
export type FixedExpenseInsert = Omit<FixedExpense, 'id' | 'created_at' | 'updated_at'>;
export type BusinessSettingsInsert = Omit<BusinessSettings, 'id' | 'created_at' | 'updated_at'>;
export type ProfileInsert = Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
export type GalleryPhotoInsert = Omit<GalleryPhoto, 'id' | 'created_at'>;

// Update types
export type PatientUpdate = Partial<PatientInsert>;
export type ProcedureUpdate = Partial<ProcedureInsert>;
export type AppointmentUpdate = Partial<Omit<Appointment, 'id' | 'created_at' | 'updated_at'>>;
export type TransactionUpdate = Partial<TransactionInsert>;
export type FixedExpenseUpdate = Partial<FixedExpenseInsert>;
export type BusinessSettingsUpdate = Partial<BusinessSettingsInsert>;
export type ProfileUpdate = Partial<ProfileInsert>;
export type GalleryPhotoUpdate = Partial<GalleryPhotoInsert>;

// Database type for Supabase
export type Database = {
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
      transactions: {
        Row: Transaction;
        Insert: TransactionInsert;
        Update: TransactionUpdate;
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
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      gallery_photos: {
        Row: GalleryPhoto;
        Insert: GalleryPhotoInsert;
        Update: GalleryPhotoUpdate;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}