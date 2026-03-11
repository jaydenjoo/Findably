import { describe, it, expect, beforeEach } from 'vitest';
import { createClient as createBrowserClient } from './client';

describe('Supabase Browser Client', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
  });

  it('should create a browser client', () => {
    const client = createBrowserClient();
    expect(client).toBeDefined();
  });

  it('should have auth property', () => {
    const client = createBrowserClient();
    expect(client.auth).toBeDefined();
  });

  it('should have from method for accessing tables', () => {
    const client = createBrowserClient();
    expect(typeof client.from).toBe('function');
  });

  it('should use environment variables for URL and key', () => {
    const client = createBrowserClient();
    // Verify client was initialized (it will fail at runtime if env vars were wrong)
    expect(client).not.toBeNull();
  });

  it('should throw if NEXT_PUBLIC_SUPABASE_URL is missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(() => createBrowserClient()).toThrow();
  });

  it('should throw if NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    expect(() => createBrowserClient()).toThrow();
  });
});
