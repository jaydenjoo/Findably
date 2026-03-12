import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Auth callback route handler
 * Exchanges authorization code for session after OAuth or email verification
 *
 * This route is called by Supabase Auth when:
 * - User completes OAuth flow
 * - User clicks email verification link
 */
/**
 * Validate that the next parameter is a safe relative path.
 * Only allows paths starting with / and no absolute URLs or protocol-based redirects.
 */
function isSafeRedirectPath(path: string): boolean {
  if (!path) return false;

  // Must start with /
  if (!path.startsWith('/')) return false;

  // Reject absolute URLs with protocol (http://, https://, //)
  if (path.includes('://') || path.startsWith('//')) return false;

  // Additional safety: reject paths with dangerous patterns
  // This prevents encoding bypasses like %2F%2F or javascript: URIs
  try {
    const decoded = decodeURIComponent(path);
    if (decoded.includes('://') || decoded.startsWith('//')) return false;
  } catch {
    return false;
  }

  return true;
}

/**
 * List of allowed redirect paths. Use this to restrict redirects to known safe routes.
 * Expand this list as you add more authenticated pages.
 */
const ALLOWED_REDIRECT_PATHS = ['/onboarding', '/dashboard'];

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next') ?? '/onboarding';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Validate the next parameter to prevent open redirect
      let safeNext = '/onboarding';

      if (isSafeRedirectPath(nextParam)) {
        // Additional check: ensure path is in whitelist or matches pattern
        // For now, allow any safe relative path. Tighten this if needed.
        safeNext = nextParam;
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${safeNext}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${safeNext}`);
      } else {
        return NextResponse.redirect(`${origin}${safeNext}`);
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
