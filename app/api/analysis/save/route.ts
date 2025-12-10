import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user with regular client
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: userError?.message },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const {
      organization_id,
      file_name,
      file_size_bytes,
      duration_sec,
      language,
      transcription,
      summary,
      overall_score,
      sentiment,
      analysis_json,
      status = 'completed',
    } = body;

    // Validate required fields
    if (!organization_id || !file_name || file_size_bytes === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields', details: 'organization_id, file_name, and file_size_bytes are required' },
        { status: 400 }
      );
    }

    // Use service client to bypass RLS
    let serviceClient;
    try {
      serviceClient = createServiceClient();
    } catch (e: any) {
      console.error('Service client not configured in /api/analysis/save:', e.message);
      return NextResponse.json(
        { error: 'Server configuration error', details: e.message },
        { status: 500 }
      );
    }

    // Verify user is a member of the organization
    const { data: membership, error: membershipError } = await serviceClient
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', organization_id)
      .maybeSingle();

    if (membershipError) {
      console.error('Error checking organization membership in /api/analysis/save:', membershipError);
      return NextResponse.json(
        { error: 'Failed to verify organization membership', details: membershipError.message },
        { status: 500 }
      );
    }

    if (!membership) {
      return NextResponse.json(
        { error: 'User is not a member of this organization' },
        { status: 403 }
      );
    }

    // Insert call analysis using service client (bypasses RLS)
    const { data: analysis, error: insertError } = await serviceClient
      .from('call_analyses')
      .insert({
        organization_id,
        uploaded_by: user.id,
        file_name,
        file_size_bytes,
        duration_sec: duration_sec || null,
        language: language || null,
        transcription: transcription || null,
        summary: summary || null,
        overall_score: overall_score || null,
        sentiment: sentiment || null,
        analysis_json: analysis_json || null,
        status,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error inserting call analysis in /api/analysis/save:', insertError);
      return NextResponse.json(
        { error: 'Failed to save analysis', details: insertError.message },
        { status: 500 }
      );
    }

    if (!analysis?.id) {
      return NextResponse.json(
        { error: 'Failed to save analysis: No ID returned' },
        { status: 500 }
      );
    }

    // Increment usage - use database function
    const fileSizeMb = file_size_bytes / (1024 * 1024);
    const { error: usageError } = await serviceClient.rpc('increment_usage', {
      org_id: organization_id,
      file_size_mb: fileSizeMb,
      user_id: user.id,
    });

    if (usageError) {
      console.error('Error incrementing usage in /api/analysis/save:', usageError);
      // Don't fail the request if usage increment fails, just log it
    }

    // Log usage
    const { error: logError } = await serviceClient
      .from('usage_logs')
      .insert({
        organization_id,
        user_id: user.id,
        action: 'call_analyzed',
        call_analysis_id: analysis.id,
        metadata: { file_name: file_name, file_size: file_size_bytes },
      });

    if (logError) {
      console.error('Error logging usage in /api/analysis/save:', logError);
      // Don't fail the request if logging fails, just log it
    }

    return NextResponse.json({
      success: true,
      id: analysis.id,
    });
  } catch (error: any) {
    console.error('Unexpected error in /api/analysis/save:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

