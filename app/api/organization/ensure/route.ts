import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Ensures the user has an organization. Creates one if it doesn't exist.
 * This is a safety net for cases where the trigger didn't fire or failed.
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has a profile
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    // Create profile if it doesn't exist
    if (!profile) {
      const user_name = user.user_metadata?.full_name || 
                       user.user_metadata?.name || 
                       user.email?.split('@')[0] || 
                       'User';
      
      const { data: newProfile, error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          full_name: user_name,
        })
        .select()
        .single();

      if (createProfileError) {
        console.error('Error creating profile:', createProfileError);
        return NextResponse.json({ 
          error: 'Failed to create profile',
          details: createProfileError.message 
        }, { status: 500 });
      }

      profile = newProfile;
    }

    // Check if user has an organization membership
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError) {
      console.error('Error checking membership:', membershipError);
      return NextResponse.json({ 
        error: 'Failed to check organization membership',
        details: membershipError.message 
      }, { status: 500 });
    }

    // If organization exists, return it
    if (membership && membership.organization_id) {
      const { data: organization, error: orgError } = await supabase
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

      if (organization) {
        return NextResponse.json({
          success: true,
          organization: organization,
          created: false,
        });
      }
    }

    // Create organization if it doesn't exist
    const user_name = profile.full_name || user.email?.split('@')[0] || 'User';
    const org_slug = user.email 
      ? (user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 10))
      : ('user-' + Math.random().toString(36).substring(2, 10));

    const { data: newOrg, error: createOrgError } = await supabase
      .from('organizations')
      .insert({
        name: `${user_name}'s Workspace`,
        slug: org_slug,
        owner_id: user.id,
        billing_email: user.email || null,
        subscription_tier: 'free',
        subscription_status: 'active',
        calls_limit: 10, // Free tier: 10 calls per day
        calls_used: 0,
        storage_limit_mb: 100,
        storage_used_mb: 0,
        users_limit: 1,
        daily_reset_date: new Date().toISOString().split('T')[0],
        credits_balance: 0,
      })
      .select()
      .single();

    if (createOrgError) {
      console.error('Error creating organization:', createOrgError);
      return NextResponse.json({ 
        error: 'Failed to create organization',
        details: createOrgError.message 
      }, { status: 500 });
    }

    // Add user as owner of the organization
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: newOrg.id,
        user_id: user.id,
        role: 'owner',
      });

    if (memberError) {
      console.error('Error creating organization membership:', memberError);
      // Don't fail - organization is created, membership can be fixed later
    }

    return NextResponse.json({
      success: true,
      organization: newOrg,
      created: true,
    });
  } catch (error) {
    console.error('Error ensuring organization:', error);
    return NextResponse.json(
      {
        error: 'Failed to ensure organization',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

