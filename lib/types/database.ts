export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SubscriptionTier = 'free' | 'individual' | 'team' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';
export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          country: string | null;
          currency: 'INR' | 'USD';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          country?: string | null;
          currency?: 'INR' | 'USD';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          country?: string | null;
          currency?: 'INR' | 'USD';
          created_at?: string;
          updated_at?: string;
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          owner_id: string;
          subscription_tier: SubscriptionTier;
          subscription_status: SubscriptionStatus;
          subscription_id: string | null;
          calls_limit: number;
          calls_used: number;
          storage_limit_mb: number;
          storage_used_mb: number;
          users_limit: number;
          billing_email: string | null;
          created_at: string;
          updated_at: string;
          current_period_start: string | null;
          current_period_end: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          owner_id: string;
          subscription_tier?: SubscriptionTier;
          subscription_status?: SubscriptionStatus;
          subscription_id?: string | null;
          calls_limit?: number;
          calls_used?: number;
          storage_limit_mb?: number;
          storage_used_mb?: number;
          users_limit?: number;
          billing_email?: string | null;
          created_at?: string;
          updated_at?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          owner_id?: string;
          subscription_tier?: SubscriptionTier;
          subscription_status?: SubscriptionStatus;
          subscription_id?: string | null;
          calls_limit?: number;
          calls_used?: number;
          storage_limit_mb?: number;
          storage_used_mb?: number;
          users_limit?: number;
          billing_email?: string | null;
          created_at?: string;
          updated_at?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
        };
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: UserRole;
          invited_by: string | null;
          invited_at: string | null;
          joined_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: UserRole;
          invited_by?: string | null;
          invited_at?: string | null;
          joined_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: UserRole;
          invited_by?: string | null;
          invited_at?: string | null;
          joined_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          role: 'lead' | 'member';
          joined_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          role?: 'lead' | 'member';
          joined_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          role?: 'lead' | 'member';
          joined_at?: string;
        };
      };
      call_analyses: {
        Row: {
          id: string;
          organization_id: string;
          uploaded_by: string;
          team_id: string | null;
          file_name: string;
          file_size_bytes: number;
          file_path: string | null;
          duration_sec: number | null;
          language: string | null;
          transcription: string | null;
          summary: string | null;
          overall_score: number | null;
          sentiment: string | null;
          analysis_json: Json | null;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          uploaded_by: string;
          team_id?: string | null;
          file_name: string;
          file_size_bytes: number;
          file_path?: string | null;
          duration_sec?: number | null;
          language?: string | null;
          transcription?: string | null;
          summary?: string | null;
          overall_score?: number | null;
          sentiment?: string | null;
          analysis_json?: Json | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          uploaded_by?: string;
          team_id?: string | null;
          file_name?: string;
          file_size_bytes?: number;
          file_path?: string | null;
          duration_sec?: number | null;
          language?: string | null;
          transcription?: string | null;
          summary?: string | null;
          overall_score?: number | null;
          sentiment?: string | null;
          analysis_json?: Json | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      usage_logs: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          action: 'call_analyzed' | 'pdf_exported' | 'api_call';
          call_analysis_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          action: 'call_analyzed' | 'pdf_exported' | 'api_call';
          call_analysis_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          action?: 'call_analyzed' | 'pdf_exported' | 'api_call';
          call_analysis_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      invitations: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          role: UserRole;
          token: string;
          invited_by: string;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          role?: UserRole;
          token: string;
          invited_by: string;
          expires_at: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email?: string;
          role?: UserRole;
          token?: string;
          invited_by?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      subscription_tier: SubscriptionTier;
      subscription_status: SubscriptionStatus;
      user_role: UserRole;
    };
  };
}

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Organization = Database['public']['Tables']['organizations']['Row'];
export type OrganizationMember = Database['public']['Tables']['organization_members']['Row'];
export type Team = Database['public']['Tables']['teams']['Row'];
export type TeamMember = Database['public']['Tables']['team_members']['Row'];
export type CallAnalysis = Database['public']['Tables']['call_analyses']['Row'];
export type UsageLog = Database['public']['Tables']['usage_logs']['Row'];
export type Invitation = Database['public']['Tables']['invitations']['Row'];

// Subscription limits
export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, {
  calls: number;
  users: number;
  storageMb: number;
  historyDays: number;
  features: {
    bulkUpload: boolean;
    pdfExport: boolean;
    teamManagement: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
    customBranding: boolean;
  };
  price: { INR: number; USD: number };
}> = {
  free: {
    calls: 3,
    users: 1,
    storageMb: 50,
    historyDays: 7,
    features: {
      bulkUpload: false,
      pdfExport: false,
      teamManagement: false,
      apiAccess: false,
      prioritySupport: false,
      customBranding: false,
    },
    price: { INR: 0, USD: 0 },
  },
  individual: {
    calls: 50,
    users: 1,
    storageMb: 500,
    historyDays: 30,
    features: {
      bulkUpload: true,
      pdfExport: true,
      teamManagement: false,
      apiAccess: false,
      prioritySupport: false,
      customBranding: false,
    },
    price: { INR: 499, USD: 6 },
  },
  team: {
    calls: 300,
    users: 10,
    storageMb: 5000,
    historyDays: 90,
    features: {
      bulkUpload: true,
      pdfExport: true,
      teamManagement: true,
      apiAccess: false,
      prioritySupport: true,
      customBranding: false,
    },
    price: { INR: 1999, USD: 24 },
  },
  enterprise: {
    calls: 1000,
    users: 999, // Effectively unlimited
    storageMb: 50000,
    historyDays: 365,
    features: {
      bulkUpload: true,
      pdfExport: true,
      teamManagement: true,
      apiAccess: true,
      prioritySupport: true,
      customBranding: true,
    },
    price: { INR: 4999, USD: 60 },
  },
};


