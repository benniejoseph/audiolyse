import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/utils/supabaseAdmin';
import { getUserAndOrg } from '@/app/utils/supabaseServer';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ ok: true });
  const { action, call_analysis_id, metadata } = await req.json();
  const { organization_id, user_id } = await getUserAndOrg();
  if (organization_id && user_id) {
    await supabaseAdmin.from('usage_logs').insert({
      organization_id,
      user_id,
      action: action || 'api_call',
      call_analysis_id: call_analysis_id || null,
      metadata: metadata || {},
    });
  }
  return NextResponse.json({ ok: true });
}
