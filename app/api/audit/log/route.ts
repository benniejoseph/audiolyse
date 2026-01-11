import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { resource_type, resource_id, action, organization_id, metadata } = body;

    if (!resource_type || !action || !organization_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert into data_access_logs
    // We use a direct insert. The RLS policy "Users can insert audit logs" should allow this 
    // if the user is a member of the organization.
    
    // Get IP and User Agent
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    const { error } = await supabase
      .from('data_access_logs')
      .insert({
        user_id: user.id,
        organization_id,
        resource_type,
        resource_id,
        action,
        metadata: {
          ...metadata,
          ip_address: ip,
          user_agent: userAgent
        }
      });

    if (error) {
      console.error('Audit log insert failed:', error);
      // We don't fail the request significantly if audit logging fails, 
      // but in strict mode we might want to. For now, just log error.
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
