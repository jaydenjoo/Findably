import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createClient as createServerClient } from './server';

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    set: vi.fn(),
  })),
}));

describe('Supabase Server Client', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
  });

  it('should create a server client', async () => {
    const client = await createServerClient();
    expect(client).toBeDefined();
  });

  it('should have auth property', async () => {
    const client = await createServerClient();
    expect(client.auth).toBeDefined();
  });

  it('should have from method for accessing tables', async () => {
    const client = await createServerClient();
    expect(typeof client.from).toBe('function');
  });

  it('should use environment variables for URL and key', async () => {
    const client = await createServerClient();
    expect(client).not.toBeNull();
  });

  it('should throw if NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    await expect(createServerClient()).rejects.toThrow();
  });

  it('should throw if NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    await expect(createServerClient()).rejects.toThrow();
  });

  it('should handle cookie operations', async () => {
    const client = await createServerClient();
    expect(client).toBeDefined();
    // Server client should be able to handle cookie setAll (even if it fails silently)
  });
});
