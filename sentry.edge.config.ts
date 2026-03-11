import * as Sentry from '@sentry/nextjs';

/**
 * Edge Runtime Sentry 설정입니다.
 * Middleware, API Routes (edge), Next.js Layouts 등에서 발생하는 에러를 추적합니다.
 */
export function initializeSentryEdge(): void {
  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (!sentryDsn) {
    return; // Sentry DSN이 설정되지 않았으면 초기화하지 않습니다
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
}

// 즉시 초기화
initializeSentryEdge();
