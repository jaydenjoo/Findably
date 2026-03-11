import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signUpAction } from '../auth';

// Mock the Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

describe('signUpAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return error for invalid email', async () => {
    const result = await signUpAction({
      email: 'not-an-email',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      termsAccepted: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return error for weak password', async () => {
    const result = await signUpAction({
      email: 'user@example.com',
      password: 'weak',
      confirmPassword: 'weak',
      termsAccepted: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return error for mismatched passwords', async () => {
    const result = await signUpAction({
      email: 'user@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'DifferentPass123!',
      termsAccepted: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return error when terms not accepted', async () => {
    const result = await signUpAction({
      email: 'user@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      termsAccepted: false,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return validation errors for multiple invalid fields', async () => {
    const result = await signUpAction({
      email: 'not-an-email',
      password: 'weak',
      confirmPassword: 'weak',
      termsAccepted: false,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
