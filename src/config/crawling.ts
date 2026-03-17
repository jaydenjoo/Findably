export const crawlingConfig = {
  /** n8n 웹훅 URL (환경변수) */
  webhookUrl: process.env.N8N_WEBHOOK_URL ?? '',

  /** 웹훅 인증 시크릿 (환경변수) */
  webhookSecret: process.env.N8N_WEBHOOK_SECRET ?? '',

  /** Layer 2 Google API 키 */
  googleApiKey: process.env.GOOGLE_API_KEY ?? '',

  /** Firecrawl API 키 (JS 렌더링 크롤링) */
  firecrawlApiKey: process.env.FIRECRAWL_API_KEY ?? '',

  /** 이미지 크기 경고 기준 (KB) */
  largeImageThresholdKb: 200,

  /** 깨진 링크 체크 최대 개수 */
  maxBrokenLinkChecks: 50,

  /** 큰 이미지 리포트 최대 개수 */
  maxLargeImageReports: 20,

  /** Firecrawl API 타임아웃 (ms) */
  firecrawlTimeoutMs: 30_000,
} as const

// ─── 환경변수 누락 경고 (서버 시작 시 1회 출력) ───
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  if (!process.env.N8N_WEBHOOK_URL) {
    console.warn(
      '[config/crawling] ⚠ N8N_WEBHOOK_URL 미설정 — 크롤링 트리거 비활성'
    )
  }
  if (!process.env.N8N_WEBHOOK_SECRET) {
    console.warn(
      '[config/crawling] ⚠ N8N_WEBHOOK_SECRET 미설정 — 웹훅 서명 없이 전송됨'
    )
  }
}
