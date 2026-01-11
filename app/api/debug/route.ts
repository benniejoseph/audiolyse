import { NextResponse } from 'next/server';

/**
 * Debug endpoint to check environment configuration
 */
export async function GET() {
  const config = {
    timestamp: new Date().toISOString(),
    env: {
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      SERVICE_KEY_PREFIX: process.env.SUPABASE_SERVICE_ROLE_KEY 
        ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + '...' 
        : 'NOT SET',
    },
  };

  return NextResponse.json(config);
}

