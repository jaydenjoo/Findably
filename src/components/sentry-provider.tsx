'use client';

import { useEffect } from 'react';

/**
 * Sentry 클라이언트 초기화 컴포넌트입니다.
 * Root Layout에서 사용되어 브라우저에서 Sentry를 초기화합니다.
 */
export function SentryProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  useEffect(() => {
    // 클라이언트 사이드 Sentry 초기화
    const initSentry = async (): Promise<void> => {
      try {
        const { initializeSentryClient } = await import(
          '../../sentry.client.config'
        );
        initializeSentryClient();
      } catch (error) {
        // Sentry 초기화 실패는 조용히 무시합니다
        console.debug('Sentry initialization skipped');
      }
    };

    initSentry().catch(() => {
      // 에러 무시
    });
  }, []);

  return children;
}
