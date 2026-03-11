import * as Sentry from '@sentry/nextjs';

/**
 * 클라이언트 사이드 Sentry 설정입니다.
 * 브라우저에서 발생하는 에러를 감지하고 추적합니다.
 */
export function initializeSentryClient(): void {
  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (!sentryDsn) {
    return; // Sentry DSN이 설정되지 않았으면 초기화하지 않습니다
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // 성능 모니터링 설정
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.feedbackIntegration({
        colorScheme: 'dark',
        showBranding: false,
      }),
    ],

    // 세션 재생 설정 (프로덕션에서는 25%, 개발에서는 100%)
    replaysSessionSampleRate:
      process.env.NODE_ENV === 'production' ? 0.25 : 1.0,
    // 에러 발생 시에만 세션 재생 (프로덕션에서는 100%, 개발에서는 100%)
    replaysOnErrorSampleRate:
      process.env.NODE_ENV === 'production' ? 1.0 : 1.0,
  });
}

// 즉시 초기화
if (typeof window !== 'undefined') {
  initializeSentryClient();
}
