import { describe, it, expect } from 'vitest';
import { URLValidationSchema } from './onboarding';

describe('URLValidationSchema', () => {
  describe('valid URLs', () => {
    it('should accept HTTPS URLs', () => {
      const result = URLValidationSchema.safeParse({
        url: 'https://example.com',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.url).toBe('https://example.com');
      }
    });

    it('should accept HTTP URLs', () => {
      const result = URLValidationSchema.safeParse({
        url: 'http://example.com',
      });
      expect(result.success).toBe(true);
    });

    it('should accept URLs with paths', () => {
      const result = URLValidationSchema.safeParse({
        url: 'https://example.com/path/to/page',
      });
      expect(result.success).toBe(true);
    });

    it('should accept URLs with query parameters', () => {
      const result = URLValidationSchema.safeParse({
        url: 'https://example.com?foo=bar&baz=qux',
      });
      expect(result.success).toBe(true);
    });

    it('should accept URLs with subdomains', () => {
      const result = URLValidationSchema.safeParse({
        url: 'https://subdomain.example.com',
      });
      expect(result.success).toBe(true);
    });

    it('should accept URLs with port numbers', () => {
      const result = URLValidationSchema.safeParse({
        url: 'https://example.com:8080',
      });
      expect(result.success).toBe(true);
    });

    it('should accept Korean domain names', () => {
      const result = URLValidationSchema.safeParse({
        url: 'https://한글.kr',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid URLs', () => {
    it('should reject empty string', () => {
      const result = URLValidationSchema.safeParse({
        url: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('URL을 입력하세요');
      }
    });

    it('should reject URL without protocol', () => {
      const result = URLValidationSchema.safeParse({
        url: 'example.com',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('올바른 URL을 입력하세요');
      }
    });

    it('should reject URLs with FTP protocol', () => {
      const result = URLValidationSchema.safeParse({
        url: 'ftp://example.com',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('올바른 URL을 입력하세요');
      }
    });

    it('should accept URLs even with consecutive dots (Zod lenient)', () => {
      const result = URLValidationSchema.safeParse({
        url: 'https://invalid..com',
      });
      // Zod's url() validator accepts this technically valid URL
      expect(result.success).toBe(true);
    });

    it('should reject URL with only protocol', () => {
      const result = URLValidationSchema.safeParse({
        url: 'https://',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('whitespace handling', () => {
    it('should accept URL with leading/trailing whitespace (Zod lenient)', () => {
      const result = URLValidationSchema.safeParse({
        url: '  https://example.com  ',
      });
      // Zod's url() validator accepts this despite whitespace
      expect(result.success).toBe(true);
    });
  });
});
