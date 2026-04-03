import type { CategoryId } from './types'

/** 카테고리별 설정 (이름 + 가중치, 합계 100) */
export const CATEGORY_CONFIG: Record<
  CategoryId,
  { name: string; weight: number }
> = {
  technical: { name: '기술 SEO', weight: 15 },
  content: { name: '콘텐츠', weight: 25 },
  'social-ai': { name: '소셜 & AI 접근성', weight: 12 },
  performance: { name: '성능', weight: 13 },
  security: { name: '보안', weight: 10 },
  mobile: { name: '모바일', weight: 10 },
  geo: { name: 'GEO (AI 검색)', weight: 15 },
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

/** GEO 평가 임계값 */
export const GEO_THRESHOLDS = {
  /** llms.txt 최소 콘텐츠 길이 (글자) */
  MIN_LLMS_TXT_LENGTH: 100,
  /** llms.txt 최소 섹션(#) 수 */
  MIN_LLMS_TXT_SECTIONS: 2,
  /** Schema Markup 최소 종류 수 */
  MIN_SCHEMA_TYPES: 2,
} as const

/** AI 인용 가능성 플랫폼 가중치 (합계 100) */
export const AI_CITATION_PLATFORM_WEIGHTS = {
  chatgpt: 40,
  claude: 30,
  perplexity: 20,
  google: 10,
} as const

/** AI 인용 가능성 신호 가중치 (합계 100) */
export const AI_CITATION_SIGNAL_WEIGHTS = {
  botAccess: 40,
  contentDiscoverability: 40,
  trustSignals: 20,
} as const

/** AI 인용 가능성 임계값 */
export const AI_CITATION_THRESHOLDS = {
  /** 통과 기준 (60점 이상) */
  PASS_SCORE: 60,
  /** Safe Browsing 위험 시 하드캡 */
  UNSAFE_HARD_CAP: 20,
  /** SSL 무효 시 하드캡 */
  SSL_INVALID_HARD_CAP: 40,
} as const

/** AI 플랫폼 표시명 */
export const AI_PLATFORM_LABELS = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  perplexity: 'Perplexity',
  google: 'Google AI Overview',
} as const

/** AI 봇 이름 → 플랫폼 매핑 */
export const AI_BOT_TO_PLATFORM = {
  GPTBot: 'chatgpt',
  ClaudeBot: 'claude',
  PerplexityBot: 'perplexity',
} as const

/** Quick Win 정렬: severity 가중치 (critical 우선) */
export const SEVERITY_PRIORITY_WEIGHTS = {
  critical: 30,
  warning: 20,
  info: 10,
} as const

/** 부분 크롤 시 데이터 없음 — 카테고리별 안내 메시지 */
export const SKIPPED_MESSAGES: Record<string, string> = {
  security:
    '보안 데이터를 수집하지 못했습니다. SSL 인증서 분석에 시간이 더 필요하거나, 서버가 외부 스캔을 차단하고 있을 수 있습니다.',
  mobile:
    '모바일 데이터가 없습니다. 사이트의 viewport 설정이나 모바일 성능 정보를 가져오지 못했습니다. 다음 진단 시 자동으로 재시도합니다.',
  performance:
    '성능 측정 데이터가 부족합니다. 사이트 트래픽이 적으면 Chrome UX Report 데이터가 없을 수 있으며, 이는 정상입니다.',
  geo: 'AI 검색 관련 데이터를 수집하지 못했습니다. llms.txt 파일이 없거나, AI 봇 접근 설정이 확인되지 않았습니다.',
  content:
    '콘텐츠 분석에 필요한 HTML 구조 데이터가 부족합니다. 사이트가 JavaScript로 렌더링되는 경우 일부 항목이 수집되지 않을 수 있습니다.',
  technical:
    '기술 SEO 데이터 일부를 수집하지 못했습니다. robots.txt 차단이나 사이트 구조에 따라 접근이 제한될 수 있습니다.',
  default:
    '이 항목의 분석에 필요한 데이터를 수집하지 못했습니다. 다음 진단 시 자동으로 재시도합니다.',
} as const

/** 폴백 메시지 (하위 호환) */
export const SKIPPED_MESSAGE = SKIPPED_MESSAGES.default
