import { createClient } from '@/lib/supabase/client';
import { SUBSCRIPTION_LIMITS, type SubscriptionTier } from '@/lib/types/database';

/**
 * Audio Storage Utilities
 * For persisting audio files in Supabase Storage
 */

const BUCKET_NAME = 'call-recordings';

export interface UploadAudioOptions {
  file: File;
  organizationId: string;
  userId: string;
  callAnalysisId?: string;
}

export interface UploadAudioResult {
  success: boolean;
  path?: string;
  url?: string;
  error?: string;
}

/**
 * Check if audio storage is enabled for a subscription tier
 */
export function isAudioStorageEnabled(tier: SubscriptionTier): boolean {
  return SUBSCRIPTION_LIMITS[tier]?.features?.audioStorage ?? false;
}

/**
 * Upload audio file to Supabase Storage
 */
export async function uploadAudioFile(
  options: UploadAudioOptions
): Promise<UploadAudioResult> {
  const { file, organizationId, userId, callAnalysisId } = options;
  
  try {
    const supabase = createClient();

    // Generate unique file path: org_id/user_id/timestamp_filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${organizationId}/${userId}/${timestamp}_${sanitizedFileName}`;

    // Upload the file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      console.error('[Storage] Upload error:', error);
      return { success: false, error: error.message };
    }

    // Get signed URL (valid for 1 year)
    const { data: urlData } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

    // Update call_analyses if we have the ID
    if (callAnalysisId) {
      await supabase
        .from('call_analyses')
        .update({
          file_path: filePath,
          audio_url: urlData?.signedUrl,
          storage_bucket: BUCKET_NAME,
        })
        .eq('id', callAnalysisId);
    }

    return {
      success: true,
      path: filePath,
      url: urlData?.signedUrl,
    };
  } catch (error) {
    console.error('[Storage] Error uploading audio:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Get signed URL for an audio file
 */
export async function getAudioUrl(filePath: string): Promise<string | null> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 60 * 60 * 24); // 24 hours
    
    if (error) {
      console.error('[Storage] Error getting URL:', error);
      return null;
    }
    
    return data?.signedUrl || null;
  } catch (error) {
    console.error('[Storage] Error getting audio URL:', error);
    return null;
  }
}

/**
 * Delete audio file from storage
 */
export async function deleteAudioFile(filePath: string): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);
    
    if (error) {
      console.error('[Storage] Error deleting file:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[Storage] Error deleting audio:', error);
    return false;
  }
}

/**
 * Calculate storage used by an organization
 */
export async function calculateStorageUsed(
  organizationId: string
): Promise<number> {
  try {
    const supabase = createClient();
    
    // List all files in the organization's folder
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(organizationId, {
        limit: 1000,
      });
    
    if (error || !data) {
      return 0;
    }
    
    // Sum up file sizes
    const totalBytes = data.reduce((acc, file) => {
      return acc + (file.metadata?.size || 0);
    }, 0);
    
    // Convert to MB
    return totalBytes / (1024 * 1024);
  } catch (error) {
    console.error('[Storage] Error calculating storage:', error);
    return 0;
  }
}

/**
 * Check if organization has storage quota available
 */
export async function checkStorageQuota(
  organizationId: string,
  tier: SubscriptionTier,
  fileSizeMb: number
): Promise<{ allowed: boolean; currentUsed: number; limit: number }> {
  const limits = SUBSCRIPTION_LIMITS[tier];
  const storageLimit = limits.storageMb;
  
  // Get current usage from organization record (more efficient than calculating)
  const supabase = createClient();
  const { data: org } = await supabase
    .from('organizations')
    .select('storage_used_mb')
    .eq('id', organizationId)
    .single();
  
  const currentUsed = org?.storage_used_mb || 0;
  const allowed = (currentUsed + fileSizeMb) <= storageLimit;
  
  return {
    allowed,
    currentUsed,
    limit: storageLimit,
  };
}

/**
 * Update organization's storage usage
 */
export async function updateStorageUsage(
  organizationId: string,
  changeInMb: number
): Promise<void> {
  try {
    const supabase = createClient();
    
    // Use RPC to increment atomically if available, otherwise use update
    const { data: org } = await supabase
      .from('organizations')
      .select('storage_used_mb')
      .eq('id', organizationId)
      .single();
    
    const newUsage = Math.max(0, (org?.storage_used_mb || 0) + changeInMb);
    
    await supabase
      .from('organizations')
      .update({ storage_used_mb: newUsage })
      .eq('id', organizationId);
  } catch (error) {
    console.error('[Storage] Error updating storage usage:', error);
  }
}
