/**
 * PostHog Analytics Helper
 * 클라이언트 사이드에서 사용자 행동을 추적하는 헬퍼 함수들입니다.
 * PostHog가 초기화되지 않은 경우 안전하게 no-op으로 작동합니다.
 */

import { posthog } from 'posthog-js';
import { ANALYTICS_EVENTS, SignupMethod, LoginMethod, SchemaType, MetaTagType } from '@/constants/analytics-events';

/**
 * 제네릭 이벤트 추적 함수
 * 모든 추적 함수의 기반이 되는 함수입니다.
 *
 * @param eventName - 추적할 이벤트 이름
 * @param properties - 이벤트 속성 (선택사항)
 */
export function trackEvent(
  eventName: string,
  properties: Record<string, unknown> = {}
): void {
  try {
    if (posthog) {
      posthog.capture(eventName, properties);
    }
  } catch {
    // PostHog 초기화 실패 시 조용히 무시
    console.debug('Analytics tracking skipped:', eventName);
  }
}

/**
 * 회원가입 이벤트 추적
 *
 * @param method - 가입 방법 ('email' 또는 'google')
 */
export function trackSignup(method: SignupMethod): void {
  trackEvent(ANALYTICS_EVENTS.SIGNUP, {
    method,
  });
}

/**
 * 로그인 이벤트 추적
 *
 * @param method - 로그인 방법 ('email' 또는 'google')
 */
export function trackLogin(method: LoginMethod): void {
  trackEvent(ANALYTICS_EVENTS.LOGIN, {
    method,
  });
}

/**
 * 온보딩 시작 이벤트 추적
 */
export function trackOnboardingStart(): void {
  trackEvent(ANALYTICS_EVENTS.ONBOARDING_START, {});
}

/**
 * 온보딩 완료 이벤트 추적
 *
 * @param industry - 업종 (예: 'tech', 'ecommerce')
 * @param companySize - 회사 규모 (예: 'small', 'medium', 'large')
 */
export function trackOnboardingComplete(industry: string, companySize: string): void {
  trackEvent(ANALYTICS_EVENTS.ONBOARDING_COMPLETE, {
    industry,
    companySize,
  });
}

/**
 * Schema Markup 복사 이벤트 추적
 *
 * @param schemaType - Schema 유형 (예: 'Organization', 'LocalBusiness')
 */
export function trackSchemaCopied(schemaType: SchemaType): void {
  trackEvent(ANALYTICS_EVENTS.SCHEMA_COPIED, {
    schemaType,
  });
}

/**
 * 메타 태그 복사 이벤트 추적
 *
 * @param tagType - 태그 유형 ('title', 'description', 'og', 'twitter', 'all')
 */
export function trackMetaTagCopied(tagType: MetaTagType): void {
  trackEvent(ANALYTICS_EVENTS.META_TAG_COPIED, {
    tagType,
  });
}

/**
 * 재진단 이벤트 추적
 *
 * @param companyId - 회사 ID
 */
export function trackReDiagnose(companyId: string | number): void {
  trackEvent(ANALYTICS_EVENTS.RE_DIAGNOSE, {
    companyId: companyId.toString(),
  });
}

/**
 * 사용자 식별 함수
 * 사용자 세션을 식별하고 사용자 속성을 설정합니다.
 *
 * @param userId - 사용자 ID
 * @param traits - 사용자 속성 (선택사항)
 */
export function identifyUser(
  userId: string,
  traits: Record<string, unknown> = {}
): void {
  try {
    if (posthog) {
      posthog.identify(userId, traits);
    }
  } catch {
    // PostHog 초기화 실패 시 조용히 무시
    console.debug('User identification skipped:', userId);
  }
}
