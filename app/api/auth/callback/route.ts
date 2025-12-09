import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  // Support both 'next' and 'redirect' parameters for compatibility
  const redirect = requestUrl.searchParams.get('next') || requestUrl.searchParams.get('redirect') || '/dashboard';
  const type = requestUrl.searchParams.get('type');

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Handle password recovery
  if (type === 'recovery') {
    return NextResponse.redirect(new URL('/settings?tab=password', requestUrl.origin));
  }

  return NextResponse.redirect(new URL(redirect, requestUrl.origin));
}


