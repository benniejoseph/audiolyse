export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SubscriptionTier = 'free' | 'individual' | 'team' | 'enterprise' | 'payg';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';
export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

// Customer types
export type CustomerStatus = 'active' | 'inactive' | 'churned' | 'prospect';
export type CustomerLifecycleStage = 'prospect' | 'lead' | 'customer' | 'advocate' | 'churned';
export type CustomerCommunicationStyle = 'detailed' | 'brief' | 'emotional' | 'analytical';
export type CustomerDecisionStyle = 'quick' | 'deliberate' | 'needs_reassurance' | 'price_focused';

// Industry types for AI context
export type IndustryType = 
  | 'healthcare'
  | 'medical_equipment'
  | 'physiotherapy'
  | 'insurance'
  | 'banking'
  | 'real_estate'
  | 'saas'
  | 'ecommerce'
  | 'telecom'
  | 'education'
  | 'automotive'
  | 'hospitality'
  | 'legal'
  | 'general';

// Enhanced AI Settings interface
export interface AISettings {
  // Basic context
  context?: string;
  guidelines?: string;
  
  // Products & Services
  products?: string[];
  productDescriptions?: Record<string, string>;
  
  // Competitive landscape
  competitors?: string[];
  competitorNotes?: Record<string, string>;
  
  // Compliance
  complianceScripts?: string[];
  requiredDisclosures?: string[];
  
  // Custom terminology
  customTerminology?: string[];
  abbreviations?: Record<string, string>;
  
  // Scoring preferences
  scoringPreferences?: {
    strictness?: 'lenient' | 'moderate' | 'strict';
    focusAreas?: string[];
    weightOverrides?: Record<string, number>;
  };
  
  // Customer context
  customerContext?: {
    typicalProfiles?: string[];
    commonIssues?: string[];
    preferredTone?: 'formal' | 'friendly' | 'professional';
  };
  
  // Call handling
  callHandling?: {
    greetingScript?: string;
    closingScript?: string;
    escalationTriggers?: string[];
    holdProcedure?: string;
    transferProcedure?: string;
  };
  
  // Quality standards
  qualityStandards?: {
    minimumAcceptableScore?: number;
    redFlagThreshold?: number;
    complianceMandatory?: boolean;
  };
}

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
          is_admin: boolean;
          job_title?: string | null;
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
          is_admin?: boolean;
          job_title?: string | null;
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
          is_admin?: boolean;
          job_title?: string | null;
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
          credits_balance: number | null;
          daily_reset_date: string | null;
          billing_email: string | null;
          created_at: string;
          updated_at: string;
          current_period_start: string | null;
          current_period_end: string | null;
          industry?: string;
          onboarding_completed?: boolean;
          ai_settings?: Json;
          billing_interval?: 'monthly' | 'annual';
          annual_discount_applied?: boolean;
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
          industry?: string;
          onboarding_completed?: boolean;
          ai_settings?: Json;
          billing_interval?: 'monthly' | 'annual';
          annual_discount_applied?: boolean;
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
          credits_balance?: number | null;
          daily_reset_date?: string | null;
          billing_email?: string | null;
          created_at?: string;
          updated_at?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          industry?: string;
          onboarding_completed?: boolean;
          ai_settings?: Json;
          billing_interval?: 'monthly' | 'annual';
          annual_discount_applied?: boolean;
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
          audio_url: string | null;
          storage_bucket: string | null;
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
          assigned_to?: string | null;
          customer_id?: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          uploaded_by: string;
          team_id?: string | null;
          file_name: string;
          file_size_bytes: number;
          file_path?: string | null;
          audio_url?: string | null;
          storage_bucket?: string | null;
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
          assigned_to?: string | null;
          customer_id?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          uploaded_by?: string;
          team_id?: string | null;
          file_name?: string;
          file_size_bytes?: number;
          file_path?: string | null;
          audio_url?: string | null;
          storage_bucket?: string | null;
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
          assigned_to?: string | null;
          customer_id?: string | null;
        };
      };
      customer_profiles: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          company: string | null;
          external_id: string | null;
          preferred_language: string;
          preferred_contact_method: string;
          timezone: string | null;
          communication_style: CustomerCommunicationStyle | null;
          decision_style: CustomerDecisionStyle | null;
          price_sensitivity: 'low' | 'medium' | 'high';
          status: CustomerStatus;
          lifecycle_stage: CustomerLifecycleStage;
          account_type: string | null;
          total_calls: number;
          avg_sentiment_score: number | null;
          avg_call_score: number | null;
          last_interaction_date: string | null;
          first_interaction_date: string | null;
          notes: string | null;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          external_id?: string | null;
          preferred_language?: string;
          preferred_contact_method?: string;
          timezone?: string | null;
          communication_style?: CustomerCommunicationStyle | null;
          decision_style?: CustomerDecisionStyle | null;
          price_sensitivity?: 'low' | 'medium' | 'high';
          status?: CustomerStatus;
          lifecycle_stage?: CustomerLifecycleStage;
          account_type?: string | null;
          notes?: string | null;
          tags?: string[] | null;
          created_by?: string | null;
        };
        Update: {
          name?: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          external_id?: string | null;
          preferred_language?: string;
          preferred_contact_method?: string;
          timezone?: string | null;
          communication_style?: CustomerCommunicationStyle | null;
          decision_style?: CustomerDecisionStyle | null;
          price_sensitivity?: 'low' | 'medium' | 'high';
          status?: CustomerStatus;
          lifecycle_stage?: CustomerLifecycleStage;
          account_type?: string | null;
          notes?: string | null;
          tags?: string[] | null;
          updated_at?: string;
        };
      };
      customer_interactions: {
        Row: {
          id: string;
          customer_id: string;
          organization_id: string;
          interaction_type: 'call' | 'email' | 'meeting' | 'support_ticket';
          call_analysis_id: string | null;
          sentiment: string | null;
          sentiment_score: number | null;
          resolution_status: 'resolved' | 'pending' | 'escalated' | null;
          summary: string | null;
          key_topics: string[] | null;
          action_items: string[] | null;
          agent_id: string | null;
          interaction_date: string;
          duration_seconds: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          organization_id: string;
          interaction_type: 'call' | 'email' | 'meeting' | 'support_ticket';
          call_analysis_id?: string | null;
          sentiment?: string | null;
          sentiment_score?: number | null;
          resolution_status?: 'resolved' | 'pending' | 'escalated' | null;
          summary?: string | null;
          key_topics?: string[] | null;
          action_items?: string[] | null;
          agent_id?: string | null;
          interaction_date?: string;
          duration_seconds?: number | null;
        };
        Update: {
          sentiment?: string | null;
          sentiment_score?: number | null;
          resolution_status?: 'resolved' | 'pending' | 'escalated' | null;
          summary?: string | null;
          key_topics?: string[] | null;
          action_items?: string[] | null;
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
  maxFileSizeMb: number; // Max file size per upload
  features: {
    bulkUpload: boolean;
    pdfExport: boolean;
    teamManagement: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
    customBranding: boolean;
    audioStorage: boolean; // Whether to persist audio files
  };
  price: { INR: number; USD: number };
  overageRate: { INR: number; USD: number }; // Per call overage rate
}> = {
  free: {
    calls: 3, // Reduced from 10 to 3 calls per day for cost efficiency
    users: 1,
    storageMb: 50, // Reduced from 100 to 50MB
    historyDays: 7,
    maxFileSizeMb: 5, // 5MB limit for free tier (was 20MB)
    features: {
      bulkUpload: false,
      pdfExport: false,
      teamManagement: false,
      apiAccess: false,
      prioritySupport: false,
      customBranding: false,
      audioStorage: false, // Don't store audio for free tier - major cost savings
    },
    price: { INR: 0, USD: 0 },
    overageRate: { INR: 0, USD: 0 }, // No overage for free - must upgrade
  },
  individual: {
    calls: 50, // Reduced from 100 for better margins
    users: 1,
    storageMb: 500, // Reduced from 1000
    historyDays: 30,
    maxFileSizeMb: 20,
    features: {
      bulkUpload: true,
      pdfExport: true,
      teamManagement: false,
      apiAccess: false,
      prioritySupport: false,
      customBranding: false,
      audioStorage: true,
    },
    price: { INR: 499, USD: 6 },
    overageRate: { INR: 15, USD: 0.20 }, // Per call overage
  },
  team: {
    calls: 300, // Reduced from 600 for better margins
    users: 10,
    storageMb: 5000, // Reduced from 10000
    historyDays: 90,
    maxFileSizeMb: 50,
    features: {
      bulkUpload: true,
      pdfExport: true,
      teamManagement: true,
      apiAccess: false,
      prioritySupport: true,
      customBranding: false,
      audioStorage: true,
    },
    price: { INR: 1999, USD: 24 },
    overageRate: { INR: 10, USD: 0.15 },
  },
  enterprise: {
    calls: 1000, // Reduced from 2000 for better margins
    users: 999, // Effectively unlimited
    storageMb: 50000, // Reduced from 100000
    historyDays: 365,
    maxFileSizeMb: 100,
    features: {
      bulkUpload: true,
      pdfExport: true,
      teamManagement: true,
      apiAccess: true,
      prioritySupport: true,
      customBranding: true,
      audioStorage: true,
    },
    price: { INR: 4999, USD: 60 },
    overageRate: { INR: 7, USD: 0.10 },
  },
  payg: {
    calls: 0, // Pay-as-you-go: uses credits instead
    users: 1,
    storageMb: 500,
    historyDays: 30,
    maxFileSizeMb: 20,
    features: {
      bulkUpload: true,
      pdfExport: true,
      teamManagement: false,
      apiAccess: false,
      prioritySupport: false,
      customBranding: false,
      audioStorage: true,
    },
    price: { INR: 0, USD: 0 }, // No monthly fee
    overageRate: { INR: 5, USD: 0.06 }, // Base credit cost per call
  },
};

// Credit pricing for PAYG - aligned with credits page packages
export const CREDIT_PRICING = {
  perCredit: { INR: 5, USD: 0.06 }, // Base cost per credit/call (10-credit package)
  packages: [
    { credits: 10, priceINR: 50, priceUSD: 0.60, discount: 0 },
    { credits: 25, priceINR: 120, priceUSD: 1.44, discount: 0.04 }, // ~4% off
    { credits: 50, priceINR: 225, priceUSD: 2.70, discount: 0.10 }, // 10% off
    { credits: 100, priceINR: 400, priceUSD: 4.80, discount: 0.20 }, // 20% off
    { credits: 250, priceINR: 900, priceUSD: 10.80, discount: 0.28 }, // 28% off
    { credits: 500, priceINR: 1600, priceUSD: 19.20, discount: 0.36 }, // 36% off
  ],
};


