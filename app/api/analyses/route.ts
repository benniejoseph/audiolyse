import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/utils/supabaseAdmin';
import { getUserAndOrg } from '@/app/utils/supabaseServer';

export const runtime = 'nodejs';

export async function GET() {
  if (!supabaseAdmin) return NextResponse.json({ data: [] });
  const { organization_id } = await getUserAndOrg();
  if (!organization_id) return NextResponse.json({ data: [] });

  const { data } = await supabaseAdmin
    .from('call_analyses')
    .select('id, file_name, file_size_bytes, status, analysis_json, audio_url, created_at')
    .eq('organization_id', organization_id)
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({ data: data || [] });
}
