/**
 * Next.js 15 Instrumentation Hook
 * 애플리케이션 시작 시 환경변수 검증과 Sentry를 초기화합니다.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register(): Promise<void> {
  // 애플리케이션 시작 시 환경변수 검증 (fail-fast)
  // 필수 환경변수가 없으면 애플리케이션이 시작되지 않음
  const { validateEnv } = await import("./lib/env");
  try {
    validateEnv();
  } catch (error) {
    console.error("❌ 환경변수 검증 실패:", error);
    // 프로덕션 환경에서는 애플리케이션 시작 중단 (Node.js 런타임에서만)
    if (process.env.NODE_ENV === "production" && process.env.NEXT_RUNTIME === "nodejs") {
      process.exit(1);
    }
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    // 서버 환경에서만 실행됩니다
    const { initializeSentryServer } = await import("../sentry.server.config");
    initializeSentryServer();
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    // Edge Runtime 환경에서만 실행됩니다
    const { initializeSentryEdge } = await import("../sentry.edge.config");
    initializeSentryEdge();
  }
}
