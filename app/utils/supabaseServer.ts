import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { supabaseAdmin } from './supabaseAdmin';

export async function getUserAndOrg() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data } = await supabase.auth.getUser();
  const user = data?.user || null;

  if (!supabaseAdmin) return { user_id: null, organization_id: null, user_email: null };

  if (user?.id) {
    // Try org membership
    const { data: member } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (member?.organization_id) {
      return { user_id: user.id, organization_id: member.organization_id, user_email: user.email || null };
    }

    // Try org owner
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (org?.id) return { user_id: user.id, organization_id: org.id, user_email: user.email || null };
  }

  // Fallback: first org
  const { data: orgs } = await supabaseAdmin
    .from('organizations')
    .select('id, owner_id')
    .order('created_at', { ascending: true })
    .limit(1);
  const org = orgs?.[0];
  return { user_id: org?.owner_id || null, organization_id: org?.id || null, user_email: null };
}
