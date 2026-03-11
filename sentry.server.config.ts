import * as Sentry from '@sentry/nextjs';

/**
 * 서버 사이드 Sentry 설정입니다.
 * 서버에서 발생하는 에러와 API 라우트 에러를 감지하고 추적합니다.
 */
export function initializeSentryServer(): void {
  const sentryDsn = process.env.SENTRY_DSN;

  if (!sentryDsn) {
    return; // Sentry DSN이 설정되지 않았으면 초기화하지 않습니다
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // 서버에서 자동으로 모든 요청을 감시합니다
    integrations: [
      Sentry.httpIntegration(),
      Sentry.onUncaughtExceptionIntegration(),
      Sentry.onUnhandledRejectionIntegration(),
    ],
  });
}

// 즉시 초기화
initializeSentryServer();
