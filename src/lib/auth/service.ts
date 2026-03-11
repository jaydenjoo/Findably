import type {
  SignUpResult,
  SignInResult,
  SignInWithOAuthResult,
  SignOutResult,
  GetCurrentUserResult,
  GetSessionResult,
} from '@/types/auth';

/**
 * Type definition for Supabase-like client response
 * Allows flexible user and session objects with optional properties
 */
interface SupabaseUser {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
  email_confirmed_at?: string;
  created_at: string;
}

interface SupabaseSession {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  user: SupabaseUser;
}

/**
 * Type definition for Supabase-like client
 * Abstracts Supabase Auth API for dependency injection in tests
 */
interface SupabaseAuthClient {
  signUp(options: {
    email: string;
    password: string;
  }): Promise<{
    data: { user: SupabaseUser; session: SupabaseSession };
    error: { message: string } | null;
  }>;

  signInWithPassword(options: {
    email: string;
    password: string;
  }): Promise<{
    data: { user: SupabaseUser; session: SupabaseSession };
    error: { message: string } | null;
  }>;

  signInWithOAuth(options: {
    provider: 'google' | 'github';
    options?: { redirectTo?: string };
  }): Promise<{
    data: { url: string | null };
    error: { message: string } | null;
  }>;

  signOut(): Promise<{
    error: { message: string } | null;
  }>;

  getUser(): Promise<{
    data: { user: SupabaseUser };
    error: { message: string } | null;
  }>;

  getSession(): Promise<{
    data: { session: SupabaseSession };
    error: { message: string } | null;
  }>;
}

/**
 * AuthService
 * Provides a clean abstraction over Supabase authentication
 * Implements hexagonal architecture: service is a port, Supabase is an adapter
 *
 * All methods return result objects with success flag and error handling
 * to enable type-safe, predictable error handling in consumers
 */
export class AuthService {
  private client: SupabaseAuthClient;

  constructor(client: SupabaseAuthClient) {
    this.client = client;
  }

  /**
   * Sign up a new user with email and password
   * @param email - User's email address
   * @param password - User's password
   * @returns SignUpResult with success flag and optional user/error
   */
  async signUp(email: string, password: string): Promise<SignUpResult> {
    try {
      const { data, error } = await this.client.signUp({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Sign up failed: Unknown error',
        };
      }

      if (!data?.user) {
        return {
          success: false,
          error: 'Sign up failed: no user returned from Supabase',
        };
      }

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata,
          email_confirmed_at: data.user.email_confirmed_at,
          created_at: data.user.created_at,
        },
        session: data.session
          ? {
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              expires_in: data.session.expires_in,
              token_type: data.session.token_type,
              user: {
                id: data.session.user.id,
                email: data.session.user.email,
                user_metadata: data.session.user.user_metadata,
                email_confirmed_at:
                  data.session.user.email_confirmed_at,
                created_at: data.session.user.created_at,
              },
            }
          : undefined,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Sign up failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Sign in with email and password
   * @param email - User's email address
   * @param password - User's password
   * @returns SignInResult with success flag and optional user/session/error
   */
  async signIn(email: string, password: string): Promise<SignInResult> {
    try {
      const { data, error } = await this.client.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Sign in failed: Unknown error',
        };
      }

      if (!data?.user) {
        return {
          success: false,
          error: 'Sign in failed: no user returned from Supabase',
        };
      }

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata,
          email_confirmed_at: data.user.email_confirmed_at,
          created_at: data.user.created_at,
        },
        session: data.session
          ? {
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              expires_in: data.session.expires_in,
              token_type: data.session.token_type,
              user: {
                id: data.session.user.id,
                email: data.session.user.email,
                user_metadata: data.session.user.user_metadata,
                email_confirmed_at:
                  data.session.user.email_confirmed_at,
                created_at: data.session.user.created_at,
              },
            }
          : undefined,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Sign in failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Sign in with OAuth provider (e.g., Google)
   * @param provider - OAuth provider name ('google' | 'github')
   * @returns SignInWithOAuthResult with success flag and optional redirect URL/error
   */
  async signInWithOAuth(
    provider: 'google' | 'github'
  ): Promise<SignInWithOAuthResult> {
    try {
      const { data, error } = await this.client.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${
            typeof window !== 'undefined'
              ? window.location.origin
              : 'http://localhost:3000'
          }/auth/callback`,
        },
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'OAuth sign in failed: Unknown error',
        };
      }

      if (!data?.url) {
        return {
          success: false,
          error: 'OAuth sign in failed: no redirect URL returned',
        };
      }

      return {
        success: true,
        url: data.url,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `OAuth sign in failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Sign out the current user
   * @returns SignOutResult with success flag and optional error
   */
  async signOut(): Promise<SignOutResult> {
    try {
      const { error } = await this.client.signOut();

      if (error) {
        return {
          success: false,
          error: error.message || 'Sign out failed: Unknown error',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Sign out failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Get the current authenticated user
   * @returns GetCurrentUserResult with user object or null
   */
  async getCurrentUser(): Promise<GetCurrentUserResult> {
    try {
      const { data, error } = await this.client.getUser();

      if (error) {
        return {
          user: null,
          error: error.message || 'Failed to get current user: Unknown error',
        };
      }

      if (!data?.user) {
        return {
          user: null,
        };
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata,
          email_confirmed_at: data.user.email_confirmed_at,
          created_at: data.user.created_at,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        user: null,
        error: `Failed to get current user: ${errorMessage}`,
      };
    }
  }

  /**
   * Get the current session
   * @returns GetSessionResult with session object or null
   */
  async getSession(): Promise<GetSessionResult> {
    try {
      const { data, error } = await this.client.getSession();

      if (error) {
        return {
          session: null,
          error: error.message || 'Failed to get session: Unknown error',
        };
      }

      if (!data?.session) {
        return {
          session: null,
        };
      }

      return {
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_in: data.session.expires_in,
          token_type: data.session.token_type,
          user: {
            id: data.session.user.id,
            email: data.session.user.email,
            user_metadata: data.session.user.user_metadata,
            email_confirmed_at: data.session.user.email_confirmed_at,
            created_at: data.session.user.created_at,
          },
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        session: null,
        error: `Failed to get session: ${errorMessage}`,
      };
    }
  }
}
