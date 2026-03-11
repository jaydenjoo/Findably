/**
 * Authentication-related type definitions
 * These types are used throughout the auth service and related UI components
 */

/**
 * Represents an authenticated user
 */
export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
  email_confirmed_at?: string;
  created_at: string;
}

/**
 * Represents an active user session
 */
export interface AuthSession {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: AuthUser;
}

/**
 * Result of a sign-up operation
 */
export interface SignUpResult {
  success: boolean;
  user?: AuthUser;
  session?: AuthSession;
  error?: string;
}

/**
 * Result of a sign-in operation
 */
export interface SignInResult {
  success: boolean;
  user?: AuthUser;
  session?: AuthSession;
  error?: string;
}

/**
 * Result of a sign-in with OAuth operation
 */
export interface SignInWithOAuthResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Result of a sign-out operation
 */
export interface SignOutResult {
  success: boolean;
  error?: string;
}

/**
 * Result of getting current user
 */
export interface GetCurrentUserResult {
  user: AuthUser | null;
  error?: string;
}

/**
 * Result of getting current session
 */
export interface GetSessionResult {
  session: AuthSession | null;
  error?: string;
}
