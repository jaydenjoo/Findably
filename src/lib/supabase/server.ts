import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client for use in server-side code (Server Components, Server Actions, Route Handlers)
 * This client automatically handles session refresh via cookies and respects RLS policies
 *
 * @returns Promise<Supabase client instance> for server-side operations
 * @throws Error if required environment variables are not set
 */
export async function createClient() {
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

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}
