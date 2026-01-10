/**
 * Consent Management Types
 * For DPDP Act 2024, GDPR, and other privacy regulations
 */

export type ConsentType = 
  | 'audio_processing'    // Consent to process audio files
  | 'ai_analysis'         // Consent for AI to analyze conversations
  | 'data_storage'        // Consent to store data
  | 'marketing'           // Consent for marketing communications
  | 'third_party_sharing' // Consent to share with third parties
  | 'patient_data';       // Healthcare-specific: patient consent obtained

export interface ConsentRecord {
  id: string;
  user_id: string;
  organization_id: string | null;
  consent_type: ConsentType;
  consent_version: string;
  consented: boolean;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  withdrawn_at: string | null;
  metadata: Record<string, any> | null;
}

export interface ConsentRequirement {
  type: ConsentType;
  required: boolean;
  label: string;
  description: string;
  learnMoreUrl?: string;
}

// Consent requirements for different contexts
export const UPLOAD_CONSENT_REQUIREMENTS: ConsentRequirement[] = [
  {
    type: 'audio_processing',
    required: true,
    label: 'Audio Processing',
    description: 'I consent to uploading and processing this audio recording.',
  },
  {
    type: 'ai_analysis',
    required: true,
    label: 'AI Analysis',
    description: 'I consent to AI-powered analysis of this conversation for quality assurance and coaching insights.',
  },
  {
    type: 'data_storage',
    required: true,
    label: 'Data Storage',
    description: 'I consent to storing the transcription and analysis results according to the data retention policy.',
  },
  {
    type: 'patient_data',
    required: false, // Only required for healthcare orgs
    label: 'Patient Consent Obtained',
    description: 'I certify that I have obtained necessary patient/customer consent to record and analyze this conversation, in compliance with applicable privacy laws (HIPAA/DPDP).',
  },
];

export const MARKETING_CONSENT_REQUIREMENTS: ConsentRequirement[] = [
  {
    type: 'marketing',
    required: false,
    label: 'Marketing Communications',
    description: 'I consent to receiving product updates, tips, and promotional content via email.',
  },
];

// Consent version - increment when consent requirements change
export const CONSENT_VERSION = '1.0';

/**
 * Check if all required consents are given
 */
export function hasAllRequiredConsents(
  consents: Record<ConsentType, boolean>,
  requirements: ConsentRequirement[],
  isHealthcareOrg: boolean = false
): boolean {
  for (const req of requirements) {
    // Skip patient_data for non-healthcare orgs
    if (req.type === 'patient_data' && !isHealthcareOrg) {
      continue;
    }
    
    if (req.required && !consents[req.type]) {
      return false;
    }
  }
  return true;
}
