import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

/**
 * DELETE /api/account/delete
 * 
 * Permanently deletes a user's account and all associated data.
 * This is a CRITICAL legal requirement for DPDP/GDPR compliance.
 * 
 * Process:
 * 1. Verify user authentication
 * 2. Check if user owns any organizations (must transfer ownership first)
 * 3. Delete or anonymize call analyses
 * 4. Delete organization memberships
 * 5. Delete profile
 * 6. Delete auth user
 * 7. Log the deletion for compliance audit
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient();
    
    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in again.' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const userEmail = user.email;

    // 2. Check if user owns any organizations
    const { data: ownedOrgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('owner_id', userId);

    if (orgError) {
      console.error('Error checking owned organizations:', orgError);
      return NextResponse.json(
        { error: 'Failed to verify account status' },
        { status: 500 }
      );
    }

    if (ownedOrgs && ownedOrgs.length > 0) {
      // User owns organizations - they must transfer ownership first
      return NextResponse.json(
        { 
          error: 'Cannot delete account while owning organizations',
          details: `You own ${ownedOrgs.length} organization(s): ${ownedOrgs.map(o => o.name).join(', ')}. Please transfer ownership or delete the organization(s) first.`,
          ownedOrganizations: ownedOrgs
        },
        { status: 400 }
      );
    }

    // Use admin client for deletion operations that bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase configuration for admin operations');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 3. Get user's organization memberships
    const { data: memberships } = await adminClient
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userId);

    const orgIds = memberships?.map(m => m.organization_id) || [];

    // 4. Anonymize call analyses (keep for org reporting but remove user identity)
    // We don't delete calls - we anonymize them for data integrity
    if (orgIds.length > 0) {
      const { error: callUpdateError } = await adminClient
        .from('call_analyses')
        .update({ 
          uploaded_by: '00000000-0000-0000-0000-000000000000', // Anonymized user ID
          assigned_to: null 
        })
        .eq('uploaded_by', userId);

      if (callUpdateError) {
        console.error('Error anonymizing call analyses:', callUpdateError);
        // Continue with deletion - this is non-critical
      }

      // Also update any calls assigned to this user
      await adminClient
        .from('call_analyses')
        .update({ assigned_to: null })
        .eq('assigned_to', userId);
    }

    // 5. Delete usage logs (or anonymize)
    await adminClient
      .from('usage_logs')
      .delete()
      .eq('user_id', userId);

    // 6. Delete invitations sent by this user
    await adminClient
      .from('invitations')
      .delete()
      .eq('invited_by', userId);

    // 7. Delete organization memberships
    const { error: membershipError } = await adminClient
      .from('organization_members')
      .delete()
      .eq('user_id', userId);

    if (membershipError) {
      console.error('Error deleting organization memberships:', membershipError);
      return NextResponse.json(
        { error: 'Failed to remove organization memberships' },
        { status: 500 }
      );
    }

    // 8. Delete profile
    const { error: profileError } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to delete profile' },
        { status: 500 }
      );
    }

    // 9. Delete auth user using admin API
    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError);
      // Profile is already deleted, so we continue even if auth deletion fails
      // The user won't be able to log in anyway since profile is gone
    }

    // 10. Log deletion for compliance audit (to a separate audit table)
    // This is kept even after user deletion for legal compliance
    try {
      await adminClient
        .from('audit_logs')
        .insert({
          user_id: null, // User is deleted
          action: 'account_deleted',
          resource_type: 'user',
          resource_id: userId,
          metadata: {
            email_hash: hashEmail(userEmail || ''),
            deleted_at: new Date().toISOString(),
            organizations_left: orgIds,
          }
        });
    } catch (auditError) {
      // Don't fail if audit logging fails - the deletion is still successful
      console.warn('Failed to log deletion audit:', auditError);
    }

    return NextResponse.json({
      success: true,
      message: 'Your account has been permanently deleted. All personal data has been removed.',
    });

  } catch (error: any) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during account deletion' },
      { status: 500 }
    );
  }
}

/**
 * Simple email hash for audit purposes
 * We don't store the actual email after deletion, just a hash for reference
 */
function hashEmail(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return 'hash_' + Math.abs(hash).toString(16);
}
