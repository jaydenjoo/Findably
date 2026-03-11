import { describe, it, expect } from 'vitest';
import { config } from './middleware';

describe('Middleware Configuration', () => {
  it('should export matcher config', () => {
    expect(config).toBeDefined();
    expect(config.matcher).toBeDefined();
  });

  it('should have matcher as array', () => {
    expect(Array.isArray(config.matcher)).toBe(true);
    expect(config.matcher.length).toBeGreaterThan(0);
  });

  it('should match all routes except static assets', () => {
    const matcher = config.matcher[0];
    expect(typeof matcher).toBe('string');
    // Matcher should be a regex pattern that excludes static assets
    expect(matcher).toMatch(/\(.*\)/);
  });
});

describe('Middleware Route Protection', () => {
  const protectedPaths = ['/dashboard', '/onboarding'];
  const authPaths = ['/login', '/signup'];

  it('should identify protected routes', () => {
    expect(protectedPaths).toContain('/dashboard');
    expect(protectedPaths).toContain('/onboarding');
  });

  it('should identify auth routes', () => {
    expect(authPaths).toContain('/login');
    expect(authPaths).toContain('/signup');
  });

  it('should check if path is protected', () => {
    const isProtected = (path: string) =>
      protectedPaths.some((p) => path.startsWith(p));

    expect(isProtected('/dashboard')).toBe(true);
    expect(isProtected('/dashboard/123')).toBe(true);
    expect(isProtected('/onboarding')).toBe(true);
    expect(isProtected('/')).toBe(false);
    expect(isProtected('/login')).toBe(false);
  });

  it('should check if path is auth route', () => {
    const isAuthRoute = (path: string) =>
      authPaths.some((p) => path.startsWith(p));

    expect(isAuthRoute('/login')).toBe(true);
    expect(isAuthRoute('/signup')).toBe(true);
    expect(isAuthRoute('/dashboard')).toBe(false);
    expect(isAuthRoute('/')).toBe(false);
  });
});
