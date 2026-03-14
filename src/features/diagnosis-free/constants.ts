import type { CategoryId } from './types'

/** 카테고리별 설정 (이름 + 가중치, 합계 100) */
export const CATEGORY_CONFIG: Record<
  CategoryId,
  { name: string; weight: number }
> = {
  technical: { name: '기술 SEO', weight: 20 },
  content: { name: '콘텐츠', weight: 25 },
  'social-ai': { name: '소셜 & AI 접근성', weight: 15 },
  performance: { name: '성능', weight: 15 },
  security: { name: '보안', weight: 15 },
  mobile: { name: '모바일', weight: 10 },
} as const

/** SEO 평가 임계값 */
export const SEO_THRESHOLDS = {
  // Content
  TITLE_MIN_LENGTH: 10,
  TITLE_MAX_LENGTH: 60,
  DESCRIPTION_MIN_LENGTH: 70,
  DESCRIPTION_MAX_LENGTH: 155,

  // Performance
  MAX_PAGE_SIZE_BYTES: 3 * 1024 * 1024,
  MAX_LOAD_TIME_MS: 3000,
  MAX_IMAGE_SIZE_KB: 500,
  MAX_LCP_MS: 2500,
  MAX_FID_MS: 100,
  MAX_CLS: 0.1,
  MAX_TTFB_MS: 800,
  MAX_INP_MS: 200,
  MAX_FCP_MS: 1800,
  MIN_PSI_SCORE: 50,

  // Security
  SSL_EXPIRY_WARNING_DAYS: 30,

  // Technical
  SITEMAP_STALE_DAYS: 90,
} as const

/** 부분 크롤 시 데이터 없음 메시지 */
export const SKIPPED_MESSAGE = '데이터 없음 (부분 크롤링)' as const
