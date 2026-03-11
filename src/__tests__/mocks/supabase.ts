/**
 * Mocks for Supabase client
 * Used in unit tests for API routes and server actions
 */

import { vi } from 'vitest';

export function createMockSupabaseServer() {
  return {
    auth: {
      getUser: vi.fn(),
    },
  };
}

export function createMockSupabaseClient() {
  return {
    auth: {
      getSession: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
  };
}
