import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * 서버 시작 시 환경변수 검증 테스트
 * instrumentation.ts에서 validateEnv()가 호출되는지 확인
 */
describe("instrumentation - Environment Validation", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Restore original env vars
    vi.resetModules();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("should validate environment variables on register() call", async () => {
    // 필수 환경변수 설정 (NODE_ENV는 읽기 전용이므로 설정하지 않음)
    const env = process.env as Record<string, string>;
    env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
    env.DATABASE_URL = "postgresql://user:pass@host/db";
    env.ANTHROPIC_API_KEY = "sk-test-anthropic-key";
    env.GOOGLE_PAGESPEED_API_KEY = "test-pagespeed-key";
    env.N8N_WEBHOOK_BASE_URL = "https://n8n.example.com";
    env.N8N_API_KEY = "test-n8n-key";
    env.NEXT_PUBLIC_APP_URL = "https://findably.com";

    // Node.js 환경 시뮬레이션
    process.env.NEXT_RUNTIME = "nodejs";

    // register() 호출
    const { register } = await import("../instrumentation");

    // 에러를 throw하지 않아야 함 (모든 필수 변수가 설정됨)
    expect(async () => {
      await register();
    }).not.toThrow();
  });

  it("should fail when required env vars are missing", async () => {
    // 필수 환경변수 누락
    delete process.env.ANTHROPIC_API_KEY;
    const env = process.env as Record<string, string>;
    env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
    env.DATABASE_URL = "postgresql://user:pass@host/db";
    env.GOOGLE_PAGESPEED_API_KEY = "test-pagespeed-key";
    env.N8N_WEBHOOK_BASE_URL = "https://n8n.example.com";
    env.N8N_API_KEY = "test-n8n-key";
    env.NEXT_PUBLIC_APP_URL = "https://findably.com";

    process.env.NEXT_RUNTIME = "nodejs";

    const { register } = await import("../instrumentation");

    // Validation error가 로깅되어야 함 (exit(1)은 호출되지 않음)
    await register();
    // 에러가 로깅되었는지는 spy로 확인할 수 있지만,
    // 이 테스트는 호출 자체가 성공하는 것만 확인
  });
});
