/** 크롤링 타임아웃 (ms) */
export const CRAWL_TIMEOUT_MS = 60_000

/** 페이지 로드 타임아웃 (ms) */
export const PAGE_LOAD_TIMEOUT_MS = 30_000

/** 최대 리다이렉트 횟수 */
export const MAX_REDIRECTS = 5

/** 최대 응답 크기 (bytes) — 10MB */
export const MAX_RESPONSE_BYTES = 10 * 1024 * 1024

/** 재시도 설정 */
export const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelayMs: 1_000,
  maxDelayMs: 10_000,
} as const

/** User-Agent */
export const CRAWLER_USER_AGENT =
  'FindablyBot/1.0 (+https://findably.kr/bot; SEO diagnostic tool)'

/** 모바일 User-Agent */
export const MOBILE_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

/** 모바일 뷰포트 */
export const MOBILE_VIEWPORT = { width: 375, height: 812 } as const

/** AI 봇 목록 (robots.txt 체크 대상) */
export const AI_BOT_LIST = [
  'GPTBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-Web',
  'PerplexityBot',
  'GoogleOther',
  'Google-Extended',
  'Bingbot',
  'Applebot-Extended',
  'Bytespider',
  'CCBot',
  'FacebookBot',
  'anthropic-ai',
  'cohere-ai',
] as const

// URL 검증 상수 — shared에서 re-export (OST: 단일 정의)
export {
  BLOCKED_HOSTNAMES,
  MAX_URL_LENGTH,
} from '@/shared/constants/url-validation'
