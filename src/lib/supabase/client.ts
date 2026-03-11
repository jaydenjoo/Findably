import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for use in browser/client-side code ('use client' components)
 * This client uses the anon key which respects RLS policies
 *
 * @returns Supabase client instance for client-side operations
 * @throws Error if required environment variables are not set
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      'Missing environment variable NEXT_PUBLIC_SUPABASE_URL. Please set it in .env.local'
    );
  }

  if (!key) {
    throw new Error(
      'Missing environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY. Please set it in .env.local'
    );
  }

  return createBrowserClient(url, key);
}
