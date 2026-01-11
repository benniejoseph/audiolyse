import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  // During build time, these might be empty - return a dummy client that won't be used
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a placeholder during SSR/build - actual client will be created client-side
    if (typeof window === 'undefined') {
      return createBrowserClient('https://placeholder.supabase.co', 'placeholder-key');
    }
    throw new Error('Supabase URL and Anon Key are required. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}


