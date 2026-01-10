/**
 * Audio Storage Testing API Endpoint
 * 
 * Tests the audio storage flow including:
 * - Bucket existence and configuration
 * - File upload capability
 * - Signed URL generation
 * - Storage quota checks
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { 
  isAudioStorageEnabled, 
  checkStorageQuota, 
  calculateStorageUsed,
} from '@/lib/storage/audio';
import { SUBSCRIPTION_LIMITS, type SubscriptionTier } from '@/lib/types/database';

// Storage bucket name
const BUCKET_NAME = 'call-recordings';

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get service client for storage operations
    let serviceClient;
    try {
      serviceClient = createServiceClient();
    } catch {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Check if user is admin (in production)
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && !profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get user's organization and tier
    const { data: membership } = await serviceClient
      .from('organization_members')
      .select('organization_id, organization:organizations(id, name, subscription_tier, storage_used_mb, storage_limit_mb)')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership?.organization) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const org = membership.organization as any;
    const tier = org.subscription_tier as SubscriptionTier;

    // Test results
    const results: Record<string, any> = {
      timestamp: new Date().toISOString(),
      organization: {
        id: org.id,
        name: org.name,
        tier: tier,
      },
      tests: {},
    };

    // Test 1: Check if audio storage is enabled for this tier
    const audioStorageEnabled = isAudioStorageEnabled(tier);
    results.tests.audioStorageEnabled = {
      passed: true,
      value: audioStorageEnabled,
      message: audioStorageEnabled 
        ? `Audio storage is enabled for ${tier} tier`
        : `Audio storage is disabled for ${tier} tier (free tier)`,
    };

    // Test 2: Check bucket existence
    const { data: buckets, error: bucketsError } = await serviceClient.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);
    results.tests.bucketExists = {
      passed: bucketExists || false,
      value: bucketExists,
      message: bucketExists 
        ? `Bucket '${BUCKET_NAME}' exists`
        : `Bucket '${BUCKET_NAME}' not found. Create it in Supabase Dashboard.`,
      error: bucketsError?.message,
    };

    // Test 3: Storage limits configuration
    const tierLimits = SUBSCRIPTION_LIMITS[tier];
    results.tests.storageLimits = {
      passed: true,
      value: {
        maxFileSizeMb: tierLimits.maxFileSizeMb,
        storageLimitMb: tierLimits.storageMb,
        audioStorageFeature: tierLimits.features.audioStorage,
      },
      message: `Tier limits: ${tierLimits.maxFileSizeMb}MB max file, ${tierLimits.storageMb}MB total storage`,
    };

    // Test 4: Current storage usage
    const currentUsage = await calculateStorageUsed(org.id);
    results.tests.storageUsage = {
      passed: true,
      value: {
        used: currentUsage,
        limit: org.storage_limit_mb || tierLimits.storageMb,
        percentUsed: ((currentUsage / (org.storage_limit_mb || tierLimits.storageMb)) * 100).toFixed(1),
      },
      message: `Using ${currentUsage.toFixed(2)}MB of ${org.storage_limit_mb || tierLimits.storageMb}MB`,
    };

    // Test 5: Storage quota check
    const quotaCheck = await checkStorageQuota(org.id, tier, 1); // Test with 1MB file
    results.tests.quotaCheck = {
      passed: quotaCheck.allowed,
      value: quotaCheck,
      message: quotaCheck.allowed 
        ? 'Storage quota allows new uploads'
        : `Storage quota exceeded: ${quotaCheck.currentUsed.toFixed(1)}MB / ${quotaCheck.limit}MB`,
    };

    // Test 6: Try listing files in org folder
    if (bucketExists) {
      const { data: files, error: listError } = await serviceClient.storage
        .from(BUCKET_NAME)
        .list(org.id, { limit: 5 });

      results.tests.listFiles = {
        passed: !listError,
        value: {
          fileCount: files?.length || 0,
          recentFiles: files?.slice(0, 3).map(f => f.name) || [],
        },
        message: listError 
          ? `Error listing files: ${listError.message}`
          : `Found ${files?.length || 0} files in organization folder`,
        error: listError?.message,
      };
    }

    // Overall status
    const allPassed = Object.values(results.tests).every((t: any) => t.passed);
    results.overallStatus = allPassed ? 'PASS' : 'PARTIAL';
    results.summary = allPassed 
      ? 'All audio storage tests passed!'
      : 'Some tests failed. Check individual test results.';

    return NextResponse.json(results);
  } catch (error) {
    console.error('Audio storage test error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Test failed',
      overallStatus: 'FAIL',
    }, { status: 500 });
  }
}

/**
 * POST endpoint to test upload (creates and immediately deletes a test file)
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let serviceClient;
    try {
      serviceClient = createServiceClient();
    } catch {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Get organization
    const { data: membership } = await serviceClient
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Create a small test file
    const testContent = 'Audio storage test file - ' + new Date().toISOString();
    const testFileName = `${membership.organization_id}/test_${Date.now()}.txt`;

    // Upload test file
    const { data: uploadData, error: uploadError } = await serviceClient.storage
      .from(BUCKET_NAME)
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({
        success: false,
        test: 'upload',
        error: uploadError.message,
        message: 'Upload test failed. Ensure bucket exists and has correct policies.',
      }, { status: 500 });
    }

    // Get signed URL
    const { data: urlData, error: urlError } = await serviceClient.storage
      .from(BUCKET_NAME)
      .createSignedUrl(testFileName, 60); // 1 minute expiry

    // Delete test file
    const { error: deleteError } = await serviceClient.storage
      .from(BUCKET_NAME)
      .remove([testFileName]);

    return NextResponse.json({
      success: true,
      tests: {
        upload: {
          passed: true,
          path: uploadData.path,
        },
        signedUrl: {
          passed: !urlError,
          url: urlData?.signedUrl ? 'Generated successfully' : null,
          error: urlError?.message,
        },
        delete: {
          passed: !deleteError,
          error: deleteError?.message,
        },
      },
      message: 'Upload/download/delete cycle completed successfully!',
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Upload test failed',
    }, { status: 500 });
  }
}
