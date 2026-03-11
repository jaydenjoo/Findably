import * as Sentry from '@sentry/nextjs';

/**
 * 브라우저 또는 서버 환경에서 Sentry가 초기화되었는지 확인합니다.
 * SENTRY_DSN 또는 NEXT_PUBLIC_SENTRY_DSN 환경변수 중 하나라도 설정되어 있으면 true를 반환합니다.
 */
export function isSentryInitialized(): boolean {
  const sentryDsn =
    process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  return Boolean(sentryDsn);
}

/**
 * Sentry 브레드크럼(breadcrumb)을 추가합니다.
 * 사용자의 주요 액션(온보딩 제출, 진단 시작 등)을 추적합니다.
 *
 * @param category - 브레드크럼 카테고리 (onboarding, diagnosis, crawl, generation, re-diagnosis)
 * @param message - 브레드크럼 메시지
 * @param data - 추가 데이터 (선택사항)
 *
 * @example
 * addBreadcrumb('onboarding', 'User submitted form', { url: 'https://example.com' })
 */
export function addBreadcrumb(
  category: 'onboarding' | 'diagnosis' | 'crawl' | 'generation' | 're-diagnosis',
  message: string,
  data?: Record<string, unknown>
): void {
  if (!isSentryInitialized()) {
    return; // Sentry가 초기화되지 않았으면 무시합니다
  }

  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: 'info',
  });
}

/**
 * Sentry에 에러를 캡처합니다.
 * 프론트엔드와 백엔드 에러를 모두 추적합니다.
 *
 * @param error - 캡처할 에러 (Error 객체 또는 문자열)
 * @param context - 에러 컨텍스트 (선택사항)
 * @param level - 로그 레벨 (error, warning, info 등) - 기본값: 'error'
 *
 * @example
 * try {
 *   await someAsyncOperation();
 * } catch (error) {
 *   captureError(error, { userId: '123', action: 'onboarding' });
 * }
 */
export function captureError(
  error: unknown,
  context?: Record<string, unknown>,
  level: 'error' | 'warning' | 'info' = 'error'
): void {
  if (!isSentryInitialized()) {
    return; // Sentry가 초기화되지 않았으면 무시합니다
  }

  Sentry.captureException(error, {
    level,
    contexts: {
      custom: context,
    },
  });
}

/**
 * Sentry에 현재 사용자를 설정합니다.
 * 에러 발생 시 어떤 사용자가 영향을 받았는지 추적합니다.
 *
 * @param userId - 사용자 ID (null이면 사용자 정보를 제거)
 * @param extra - 추가 정보 (email, companyId 등)
 *
 * @example
 * setUserContext('user-123', { email: 'user@example.com', companyId: 'company-456' });
 * // 로그아웃 시
 * setUserContext(null);
 */
export function setUserContext(
  userId: string | null,
  extra?: Record<string, string>
): void {
  if (!isSentryInitialized()) {
    return; // Sentry가 초기화되지 않았으면 무시합니다
  }

  if (userId === null) {
    Sentry.setUser(null);
    return;
  }

  const userContext: Record<string, unknown> = {
    id: userId,
  };

  // email을 별도로 처리
  if (extra?.email) {
    userContext.email = extra.email;
  }

  // 나머지 필드들을 custom 객체로
  const customData: Record<string, string> = {};
  for (const [key, value] of Object.entries(extra || {})) {
    if (key !== 'email') {
      customData[key] = value;
    }
  }

  if (Object.keys(customData).length > 0) {
    userContext.custom = customData;
  }

  Sentry.setUser(userContext as Parameters<typeof Sentry.setUser>[0]);
}
