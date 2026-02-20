import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
  : null;

export async function getDefaultOrgAndUser() {
  if (!supabaseAdmin) return { organization_id: null, user_id: null };
  const { data: orgs } = await supabaseAdmin
    .from('organizations')
    .select('id, owner_id')
    .order('created_at', { ascending: true })
    .limit(1);
  const org = orgs?.[0];
  return { organization_id: org?.id || null, user_id: org?.owner_id || null };
}
