import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { sanitizeFileName, isValidIdentifier } from '@/lib/constants';

const isProduction = process.env.NODE_ENV === 'production';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user with regular client
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      file_path,
      audio_url,
    } = body;

    // Validate required fields
    if (!organization_id || !file_name || file_size_bytes === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate organization_id format (should be UUID)
    if (!isValidIdentifier(organization_id.replace(/-/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid organization ID format' },
        { status: 400 }
      );
    }

    // Sanitize file name to prevent injection attacks
    const sanitizedFileName = sanitizeFileName(file_name);

    // Use service client to bypass RLS
    let serviceClient;
    try {
      serviceClient = createServiceClient();
    } catch {
      return NextResponse.json(
        { error: 'Server configuration error' },
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

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Insert call analysis using service client (bypasses RLS)
    const { data: analysis, error: insertError } = await serviceClient
      .from('call_analyses')
      .insert({
        organization_id,
        uploaded_by: user.id,
        file_name: sanitizedFileName,
        file_size_bytes,
        duration_sec: duration_sec || null,
        language: language || null,
        transcription: transcription || null,
        summary: summary || null,
        overall_score: overall_score || null,
        sentiment: sentiment || null,
        analysis_json: analysis_json || null,
        status,
        file_path: file_path || null,
        audio_url: audio_url || null,
      })
      .select('id')
      .single();

    if (insertError || !analysis?.id) {
      if (!isProduction) {
        console.error('Insert error:', insertError);
      }
      return NextResponse.json(
        { error: 'Failed to save analysis' },
        { status: 500 }
      );
    }

    // Increment usage - use database function (non-blocking errors)
    const fileSizeMb = file_size_bytes / (1024 * 1024);
    await serviceClient.rpc('increment_usage', {
      org_id: organization_id,
      file_size_mb: fileSizeMb,
      user_id: user.id,
    });

    // Log usage (non-blocking)
    await serviceClient
      .from('usage_logs')
      .insert({
        organization_id,
        user_id: user.id,
        action: 'call_analyzed',
        call_analysis_id: analysis.id,
        metadata: { file_name: sanitizedFileName, file_size: file_size_bytes },
      });

    return NextResponse.json({
      success: true,
      id: analysis.id,
    });
  } catch (error: any) {
    if (!isProduction) {
      console.error('API error:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

