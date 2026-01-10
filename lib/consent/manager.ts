import { createClient } from '@/lib/supabase/client';
import type { ConsentType, ConsentRecord } from './types';
import { CONSENT_VERSION } from './types';

/**
 * Consent Manager
 * Handles recording and checking user consents
 */

/**
 * Record a consent decision
 */
export async function recordConsent(
  consentType: ConsentType,
  consented: boolean,
  organizationId?: string | null,
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get client info for audit
    const userAgent = typeof window !== 'undefined' ? navigator.userAgent : null;

    const { error } = await supabase
      .from('consent_records')
      .insert({
        user_id: user.id,
        organization_id: organizationId || null,
        consent_type: consentType,
        consent_version: CONSENT_VERSION,
        consented,
        user_agent: userAgent,
        metadata: metadata || null,
      });

    if (error) {
      console.error('Error recording consent:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error recording consent:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Record multiple consents at once
 */
export async function recordMultipleConsents(
  consents: Record<ConsentType, boolean>,
  organizationId?: string | null,
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const userAgent = typeof window !== 'undefined' ? navigator.userAgent : null;

    const records = Object.entries(consents).map(([consentType, consented]) => ({
      user_id: user.id,
      organization_id: organizationId || null,
      consent_type: consentType,
      consent_version: CONSENT_VERSION,
      consented,
      user_agent: userAgent,
      metadata: metadata || null,
    }));

    const { error } = await supabase
      .from('consent_records')
      .insert(records);

    if (error) {
      console.error('Error recording consents:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error recording consents:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Withdraw a consent
 */
export async function withdrawConsent(
  consentType: ConsentType
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Mark existing consent as withdrawn
    const { error } = await supabase
      .from('consent_records')
      .update({ withdrawn_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('consent_type', consentType)
      .is('withdrawn_at', null);

    if (error) {
      console.error('Error withdrawing consent:', error);
      return { success: false, error: error.message };
    }

    // Record the withdrawal as a new record
    await recordConsent(consentType, false);

    return { success: true };
  } catch (error: any) {
    console.error('Error withdrawing consent:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if user has given a specific consent
 */
export async function checkConsent(
  consentType: ConsentType
): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }

    const { data, error } = await supabase
      .from('consent_records')
      .select('consented')
      .eq('user_id', user.id)
      .eq('consent_type', consentType)
      .is('withdrawn_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return false;
    }

    return data.consented;
  } catch (error) {
    console.error('Error checking consent:', error);
    return false;
  }
}

/**
 * Get all consents for current user
 */
export async function getUserConsents(): Promise<ConsentRecord[]> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('consent_records')
      .select('*')
      .eq('user_id', user.id)
      .is('withdrawn_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching consents:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching consents:', error);
    return [];
  }
}

/**
 * Get current consent status for all types
 */
export async function getConsentStatus(): Promise<Record<ConsentType, boolean>> {
  const consents = await getUserConsents();
  
  const status: Record<ConsentType, boolean> = {
    audio_processing: false,
    ai_analysis: false,
    data_storage: false,
    marketing: false,
    third_party_sharing: false,
    patient_data: false,
  };

  // Get the most recent consent for each type
  for (const consent of consents) {
    const type = consent.consent_type as ConsentType;
    if (!(type in status) || status[type] === false) {
      status[type] = consent.consented;
    }
  }

  return status;
}
