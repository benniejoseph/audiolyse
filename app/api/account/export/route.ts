import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * GET /api/account/export
 * 
 * Exports all user data in JSON format for DPDP/GDPR compliance.
 * This implements the "Right to Data Portability".
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    
    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // 2. Fetch profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // 3. Fetch organization memberships
    const { data: memberships } = await supabase
      .from('organization_members')
      .select(`
        id,
        role,
        joined_at,
        organization:organizations (
          id,
          name,
          slug,
          industry,
          subscription_tier,
          ai_settings
        )
      `)
      .eq('user_id', userId);

    // 4. Fetch call analyses uploaded by user
    const { data: callAnalyses } = await supabase
      .from('call_analyses')
      .select(`
        id,
        file_name,
        file_size_bytes,
        duration_sec,
        language,
        summary,
        overall_score,
        sentiment,
        status,
        created_at,
        transcription,
        analysis_json
      `)
      .eq('uploaded_by', userId)
      .order('created_at', { ascending: false })
      .limit(1000); // Limit to prevent huge exports

    // 5. Fetch call analyses assigned to user
    const { data: assignedCalls } = await supabase
      .from('call_analyses')
      .select(`
        id,
        file_name,
        overall_score,
        sentiment,
        created_at
      `)
      .eq('assigned_to', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    // 6. Fetch usage logs
    const { data: usageLogs } = await supabase
      .from('usage_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(500);

    // 7. Fetch invitations sent by user
    const { data: invitations } = await supabase
      .from('invitations')
      .select('email, role, created_at, accepted_at, expires_at')
      .eq('invited_by', userId);

    // 8. Compile export data
    const exportData = {
      exportInfo: {
        exportedAt: new Date().toISOString(),
        userId: userId,
        email: user.email,
        exportVersion: '1.0',
        dataProtectionNotice: 'This data is exported in compliance with DPDP Act 2024 (India) and GDPR (EU).',
      },
      profile: profile ? {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        phone: profile.phone,
        country: profile.country,
        currency: profile.currency,
        jobTitle: profile.job_title,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      } : null,
      organizationMemberships: memberships?.map(m => ({
        role: m.role,
        joinedAt: m.joined_at,
        organization: m.organization,
      })) || [],
      callAnalyses: {
        count: callAnalyses?.length || 0,
        data: callAnalyses?.map(call => ({
          id: call.id,
          fileName: call.file_name,
          fileSizeBytes: call.file_size_bytes,
          durationSec: call.duration_sec,
          language: call.language,
          summary: call.summary,
          overallScore: call.overall_score,
          sentiment: call.sentiment,
          status: call.status,
          createdAt: call.created_at,
          transcription: call.transcription,
          analysisDetails: call.analysis_json,
        })) || [],
      },
      assignedCalls: assignedCalls?.map(call => ({
        id: call.id,
        fileName: call.file_name,
        overallScore: call.overall_score,
        sentiment: call.sentiment,
        assignedAt: call.created_at,
      })) || [],
      usageHistory: usageLogs?.map(log => ({
        action: log.action,
        timestamp: log.created_at,
        metadata: log.metadata,
      })) || [],
      invitationsSent: invitations?.map(inv => ({
        email: inv.email,
        role: inv.role,
        sentAt: inv.created_at,
        acceptedAt: inv.accepted_at,
        expiresAt: inv.expires_at,
      })) || [],
      authInfo: {
        email: user.email,
        emailConfirmedAt: user.email_confirmed_at,
        lastSignInAt: user.last_sign_in_at,
        createdAt: user.created_at,
        provider: user.app_metadata?.provider,
      },
    };

    // 9. Return as downloadable JSON
    const jsonContent = JSON.stringify(exportData, null, 2);
    
    return new NextResponse(jsonContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="audiolyse-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });

  } catch (error: any) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
