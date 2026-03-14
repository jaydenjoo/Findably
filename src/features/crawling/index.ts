// ─── 타입 ───
export type {
  CrawlData,
  CrawlTriggerRequest,
  CrawlTriggerResult,
  Layer1Data,
  Layer2Data,
  Layer3Data,
  RobotsTxtData,
  SitemapData,
  LlmsTxtData,
  CmsData,
  MobileData,
} from './types'

// ─── 유틸 (shared에서 re-export) ───
export { validateUrlSecurity } from '@/shared/utils/url-security'
export type { UrlValidationResult } from '@/shared/utils/url-security'

// ─── 스키마 ───
export { crawlDataSchema } from './schemas'
export type { CrawlDataInput } from './schemas'

// ─── 파서 ───
export { parseRobotsTxt } from './parsers/robots-txt'
export { parseSitemap } from './parsers/sitemap'
export { parseLlmsTxt } from './parsers/llms-txt'
export { detectCms } from './parsers/cms'
export { checkMobile } from './parsers/mobile'

// ─── 페처 (Layer 2+) ───
export { fetchPageSpeed } from './fetchers/pagespeed'
export { fetchCrux } from './fetchers/crux'

// ─── 상수 ───
export {
  AI_BOT_LIST,
  BLOCKED_HOSTNAMES,
  CRAWL_TIMEOUT_MS,
  CRAWLER_USER_AGENT,
  MAX_REDIRECTS,
  MAX_RESPONSE_BYTES,
  MAX_URL_LENGTH,
  MOBILE_USER_AGENT,
  MOBILE_VIEWPORT,
  PAGE_LOAD_TIMEOUT_MS,
  RETRY_CONFIG,
} from './constants'
