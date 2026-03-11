import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../service';
import type { AuthUser } from '@/types/auth';

/**
 * Helper to create a mock Supabase client
 */
function createMockSupabaseClient() {
  return {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
    getSession: vi.fn(),
  };
}

describe('AuthService', () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;
  let authService: AuthService;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    authService = new AuthService(mockClient as unknown as ConstructorParameters<typeof AuthService>[0]);
  });

  describe('signUp', () => {
    it('should successfully sign up a user with email and password', async () => {
      const email = 'test@example.com';
      const password = 'SecurePassword123!';
      const mockUser: AuthUser = {
        id: 'user-123',
        email,
        created_at: new Date().toISOString(),
      };

      mockClient.signUp.mockResolvedValueOnce({
        data: { user: mockUser, session: null },
        error: null,
      });

      const result = await authService.signUp(email, password);

      expect(result.success).toBe(true);
      expect(result.user?.email).toBe(email);
      expect(mockClient.signUp).toHaveBeenCalledWith({
        email,
        password,
      });
    });

    it('should return error when sign up fails with duplicate email', async () => {
      const email = 'existing@example.com';
      const password = 'SecurePassword123!';

      mockClient.signUp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'User already exists' },
      });

      const result = await authService.signUp(email, password);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.user).toBeUndefined();
    });

    it('should handle network errors gracefully', async () => {
      const email = 'test@example.com';
      const password = 'SecurePassword123!';

      mockClient.signUp.mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await authService.signUp(email, password);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Sign up failed');
    });
  });

  describe('signIn', () => {
    it('should successfully sign in with email and password', async () => {
      const email = 'test@example.com';
      const password = 'SecurePassword123!';
      const mockUser: AuthUser = {
        id: 'user-123',
        email,
        created_at: new Date().toISOString(),
      };

      mockClient.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: mockUser,
          session: {
            access_token: 'token-abc',
            refresh_token: 'refresh-xyz',
            expires_in: 3600,
            token_type: 'bearer',
            user: mockUser,
          },
        },
        error: null,
      });

      const result = await authService.signIn(email, password);

      expect(result.success).toBe(true);
      expect(result.user?.email).toBe(email);
      expect(result.session?.access_token).toBe('token-abc');
      expect(mockClient.signInWithPassword).toHaveBeenCalledWith({
        email,
        password,
      });
    });

    it('should return error for invalid credentials', async () => {
      const email = 'test@example.com';
      const password = 'WrongPassword123!';

      mockClient.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const result = await authService.signIn(email, password);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.user).toBeUndefined();
    });

    it('should handle unconfirmed email error', async () => {
      const email = 'unconfirmed@example.com';
      const password = 'SecurePassword123!';

      mockClient.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Email not confirmed' },
      });

      const result = await authService.signIn(email, password);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Email not confirmed');
    });
  });

  describe('signInWithOAuth', () => {
    it('should return OAuth redirect URL for Google', async () => {
      const mockUrl = 'https://accounts.google.com/o/oauth2/v2/auth?...';

      mockClient.signInWithOAuth.mockResolvedValueOnce({
        data: { url: mockUrl },
        error: null,
      });

      const result = await authService.signInWithOAuth('google');

      expect(result.success).toBe(true);
      expect(result.url).toBe(mockUrl);
      expect(mockClient.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining('/auth/callback'),
        },
      });
    });

    it('should return error when OAuth provider is not supported', async () => {
      mockClient.signInWithOAuth.mockResolvedValueOnce({
        data: { url: null },
        error: { message: 'Provider not supported' },
      });

      const result = await authService.signInWithOAuth('unsupported' as 'google' | 'github');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle OAuth configuration errors', async () => {
      mockClient.signInWithOAuth.mockRejectedValueOnce(
        new Error('OAuth configuration error')
      );

      const result = await authService.signInWithOAuth('google');

      expect(result.success).toBe(false);
      expect(result.error).toContain('OAuth sign in failed');
    });
  });

  describe('signOut', () => {
    it('should successfully sign out the user', async () => {
      mockClient.signOut.mockResolvedValueOnce({
        error: null,
      });

      const result = await authService.signOut();

      expect(result.success).toBe(true);
      expect(mockClient.signOut).toHaveBeenCalled();
    });

    it('should handle sign out errors gracefully', async () => {
      mockClient.signOut.mockResolvedValueOnce({
        error: { message: 'Sign out failed' },
      });

      const result = await authService.signOut();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle network errors during sign out', async () => {
      mockClient.signOut.mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await authService.signOut();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Sign out failed');
    });
  });

  describe('getCurrentUser', () => {
    it('should return the current authenticated user', async () => {
      const mockUser: AuthUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
      };

      mockClient.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      const result = await authService.getCurrentUser();

      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe('test@example.com');
      expect(result.error).toBeUndefined();
    });

    it('should return null user when not authenticated', async () => {
      mockClient.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const result = await authService.getCurrentUser();

      expect(result.user).toBeNull();
      expect(result.error).toBeUndefined();
    });

    it('should handle token expiration errors', async () => {
      mockClient.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Token expired' },
      });

      const result = await authService.getCurrentUser();

      expect(result.user).toBeNull();
      expect(result.error).toBeDefined();
    });

    it('should handle network errors', async () => {
      mockClient.getUser.mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await authService.getCurrentUser();

      expect(result.user).toBeNull();
      expect(result.error).toContain('Failed to get current user');
    });
  });

  describe('getSession', () => {
    it('should return the current session', async () => {
      const mockUser: AuthUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
      };

      mockClient.getSession.mockResolvedValueOnce({
        data: {
          session: {
            access_token: 'token-abc',
            refresh_token: 'refresh-xyz',
            expires_in: 3600,
            token_type: 'bearer',
            user: mockUser,
          },
        },
        error: null,
      });

      const result = await authService.getSession();

      expect(result.session).toBeDefined();
      expect(result.session?.access_token).toBe('token-abc');
      expect(result.session?.user?.email).toBe('test@example.com');
      expect(result.error).toBeUndefined();
    });

    it('should return null session when not authenticated', async () => {
      mockClient.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      const result = await authService.getSession();

      expect(result.session).toBeNull();
      expect(result.error).toBeUndefined();
    });

    it('should handle session retrieval errors', async () => {
      mockClient.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: { message: 'Session error' },
      });

      const result = await authService.getSession();

      expect(result.session).toBeNull();
      expect(result.error).toBeDefined();
    });

    it('should handle network errors', async () => {
      mockClient.getSession.mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await authService.getSession();

      expect(result.session).toBeNull();
      expect(result.error).toContain('Failed to get session');
    });
  });

  describe('type safety and edge cases', () => {
    it('should handle Supabase client errors with message property', async () => {
      mockClient.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Some error message' },
      });

      const result = await authService.signUp('test@example.com', 'Pass123!');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Some error message');
    });

    it('should handle Supabase client errors without message property', async () => {
      mockClient.signUp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: {} as { message?: string },
      });

      const result = await authService.signUp('test@example.com', 'Pass123!');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle empty exception errors', async () => {
      mockClient.signUp.mockRejectedValueOnce(new Error());

      const result = await authService.signUp('test@example.com', 'Pass123!');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Sign up failed');
    });

    it('should preserve user metadata in auth results', async () => {
      const mockUser: AuthUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { name: 'John Doe' },
        created_at: new Date().toISOString(),
      };

      mockClient.signUp.mockResolvedValueOnce({
        data: { user: mockUser, session: null },
        error: null,
      });

      const result = await authService.signUp('test@example.com', 'Pass123!');

      expect(result.user?.user_metadata).toEqual({ name: 'John Doe' });
    });
  });
});
