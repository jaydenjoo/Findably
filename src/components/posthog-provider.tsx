'use client';

import { useEffect } from 'react';
import { PostHogProvider } from 'posthog-js/react';
import { posthog } from 'posthog-js';

/**
 * PostHog Provider Component
 * 클라이언트 사이드에서 PostHog를 초기화하고 앱 전체에 제공합니다.
 *
 * 환경변수가 없는 경우(개발 환경) PostHog는 자동으로 비활성화되므로
 * 추적 함수들은 no-op으로 작동합니다.
 */
export function PostHogProviderComponent({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  useEffect(() => {
    // PostHog 클라이언트 사이드 초기화
    const initPostHog = async (): Promise<void> => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
        const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

        // API 키가 없으면 PostHog를 초기화하지 않습니다
        // (개발 환경이나 PostHog가 설정되지 않은 경우)
        if (!apiKey) {
          console.debug('PostHog not configured - analytics disabled');
          return;
        }

        posthog.init(apiKey, {
          api_host: apiHost || 'https://app.posthog.com',
          loaded: () => {
            // PostHog 초기화 완료 콜백
            console.debug('PostHog initialized');
          },
        });
      } catch {
        // PostHog 초기화 실패는 조용히 무시합니다
        console.debug('PostHog initialization skipped');
      }
    };

    initPostHog().catch(() => {
      // 에러 무시
    });
  }, []);

  // PostHog React integration이 있으면 사용, 없으면 children만 반환
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return children;
  }

  return (
    <PostHogProvider client={posthog}>
      {children}
    </PostHogProvider>
  );
}
