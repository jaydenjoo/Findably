# Task 3.1 — Playwright 크롤링 (Next.js 측 인프라)

> Epic 3의 첫 번째 Task. n8n 워크플로우가 아닌 **Next.js 코드 영역**만 구현.
> n8n 워크플로우 (실제 Playwright 크롤링)는 별도 작업.

---

## 1. 목표

Task 3.1 완료 시:

- `features/crawling/` 모듈이 타입, 스키마, 상수, 어댑터 인터페이스를 갖춤
- `config/crawling.ts`에 크롤링 설정 외부화
- `lib/adapters/crawler.ts`가 n8n 웹훅 호출을 추상화
- `/api/crawl/trigger` API Route가 n8n에 크롤링 요청을 전달
- `submit-url.ts`가 INSERT 후 트리거를 호출
- URL 보안 유틸 (SSRF 방지)이 온보딩 스키마에 통합
- 유닛 테스트로 URL 보안 검증

---

## 2. 기술 접근법

### 2.1 신규 파일 (8개)

| #   | 파일                                          | 설명                                  |
| --- | --------------------------------------------- | ------------------------------------- |
| 1   | `src/features/crawling/types.ts`              | CrawlData, LayerResult 등 타입        |
| 2   | `src/features/crawling/constants.ts`          | 타임아웃, UA, AI 봇 목록, 재시도 설정 |
| 3   | `src/features/crawling/schemas.ts`            | crawl_data JSONB Zod 스키마           |
| 4   | `src/features/crawling/index.ts`              | 공개 인터페이스 (re-export)           |
| 5   | `src/config/crawling.ts`                      | 크롤링 설정 외부화                    |
| 6   | `src/lib/adapters/crawler.ts`                 | n8n 웹훅 호출 어댑터                  |
| 7   | `src/features/crawling/utils/url-security.ts` | SSRF 방지 유틸                        |
| 8   | `src/app/api/crawl/trigger/route.ts`          | 트리거 API Route                      |

### 2.2 수정 파일 (2개)

| #   | 파일                                            | 변경 내용                                        |
| --- | ----------------------------------------------- | ------------------------------------------------ |
| 1   | `src/features/onboarding/schemas.ts`            | urlSchema에 SSRF 방지 refine + `.max(2048)` 추가 |
| 2   | `src/features/onboarding/actions/submit-url.ts` | INSERT 후 `/api/crawl/trigger` 호출 추가         |

### 2.3 테스트 파일 (1개)

| #   | 파일                                                         | 설명                  |
| --- | ------------------------------------------------------------ | --------------------- |
| 1   | `src/features/crawling/utils/__tests__/url-security.test.ts` | SSRF 방지 유닛 테스트 |

---

## 3. 변경 상세

### 3.1 `features/crawling/types.ts`

Epic 3 마스터 플랜의 `CrawlData` 인터페이스 그대로 정의:

```typescript
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
    origin_summary: unknown
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
```

### 3.2 `features/crawling/constants.ts`

```typescript
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

/** SSRF 차단 대상 private IP 범위 (CIDR) */
export const BLOCKED_IP_RANGES = [
  '127.0.0.0/8', // loopback
  '10.0.0.0/8', // Class A private
  '172.16.0.0/12', // Class B private
  '192.168.0.0/16', // Class C private
  '169.254.0.0/16', // link-local
  '0.0.0.0/8', // current network
  '::1/128', // IPv6 loopback
  'fc00::/7', // IPv6 ULA
  'fe80::/10', // IPv6 link-local
] as const

/** SSRF 차단 대상 호스트네임 */
export const BLOCKED_HOSTNAMES = [
  'localhost',
  '0.0.0.0',
  '[::1]',
  'metadata.google.internal',
  '169.254.169.254',
] as const

/** URL 최대 길이 */
export const MAX_URL_LENGTH = 2048
```

### 3.3 `config/crawling.ts`

scoring.ts 패턴 따라 설정 외부화:

```typescript
export const crawlingConfig = {
  /** n8n 웹훅 URL (환경변수) */
  webhookUrl: process.env.N8N_WEBHOOK_URL ?? '',

  /** 웹훅 인증 시크릿 (환경변수) */
  webhookSecret: process.env.N8N_WEBHOOK_SECRET ?? '',

  /** 트리거 API 인증 시크릿 (내부 호출 보호) */
  triggerSecret: process.env.CRAWL_TRIGGER_SECRET ?? '',

  /** Layer 2 Google API 키 */
  googleApiKey: process.env.GOOGLE_API_KEY ?? '',

  /** 이미지 크기 경고 기준 (KB) */
  largeImageThresholdKb: 200,

  /** 깨진 링크 체크 최대 개수 */
  maxBrokenLinkChecks: 50,

  /** 큰 이미지 리포트 최대 개수 */
  maxLargeImageReports: 20,
} as const
```

### 3.4 `lib/adapters/crawler.ts`

기존 `ai.ts` 어댑터 패턴 참고:

```typescript
import { crawlingConfig } from '@/config/crawling'
import type {
  CrawlTriggerRequest,
  CrawlTriggerResult,
} from '@/features/crawling/types'

export async function triggerCrawl(
  request: CrawlTriggerRequest
): Promise<CrawlTriggerResult> {
  const { webhookUrl, webhookSecret } = crawlingConfig

  if (!webhookUrl) {
    console.error('[triggerCrawl] N8N_WEBHOOK_URL not configured')
    return { success: false, error: 'Crawl service not configured' }
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': webhookSecret,
    },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(10_000), // 10초 타임아웃
  })

  if (!response.ok) {
    console.error('[triggerCrawl] Webhook failed:', response.status)
    return { success: false, error: `Webhook returned ${response.status}` }
  }

  return { success: true }
}
```

### 3.5 `features/crawling/utils/url-security.ts`

SSRF 방지 유틸:

```typescript
import {
  BLOCKED_HOSTNAMES,
  BLOCKED_IP_RANGES,
  MAX_URL_LENGTH,
} from '../constants'

export interface UrlValidationResult {
  valid: boolean
  error?: string
}

/** URL 보안 검증 (SSRF 방지) */
export function validateUrlSecurity(url: string): UrlValidationResult {
  // 1. 길이 제한
  if (url.length > MAX_URL_LENGTH) {
    return { valid: false, error: `URL은 ${MAX_URL_LENGTH}자 이내여야 합니다` }
  }

  // 2. 스키마 검증
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { valid: false, error: '올바른 URL 형식이 아닙니다' }
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { valid: false, error: 'http:// 또는 https://만 지원합니다' }
  }

  // 3. 호스트네임 블록리스트
  const hostname = parsed.hostname.toLowerCase()
  if (
    BLOCKED_HOSTNAMES.includes(hostname as (typeof BLOCKED_HOSTNAMES)[number])
  ) {
    return { valid: false, error: '내부 네트워크 주소는 사용할 수 없습니다' }
  }

  // 4. IP 직접 입력 차단 (IPv4 패턴)
  if (isPrivateIp(hostname)) {
    return { valid: false, error: '비공개 IP 주소는 사용할 수 없습니다' }
  }

  return { valid: true }
}

/** IPv4가 private 범위인지 확인 */
function isPrivateIp(hostname: string): boolean {
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
  const match = hostname.match(ipv4Regex)
  if (!match) return false

  const [, a, b] = match.map(Number)
  // 127.x.x.x, 10.x.x.x, 172.16-31.x.x, 192.168.x.x, 169.254.x.x, 0.x.x.x
  if (a === 127 || a === 10 || a === 0) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 169 && b === 254) return true
  return false
}
```

### 3.6 `app/api/crawl/trigger/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/api/with-auth'
import { successResponse, errorResponse } from '@/lib/api/response'
import { triggerCrawl } from '@/lib/adapters/crawler'

export async function POST(request: NextRequest): Promise<Response> {
  return withAuth(request, async (user) => {
    const body = await request.json()
    const { diagnosisId } = body as { diagnosisId?: string }

    if (!diagnosisId) {
      return errorResponse('diagnosisId is required', 400)
    }

    // 해당 진단이 현재 유저의 pending 상태인지 확인
    const supabase = await createClient()
    const { data: diagnosis, error } = await supabase
      .from('diagnoses')
      .select('id, url, status')
      .eq('id', diagnosisId)
      .eq('user_id', user.id)
      .single()

    if (error || !diagnosis) {
      return errorResponse('진단을 찾을 수 없습니다', 404)
    }

    if (diagnosis.status !== 'pending') {
      return errorResponse('이미 처리 중이거나 완료된 진단입니다', 409)
    }

    // n8n 웹훅 트리거
    const result = await triggerCrawl({
      diagnosisId: diagnosis.id,
      url: diagnosis.url,
      userId: user.id,
    })

    if (!result.success) {
      console.error('[/api/crawl/trigger]', result.error)
      return errorResponse('크롤링 서비스 연결에 실패했습니다', 502)
    }

    return successResponse({ triggered: true })
  })
}
```

### 3.7 `onboarding/schemas.ts` 수정

```typescript
// 기존 urlSchema의 refine을 SSRF 방지로 교체
import { validateUrlSecurity } from '@/features/crawling/utils/url-security'

export const urlSchema = z.object({
  url: z
    .string()
    .min(1, 'URL을 입력해주세요')
    .max(2048, 'URL이 너무 깁니다 (최대 2,048자)')
    .url('올바른 URL 형식이 아닙니다')
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      'http:// 또는 https://로 시작해야 합니다'
    )
    .refine(
      (url) => validateUrlSecurity(url).valid,
      (url) => ({
        message: validateUrlSecurity(url).error ?? '허용되지 않는 URL입니다',
      })
    ),
})
```

### 3.8 `submit-url.ts` 수정

INSERT 성공 후 트리거 호출 추가:

```typescript
// INSERT 성공 후 (기존 redirect 전)
// 크롤링 트리거 (비동기, 실패해도 onboarding 흐름은 계속)
try {
  const triggerUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/crawl/trigger`
  await fetch(triggerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ diagnosisId: data.id }),
    signal: AbortSignal.timeout(5_000),
  })
} catch (triggerError) {
  // 트리거 실패해도 pending 상태로 남음 → 재시도 가능
  console.error('[submitUrlAction] trigger failed:', triggerError)
}

redirect(`/onboarding/info?id=${data.id}`)
```

> **핵심**: 트리거 실패해도 사용자 플로우는 중단 안 됨. pending 상태로 남아 재시도 가능.

### 3.9 `features/crawling/schemas.ts`

crawl_data JSONB 구조 검증용 Zod 스키마. n8n에서 보내는 데이터를 서버에서 검증할 때 사용 (Task 3.10에서 활용):

```typescript
// 타입 정의와 1:1 대응하는 Zod 스키마
// Task 3.1에서는 스키마 정의만. 실제 검증 로직은 Task 3.10에서.
```

### 3.10 `features/crawling/index.ts`

```typescript
export type { CrawlData, CrawlTriggerRequest, CrawlTriggerResult, ... } from './types'
export { validateUrlSecurity } from './utils/url-security'
export { AI_BOT_LIST, BLOCKED_HOSTNAMES, ... } from './constants'
```

---

## 4. 테스트 계획

### `url-security.test.ts`

| 테스트 케이스    | 입력                     | 기대               |
| ---------------- | ------------------------ | ------------------ |
| 정상 URL         | `https://example.com`    | `{ valid: true }`  |
| HTTP도 허용      | `http://example.com`     | `{ valid: true }`  |
| localhost 차단   | `http://localhost:3000`  | `{ valid: false }` |
| 127.0.0.1 차단   | `http://127.0.0.1`       | `{ valid: false }` |
| 10.x 차단        | `http://10.0.0.1`        | `{ valid: false }` |
| 172.16~31 차단   | `http://172.16.0.1`      | `{ valid: false }` |
| 192.168 차단     | `http://192.168.1.1`     | `{ valid: false }` |
| 169.254 차단     | `http://169.254.169.254` | `{ valid: false }` |
| 0.0.0.0 차단     | `http://0.0.0.0`         | `{ valid: false }` |
| FTP 차단         | `ftp://example.com`      | `{ valid: false }` |
| javascript: 차단 | `javascript:alert(1)`    | `{ valid: false }` |
| 긴 URL 차단      | 2049자 URL               | `{ valid: false }` |
| 경계값 URL 허용  | 2048자 URL               | `{ valid: true }`  |
| 공개 IP 허용     | `http://8.8.8.8`         | `{ valid: true }`  |
| 한국어 도메인    | `https://예시.한국`      | `{ valid: true }`  |

---

## 5. 구현 순서

1. `features/crawling/types.ts` — 타입 정의
2. `features/crawling/constants.ts` — 상수 정의
3. `config/crawling.ts` — 설정 외부화
4. `features/crawling/utils/url-security.ts` — SSRF 방지
5. `features/crawling/utils/__tests__/url-security.test.ts` — 테스트
6. `features/crawling/schemas.ts` — Zod 스키마 (빈 뼈대)
7. `features/crawling/index.ts` — 공개 인터페이스
8. `lib/adapters/crawler.ts` — n8n 어댑터
9. `onboarding/schemas.ts` — URL 보안 refine 추가
10. `app/api/crawl/trigger/route.ts` — 트리거 API
11. `onboarding/actions/submit-url.ts` — 트리거 연결

---

## 6. 리스크

| 리스크                                  | 대응                                                          |
| --------------------------------------- | ------------------------------------------------------------- |
| n8n 웹훅 URL 미설정 시 빌드 실패        | 환경변수 기본값 `''` → 런타임에서 에러 반환 (빌드는 통과)     |
| submit-url.ts 트리거 실패 → 사용자 막힘 | 트리거는 fire-and-forget. 실패해도 pending 유지 → 재시도 가능 |
| SSRF 우회 (DNS rebinding)               | n8n이 Elest.io 외부 서버라 내부 접근 불가. 1차 방어로 충분    |
| withAuth가 POST 지원하는지              | 기존 코드 확인 필요 (GET만 래핑했을 수 있음)                  |

---

## 7. 스코프 외 (하지 않을 것)

- n8n 워크플로우 구현 (별도 작업)
- Layer 2/3 API 호출 (Task 3.6~3.9)
- crawl_data 통합 저장 로직 (Task 3.10)
- robots.txt 차단 UI (Task 3.11)
- 테스트 이외의 E2E 검증

---

## 8. 검증

```bash
pnpm tsc --noEmit && pnpm lint && pnpm build && pnpm test
```

- URL 보안 유닛 테스트 15개+ 통과
- 빌드 성공 (환경변수 없어도)
- 기존 온보딩 테스트 깨지지 않음
