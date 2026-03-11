import { describe, it, expect } from 'vitest';
import { SignUpSchema, LoginSchema } from '../auth';

describe('SignUpSchema', () => {
  it('should validate a correct email and password combination', () => {
    const validInput = {
      email: 'user@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      termsAccepted: true,
    };

    const result = SignUpSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });

  it('should reject invalid email', () => {
    const invalidInput = {
      email: 'not-an-email',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      termsAccepted: true,
    };

    const result = SignUpSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject password without uppercase letter', () => {
    const invalidInput = {
      email: 'user@example.com',
      password: 'securepass123!',
      confirmPassword: 'securepass123!',
      termsAccepted: true,
    };

    const result = SignUpSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject password without lowercase letter', () => {
    const invalidInput = {
      email: 'user@example.com',
      password: 'SECUREPASS123!',
      confirmPassword: 'SECUREPASS123!',
      termsAccepted: true,
    };

    const result = SignUpSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject password without number', () => {
    const invalidInput = {
      email: 'user@example.com',
      password: 'SecurePass!abc',
      confirmPassword: 'SecurePass!abc',
      termsAccepted: true,
    };

    const result = SignUpSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject password without special character', () => {
    const invalidInput = {
      email: 'user@example.com',
      password: 'SecurePass123abc',
      confirmPassword: 'SecurePass123abc',
      termsAccepted: true,
    };

    const result = SignUpSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject password shorter than 8 characters', () => {
    const invalidInput = {
      email: 'user@example.com',
      password: 'Pass1!x',
      confirmPassword: 'Pass1!x',
      termsAccepted: true,
    };

    const result = SignUpSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject mismatched confirm password', () => {
    const invalidInput = {
      email: 'user@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'DifferentPass123!',
      termsAccepted: true,
    };

    const result = SignUpSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject when terms not accepted', () => {
    const invalidInput = {
      email: 'user@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      termsAccepted: false,
    };

    const result = SignUpSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should accept password with 8+ characters and all requirements', () => {
    const validInputs = [
      {
        email: 'user1@example.com',
        password: 'Pass1@word',
        confirmPassword: 'Pass1@word',
        termsAccepted: true,
      },
      {
        email: 'user2@example.com',
        password: 'MySecure#Pass123',
        confirmPassword: 'MySecure#Pass123',
        termsAccepted: true,
      },
      {
        email: 'user3@example.com',
        password: 'Test$123ABC',
        confirmPassword: 'Test$123ABC',
        termsAccepted: true,
      },
    ];

    validInputs.forEach((input) => {
      const result = SignUpSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  it('should trim email whitespace', () => {
    const input = {
      email: '  user@example.com  ',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      termsAccepted: true,
    };

    const result = SignUpSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });

  it('should convert email to lowercase', () => {
    const input = {
      email: 'User@EXAMPLE.COM',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      termsAccepted: true,
    };

    const result = SignUpSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });
});

describe('LoginSchema', () => {
  it('should validate correct email and password', () => {
    const validInput = {
      email: 'user@example.com',
      password: 'SecurePass123!',
    };

    const result = LoginSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const invalidInput = {
      email: 'not-an-email',
      password: 'SecurePass123!',
    };

    const result = LoginSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject missing password', () => {
    const invalidInput = {
      email: 'user@example.com',
      password: '',
    };

    const result = LoginSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should trim email whitespace', () => {
    const input = {
      email: '  user@example.com  ',
      password: 'SecurePass123!',
    };

    const result = LoginSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });

  it('should convert email to lowercase', () => {
    const input = {
      email: 'User@EXAMPLE.COM',
      password: 'SecurePass123!',
    };

    const result = LoginSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });
});
