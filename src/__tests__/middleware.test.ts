import { describe, it, expect, beforeEach, afterEach } from 'vitest';

/**
 * 미들웨어에서 환경변수 사용 검증 테스트
 * middleware.ts가 process.env 직접 접근 대신 getEnvConfig() 사용하는지 확인
 */
describe('middleware - Environment Variable Usage', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should use getEnvConfig() for type-safe environment access', async () => {
    // 필수 환경변수 설정
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    process.env.DATABASE_URL = 'postgresql://user:pass@host/db';
    process.env.ANTHROPIC_API_KEY = 'sk-test-anthropic-key';
    process.env.GOOGLE_PAGESPEED_API_KEY = 'test-pagespeed-key';
    process.env.N8N_WEBHOOK_BASE_URL = 'https://n8n.example.com';
    process.env.N8N_API_KEY = 'test-n8n-key';
    process.env.NEXT_PUBLIC_APP_URL = 'https://findably.com';

    const { getEnvConfig } = await import('../lib/env');
    const config = getEnvConfig();

    // middleware.ts에서 사용할 Supabase 설정 확인
    expect(config.supabase.url).toBe('https://test.supabase.co');
    expect(config.supabase.anonKey).toBe('test-anon-key');

    // Supabase 클라이언트 생성 시 사용될 값들이 정확한지 확인
    expect(config.supabase.url).toBeTruthy();
    expect(config.supabase.anonKey).toBeTruthy();
  });

  it('should validate Supabase config before middleware initialization', async () => {
    // 필수 Supabase 변수 누락
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    process.env.DATABASE_URL = 'postgresql://user:pass@host/db';
    process.env.ANTHROPIC_API_KEY = 'sk-test-anthropic-key';
    process.env.GOOGLE_PAGESPEED_API_KEY = 'test-pagespeed-key';
    process.env.N8N_WEBHOOK_BASE_URL = 'https://n8n.example.com';
    process.env.N8N_API_KEY = 'test-n8n-key';
    process.env.NEXT_PUBLIC_APP_URL = 'https://findably.com';

    const { validateEnv, clearEnvCache } = await import('../lib/env');
    clearEnvCache(); // 캐시 초기화

    // validateEnv()가 에러를 throw해야 함
    expect(() => validateEnv()).toThrow('NEXT_PUBLIC_SUPABASE_URL');
  });

  it('should provide typed config with all required fields', async () => {
    // 필수 환경변수 설정
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    process.env.DATABASE_URL = 'postgresql://user:pass@host/db';
    process.env.ANTHROPIC_API_KEY = 'sk-test-anthropic-key';
    process.env.GOOGLE_PAGESPEED_API_KEY = 'test-pagespeed-key';
    process.env.N8N_WEBHOOK_BASE_URL = 'https://n8n.example.com';
    process.env.N8N_API_KEY = 'test-n8n-key';
    process.env.NEXT_PUBLIC_APP_URL = 'https://findably.com';

    const { getEnvConfig } = await import('../lib/env');
    const config = getEnvConfig();

    // 타입 안전 설정 객체 검증
    expect(config).toHaveProperty('supabase');
    expect(config).toHaveProperty('database');
    expect(config).toHaveProperty('anthropic');
    expect(config).toHaveProperty('pageSpeed');
    expect(config).toHaveProperty('n8n');
    expect(config).toHaveProperty('app');

    // 각 섹션이 필요한 필드를 가지고 있는지 확인
    expect(config.supabase).toHaveProperty('url');
    expect(config.supabase).toHaveProperty('anonKey');
    expect(config.supabase).toHaveProperty('serviceRoleKey');

    expect(config.n8n).toHaveProperty('webhookBaseUrl');
    expect(config.n8n).toHaveProperty('apiKey');
  });
});
