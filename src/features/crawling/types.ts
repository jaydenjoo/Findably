/** Layer 1 직접 크롤링 결과 */
export interface Layer1Data {
  meta: {
    title: string | null
    description: string | null
    canonical: string | null
    charset: string | null
    viewport: string | null
    og: Record<string, string>
    robots_meta: string | null
  }
  headings: {
    h1: string[]
    h2: string[]
    h3: string[]
    h4: string[]
    h5: string[]
    h6: string[]
  }
  schema_markup: unknown[]
  links: {
    internal: number
    external: number
    broken: Array<{ url: string; status: number }>
  }
  images: {
    total: number
    without_alt: number
    large_images: Array<{ src: string; size_kb: number }>
  }
  page_size_bytes: number
  load_time_ms: number
  html_lang: string | null
}

/** robots.txt 파싱 결과 */
export interface RobotsTxtData {
  exists: boolean
  allows_googlebot: boolean
  ai_bots: Record<string, 'allowed' | 'blocked' | 'not_mentioned'>
  sitemap_urls: string[]
  raw?: string
}

/** sitemap.xml 파싱 결과 */
export interface SitemapData {
  exists: boolean
  url_count: number
  last_modified: string | null
}

/** llms.txt 결과 */
export interface LlmsTxtData {
  exists: boolean
  content: string | null
}

/** CMS 감지 결과 */
export interface CmsData {
  detected: string | null
  confidence: number
  technologies: string[]
}

/** 모바일 크롤링 결과 */
export interface MobileData {
  viewport_configured: boolean
  touch_friendly: boolean
  issues: string[]
}

/** Layer 2 Google API 결과 */
export interface Layer2Data {
  pagespeed: {
    performance_score: number
    lcp_ms: number
    fid_ms: number
    cls: number
    ttfb_ms: number
  } | null
  crux: {
    lcp_ms: number
    inp_ms: number
    cls: number
    ttfb_ms: number
    fcp_ms: number
    form_factors: {
      phone: number
      desktop: number
      tablet: number
    } | null
    collection_period: {
      first_date: string
      last_date: string
    }
  } | null
  safe_browsing: {
    is_safe: boolean
    threats: string[]
  } | null
}

/** Layer 3 오픈소스 결과 */
export interface Layer3Data {
  ssl: {
    grade: string | null
    valid: boolean
    expires_at: string | null
    issuer: string | null
  } | null
  observatory: {
    grade: string | null
    score: number | null
    issues: string[]
  } | null
}

/** 통합 크롤링 데이터 (diagnoses.crawl_data) */
export interface CrawlData {
  crawled_at: string
  duration_ms: number
  is_partial: boolean
  blocked_reason?: string
  layer1: Layer1Data | null
  robots_txt: RobotsTxtData | null
  sitemap: SitemapData | null
  llms_txt: LlmsTxtData | null
  cms: CmsData | null
  mobile: MobileData | null
  layer2: Layer2Data | null
  layer3: Layer3Data | null
}

/** 크롤링 트리거 요청 */
export interface CrawlTriggerRequest {
  diagnosisId: string
  url: string
  userId: string
}

/** 크롤링 트리거 응답 */
export interface CrawlTriggerResult {
  success: boolean
  error?: string
}
