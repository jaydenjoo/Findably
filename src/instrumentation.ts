/**
 * Next.js 15 Instrumentation Hook
 * 애플리케이션 시작 시 Sentry를 초기화합니다.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // 서버 환경에서만 실행됩니다
    const { initializeSentryServer } = await import('../sentry.server.config');
    initializeSentryServer();
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge Runtime 환경에서만 실행됩니다
    const { initializeSentryEdge } = await import('../sentry.edge.config');
    initializeSentryEdge();
  }
}
