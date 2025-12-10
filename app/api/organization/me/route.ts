import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

/**
 * Get the current user's organization.
 * Uses service client to bypass RLS.
 */
export async function GET() {
  console.log('[/api/organization/me] Request received');
  
  try {
    // Use regular client for auth check
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('[/api/organization/me] No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[/api/organization/me] User:', user.id);

    // Check if service role key is configured
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('[/api/organization/me] Service key configured:', hasServiceKey);

    // Use service client to bypass RLS
    let serviceClient;
    try {
      serviceClient = createServiceClient();
      console.log('[/api/organization/me] Service client created successfully');
    } catch (e: any) {
      console.error('[/api/organization/me] Service client error:', e.message);
      return NextResponse.json({ 
        error: 'Server configuration error',
        details: 'SUPABASE_SERVICE_ROLE_KEY is not configured.',
        hasKey: hasServiceKey
      }, { status: 500 });
    }

    // Get organization membership
    const { data: membership, error: membershipError } = await serviceClient
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError) {
      console.error('Error fetching membership:', membershipError);
      return NextResponse.json({ 
        error: 'Failed to fetch organization membership',
        details: membershipError.message 
      }, { status: 500 });
    }

    if (!membership || !membership.organization_id) {
      return NextResponse.json({ 
        organization: null,
        membership: null 
      });
    }

    // Get organization details
    const { data: organization, error: orgError } = await serviceClient
      .from('organizations')
      .select('*')
      .eq('id', membership.organization_id)
      .maybeSingle();

    if (orgError) {
      console.error('Error fetching organization:', orgError);
      return NextResponse.json({ 
        error: 'Failed to fetch organization',
        details: orgError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      organization,
      membership: {
        organization_id: membership.organization_id,
        role: membership.role,
      },
    });
  } catch (error) {
    console.error('Error in /api/organization/me:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch organization',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

