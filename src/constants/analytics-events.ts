/**
 * Analytics Event Names
 * 분석 추적에 사용되는 모든 이벤트 이름을 한 곳에서 정의합니다.
 * 마법의 문자열을 방지하고 타입 안정성을 확보합니다.
 */

// 인증 이벤트
export const ANALYTICS_EVENTS = {
  // 인증 (Auth)
  SIGNUP: 'signup',
  LOGIN: 'login',

  // 온보딩 (Onboarding)
  ONBOARDING_START: 'onboarding_start',
  ONBOARDING_COMPLETE: 'onboarding_complete',

  // 대시보드 (Dashboard)
  SCHEMA_COPIED: 'schema_copied',
  META_TAG_COPIED: 'meta_tag_copied',
  RE_DIAGNOSE: 're_diagnose',

  // 사용자 (User)
  USER_IDENTIFIED: 'user_identified',
} as const;

/**
 * Event property types for type safety
 */
export type SignupMethod = 'email' | 'google';
export type LoginMethod = 'email' | 'google';
export type SchemaType = string; // e.g. 'Organization', 'LocalBusiness'
export type MetaTagType = 'title' | 'description' | 'og' | 'twitter' | 'all';
