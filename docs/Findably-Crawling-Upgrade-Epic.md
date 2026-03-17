# Findably 크롤링 인프라 업그레이드 Epic

## Claude Code 지시서 — 최고 품질 마케팅 리포트를 위한 데이터 수집 고도화

> **목표**: 최고/최상의 마케팅 리포트 품질 달성을 위해 기초 데이터 수집량 극대화 + 에러율 최소화 + 처리 속도 최적화
> **작성일**: 2026-03-17
> **작성 근거**: 코드베이스 전체 분석 완료 (GitHub jaydenjoo/Findably)

---

## 현재 상태 분석 (코드 기반)

### 있는 것 (완성됨)

- Next.js 15 + Supabase + Drizzle ORM 전체 인프라
- Cheerio 기반 HTML 파서 (`src/lib/parsing/html-parser.ts`) — meta, headings, links, images
- Schema.org 파서 (`src/lib/parsing/schema-parser.ts`)
- Sitemap/robots.txt 파서 (`src/lib/parsing/sitemap-parser.ts`)
- CMS 감지 (`src/lib/parsing/cms-detector.ts`)
- SEO 스코어러 7항목/100점 (`src/lib/scoring/seo-scorer.ts`)
- GEO 스코어러 6항목/100점 (`src/lib/scoring/geo-scorer.ts`)
- Performance 스코어러 기본 (`src/lib/scoring/performance-scorer.ts`)
- Claude AI 콘텐츠 분석기 (`src/lib/ai/claude-analyzer.ts`)
- 진단 오케스트레이터 (`src/lib/diagnosis/orchestrator.ts`)
- Quick Win 엔진, 메타 최적화, Schema 생성기
- n8n 워크플로우 JSON (`n8n/workflows/findably-crawl.json`)
- 에러 핸들러 + 재시도 로직 (`src/lib/crawl/`)
- 83 test suites / 1,562 tests 통과

### 없는 것 (이번 Epic 범위)

1. **Firecrawl 통합** — JS 렌더링 크롤링 (현재 Cheerio = 정적 HTML만)
2. **Google CrUX API** — 실제 사용자 성능 데이터 (현재 타입만 정의, 데이터 미수집)
3. **SSL/보안 분석** — SSL Labs, Mozilla Observatory
4. **llms.txt 분석** — AI 가시성의 핵심 신호
5. **경쟁사 자동 벤치마킹** — 같은 업종 경쟁사 비교 데이터
6. **본문 전체 텍스트** — AI 분석기가 2000자만 받음 (콘텐츠 분석 부족)
7. **n8n 병렬 처리** — 현재 순차 실행으로 느림

---

## 우선순위 원칙

```
① 리포트 품질 = 데이터 양 × 데이터 정확도 × AI 분석 깊이
② 에러율 최소화 = 각 데이터 소스 독립 실행 + 부분 실패 허용
③ 처리 속도 = 병렬 실행 + 타임아웃 제한 + 캐싱
```

---

## Task 분해 (총 7 Tasks)

### Task 13: Firecrawl API 통합 — JS 렌더링 크롤링

**예상 소요**: 2시간
**파일**: 신규 `src/lib/crawl/firecrawl-client.ts`

#### 작업 내용

1. `pnpm add firecrawl-js` 설치
2. Firecrawl 클라이언트 모듈 생성:

```typescript
// src/lib/crawl/firecrawl-client.ts
// 역할: URL을 Firecrawl API로 크롤링하여 LLM-ready 데이터 반환
// 핵심: JS 렌더링 완료 후 콘텐츠 추출 (React/Vue/SPA 사이트 대응)

import FirecrawlApp from '@anthropic-ai/firecrawl-js' // 또는 firecrawl-js
import { z } from 'zod'

// 환경변수
// FIRECRAWL_API_KEY — .env.local에 추가

// 반환 타입 (Zod 스키마로 검증)
const firecrawlResultSchema = z.object({
  markdown: z.string(), // LLM-ready 마크다운
  metadata: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      ogTitle: z.string().optional(),
      ogDescription: z.string().optional(),
      ogImage: z.string().optional(),
      language: z.string().optional(),
      statusCode: z.number().optional(),
    })
    .passthrough(),
  html: z.string().optional(), // 원본 HTML
  screenshot: z.string().optional(), // base64 스크린샷
})

// 함수: scrapeUrl(url: string) → FirecrawlResult
// - formats: ['markdown', 'html']
// - includeTags: ['title', 'meta', 'h1', 'h2', 'h3', 'p', 'a', 'img']
// - timeout: 30000ms
// - Zod로 응답 검증
// - 실패 시 { success: false, error } 반환 (기존 Cheerio 폴백)

// 함수: mapUrl(url: string) → string[]
// - Firecrawl /map 엔드포인트
// - 사이트 전체 URL 목록 반환 (sitemap 대체/보완)
// - timeout: 15000ms
```

3. 기존 코드와의 통합:
   - `src/lib/parsing/html-parser.ts`의 입력을 Firecrawl HTML로 교체
   - Firecrawl 실패 시 기존 Cheerio 파싱으로 자동 폴백
   - `src/types/crawl.ts`의 `CrawlResult`에 `markdownContent?: string` 필드 추가

4. 환경변수 추가:
   - `src/lib/env.ts`에 `FIRECRAWL_API_KEY` 추가 (Zod 검증)
   - `src/lib/config.ts`에 `getFirecrawlConfig()` 추가

#### 검증 기준

- JS 렌더링 사이트(React/Vue)에서 콘텐츠 정상 추출
- Firecrawl 다운 시 Cheerio 폴백 정상 작동
- 응답 시간 30초 이내
- 기존 1,562 테스트 전부 통과 + 신규 테스트 추가

---

### Task 14: Google CrUX + PageSpeed Insights API 통합 — 실제 사용자 성능 데이터

**예상 소요**: 1.5시간
**파일**: 신규 `src/lib/performance/google-apis.ts`

#### 배경 (중요!)

현재 `PerformanceMetrics` 타입이 `src/types/crawl.ts`에 정의되어 있지만 실제 Google API 호출이 없음.
Firecrawl 같은 봇 크롤링 속도는 실제 사용자 경험과 다르므로, **반드시 Google CrUX API로 실사용자 데이터를 수집해야 함**.

#### 작업 내용

1. Google CrUX API 클라이언트:

```typescript
// src/lib/performance/google-apis.ts

// 환경변수: GOOGLE_PAGESPEED_API_KEY

// 함수 1: fetchPageSpeedInsights(url: string)
// - Google PageSpeed Insights API v5 호출
// - strategy: 'mobile' + 'desktop' 각각 호출
// - 반환: Lighthouse 랩 데이터 + CrUX 필드 데이터
// - CrUX 필드 데이터 = 실제 사용자 28일간 경험 (LCP, CLS, INP, FCP, TTFB)
// - Lighthouse 랩 데이터 = 성능 점수 + 개선 제안
// - timeout: 20000ms (Google API는 느릴 수 있음)

// 함수 2: fetchCruxData(url: string)
// - CrUX API 직접 호출 (더 상세한 필드 데이터)
// - 도메인 레벨 + URL 레벨 모두 시도
// - 트래픽 부족 시 도메인 레벨로 폴백
// - 반환: 디바이스별(mobile/desktop) Core Web Vitals p75

// 함수 3: fetchSafeBrowsing(url: string)
// - Google Safe Browsing API
// - 사이트 보안 상태 확인
// - 반환: { safe: boolean, threats: string[] }
```

2. `src/types/crawl.ts` 업데이트:
   - `CrawlResult`에 `cruxData?: CruxFieldData` 추가
   - `CrawlResult`에 `lighthouseAudits?: LighthouseAudit[]` 추가
   - `CrawlResult`에 `safeBrowsing?: SafeBrowsingResult` 추가

3. `src/lib/scoring/performance-scorer.ts` 업그레이드:
   - 현재: 기본 점수만 계산
   - 변경: CrUX 실사용자 데이터 기반 점수 계산
   - LCP < 2.5s = Good, < 4.0s = Needs Improvement, > 4.0s = Poor
   - CLS < 0.1 = Good, < 0.25 = Needs Improvement, > 0.25 = Poor
   - INP < 200ms = Good, < 500ms = Needs Improvement, > 500ms = Poor

#### 검증 기준

- PageSpeed API 호출 성공 (mobile + desktop)
- CrUX 데이터 없는 소규모 사이트에서도 에러 없이 Lighthouse 데이터만 반환
- 기존 performance-scorer 테스트 호환 유지

---

### Task 15: SSL/보안 분석 모듈 추가

**예상 소요**: 1시간
**파일**: 신규 `src/lib/security/ssl-analyzer.ts`

#### 작업 내용

```typescript
// src/lib/security/ssl-analyzer.ts

// 함수 1: analyzeSSL(hostname: string)
// - SSL Labs API (api.ssllabs.com/api/v3/analyze)
// - 주의: SSL Labs는 분석에 60-120초 소요 → 폴링 패턴 사용
//   - startNew=on으로 분석 시작
//   - 5초 간격으로 상태 체크 (최대 24회 = 120초)
//   - 또는 fromCache=on으로 캐시된 결과 먼저 시도
// - 반환: grade (A+~F), 인증서 만료일, 프로토콜 버전
// - timeout: 120초 (느린 API)
// - 실패 시 null 반환 (리포트에서 "분석 불가" 표시)

// 함수 2: analyzeSecurityHeaders(url: string)
// - Mozilla Observatory API (observatory.mozilla.org/api/v2/analyze)
// - HTTP 보안 헤더 분석 (CSP, HSTS, X-Frame-Options 등)
// - 반환: grade (A+~F), 누락된 헤더 목록
// - timeout: 30초
```

#### `src/types/crawl.ts` 추가:

```typescript
interface SecurityAnalysis {
  sslGrade?: string // A+, A, B, C, D, F
  sslExpiry?: string // 인증서 만료일
  sslProtocol?: string // TLS 1.3, TLS 1.2 등
  headerGrade?: string // Observatory 등급
  missingHeaders?: string[] // 누락된 보안 헤더
}
```

#### 검증 기준

- SSL Labs 캐시 히트 시 10초 이내 응답
- Observatory API 정상 호출
- API 실패 시 null 반환 (전체 크롤링 중단 없음)

---

### Task 16: llms.txt 분석 + GEO 스코어러 강화

**예상 소요**: 1.5시간
**파일**: `src/lib/parsing/` 신규 + `src/lib/scoring/geo-scorer.ts` 수정

#### 작업 내용

1. llms.txt 파서 추가:

```typescript
// src/lib/parsing/llmstxt-parser.ts

// 함수: parseLlmsTxt(url: string)
// - {url}/llms.txt 와 {url}/llms-full.txt 모두 확인
// - HTTP fetch (Firecrawl 불필요 — 정적 텍스트 파일)
// - 반환: { exists: boolean, content?: string, sections?: string[] }
// - timeout: 5초
```

2. GEO 스코어러 강화 (`src/lib/scoring/geo-scorer.ts`):

**현재 6항목을 10항목으로 확장:**

```
기존 유지:
- Schema.org 마크업 존재: 20점 (30→20 조정)
- 구조화된 데이터: 15점 (20→15 조정)
- FAQ Schema: 10점 (15→10 조정)
- 이미지 alt 텍스트: 10점 (15→10 조정)
- E-E-A-T 신호: 5점 (유지)

신규 추가:
- llms.txt 존재: 15점 ⭐ (Findably 킬러 차별화)
- 콘텐츠 길이 ≥1000자 (본문 기준): 10점 (기존 heading→body 변경)
- Canonical URL 설정: 5점
- Open Graph 완성도: 5점 (title+desc+image 모두 있으면 만점)
- 다국어/hreflang 설정: 5점
```

3. `src/types/crawl.ts`에 추가:

```typescript
interface CrawlResult {
  // ... 기존 필드들
  llmsTxt?: { exists: boolean; content?: string }
  securityAnalysis?: SecurityAnalysis
  markdownContent?: string // Firecrawl에서 추출한 LLM-ready 마크다운
  cruxData?: CruxFieldData
}
```

#### 검증 기준

- GEO 스코어러 총점 여전히 100점 만점
- llms.txt 없는 사이트에서도 에러 없이 0점 처리
- 기존 GEO 테스트 수정 + 신규 테스트 추가

---

### Task 17: AI 분석기 고도화 — 전체 마크다운 기반 분석

**예상 소요**: 1.5시간
**파일**: `src/lib/ai/claude-analyzer.ts` 수정

#### 현재 문제

- `bodyText`가 2000자로 제한됨 → 콘텐츠 분석 품질 저하
- `industry`가 하드코딩 'general' → 업종 맞춤 분석 불가
- 추천사항이 3개로 제한 → 컨설팅펌급 리포트에 부족

#### 작업 내용

1. Firecrawl 마크다운을 AI 분석 입력으로 활용:
   - `bodyText: string.max(2000)` → `markdownContent: string.max(8000)`
   - Firecrawl 마크다운은 clean text이므로 토큰 효율 67% 향상

2. 분석 프롬프트 업그레이드:

```typescript
// 시스템 프롬프트 v2 — 컨설팅펌급 분석
const systemPromptV2 = `당신은 McKinsey 출신 마케팅 컨설턴트입니다.
주어진 웹사이트의 콘텐츠를 다음 프레임워크로 분석합니다:

1. 콘텐츠 품질 (0-100): 명확성, 전문성, 사용자 의도 충족도
2. SEO 콘텐츠 적합성 (0-100): 키워드 자연스러운 사용, 검색 의도 매칭
3. E-E-A-T 신호 강도 (0-100): 전문성, 경험, 권위, 신뢰의 텍스트 내 증거
4. AI 인용 가능성 (0-100): 구조화, 팩트 기반, 인용하기 쉬운 문장 비율
5. 경쟁 차별화 (0-100): 업종 내 유사 사이트 대비 고유 가치
6. 종합 AI 점수 (0-100)
7. Quick Win 추천 5가지 (즉시 실행 가능, 예상 효과 포함)
8. 전략적 추천 3가지 (중장기, 투자 필요)

업종: {industry}
회사 규모: {company_size}

JSON으로만 응답하세요.`
```

3. 응답 스키마 확장:

```typescript
const analysisResponseSchemaV2 = z.object({
  contentQuality: z.number().min(0).max(100),
  seoContentFit: z.number().min(0).max(100),
  eeatStrength: z.number().min(0).max(100),
  aiCitability: z.number().min(0).max(100), // 신규!
  competitiveDiff: z.number().min(0).max(100), // 신규!
  aiScore: z.number().min(0).max(100),
  quickWins: z
    .array(
      z.object({
        action: z.string(),
        expectedEffect: z.string(),
        difficulty: z.enum(['low', 'medium', 'high']),
      })
    )
    .max(5),
  strategicRecommendations: z.array(z.string()).max(3),
})
```

4. 온보딩에서 수집한 `industry`, `company_size`를 실제로 전달 (현재 하드코딩)

#### 검증 기준

- 8000자 마크다운 입력에서도 정상 분석
- Firecrawl 실패 시 기존 2000자 bodyText로 폴백
- 응답 Zod 검증 통과
- Claude API 호출 비용 모니터링 (max_tokens: 2048로 조정)

---

### Task 18: n8n 워크플로우 병렬 처리 최적화

**예상 소요**: 2시간
**파일**: `n8n/workflows/findably-crawl.json` 재설계

#### 현재 문제

- 모든 크롤링 단계가 순차 실행 → 느림
- 하나가 실패하면 전체 중단 위험

#### 작업 내용 — n8n 워크플로우 재설계:

```
[Webhook 트리거] (url, company_id, industry, company_size)
  │
  ├── [Set Node] 변수 정리 + 타임스탬프
  │
  ├── [Split In Batches] 3개 병렬 그룹으로 분기
  │
  │   ┌─ [그룹 A: 콘텐츠 수집] ────────────────────────────┐
  │   │  [HTTP Request] Firecrawl /scrape API               │
  │   │  → markdown + html + metadata + screenshot           │
  │   │  [HTTP Request] Firecrawl /map API                   │
  │   │  → 사이트 전체 URL 목록                               │
  │   │  [Code Node] 기존 파서 실행                           │
  │   │  → robots.txt, llms.txt, CMS 감지, Schema 파싱        │
  │   └──────────────────────────────────────────────────────┘
  │
  │   ┌─ [그룹 B: 성능 + 보안] ─────────────────────────────┐
  │   │  [HTTP Request] PageSpeed Insights (mobile)          │
  │   │  [HTTP Request] PageSpeed Insights (desktop)         │
  │   │  [HTTP Request] SSL Labs (fromCache=on 먼저)         │
  │   │  [HTTP Request] Mozilla Observatory                  │
  │   │  [HTTP Request] Safe Browsing API                    │
  │   └──────────────────────────────────────────────────────┘
  │
  │   ┌─ [그룹 C: 기본 fetch] ──────────────────────────────┐
  │   │  [HTTP Request] robots.txt 직접 fetch                │
  │   │  [HTTP Request] sitemap.xml fetch + 파싱             │
  │   │  [HTTP Request] llms.txt fetch                       │
  │   │  [HTTP Request] llms-full.txt fetch                  │
  │   └──────────────────────────────────────────────────────┘
  │
  ├── [Merge Node] 3개 그룹 결과 통합 (Wait for All)
  │
  ├── [Code Node] 결과 정규화 + CrawlResult 타입으로 변환
  │   → 부분 실패 허용: 각 필드가 null이면 리포트에서 "데이터 없음" 표시
  │
  ├── [Supabase Node] crawl_results 테이블에 저장
  │
  ├── [HTTP Request] Next.js API 콜백
  │   → POST /api/crawl/complete { crawlResultId, status }
  │   → 이 API가 진단 오케스트레이터를 트리거
  │
  └── [Error Workflow] 전체 실패 시
      → Supabase에 status='failed' 저장
      → Sentry 알림
```

#### n8n 에러 처리 규칙:

- 각 HTTP Request 노드에 `continueOnFail: true` 설정
- 개별 API 실패 시 해당 필드만 null → 전체 워크플로우 계속
- Firecrawl 실패 시 → 그룹 C의 직접 fetch 결과로 대체
- 전체 타임아웃: 180초 (3분)
- 각 API 타임아웃: Firecrawl 30초, Google 20초, SSL Labs 60초, 나머지 10초

#### 검증 기준

- 전체 실행 시간 < 60초 (정상 케이스)
- 1개 API 실패 시에도 나머지 데이터로 리포트 생성
- 병렬 그룹 3개 동시 실행 확인

---

### Task 19: 진단 오케스트레이터 업그레이드 + 리포트 품질 극대화

**예상 소요**: 2시간
**파일**: `src/lib/diagnosis/orchestrator.ts` 수정

#### 작업 내용

1. 오케스트레이터 입력 확장:

```typescript
// src/lib/diagnosis/orchestrator.ts

interface DiagnosisOrchestratorInput {
  crawlResult: CrawlResult // 확장된 CrawlResult (Firecrawl + CrUX + SSL + llms.txt)
  companyId: number
  crawlResultId: number
  industry: string // 온보딩에서 수집한 업종 (신규)
  companySize: string // 온보딩에서 수집한 규모 (신규)
}
```

2. 진단 흐름 업그레이드:

```
1. [병렬] SEO 점수 + GEO 점수 + 성능 점수 + 보안 점수 계산
   → 모두 동기 함수이므로 Promise.all 불필요하지만, 보안 점수 추가

2. [비동기] Claude AI 분석 — 확장된 프롬프트 v2
   → markdownContent (최대 8000자) + 전체 크롤링 데이터 요약 전달
   → 실패 시 다른 점수만으로 리포트 생성 (기존 패턴 유지)

3. 종합 점수 집계 — 가중치 변경:
   현재: SEO(25%) + GEO(25%) + Performance(25%) + AI(25%)
   변경: SEO(20%) + GEO(25%) + Performance(20%) + AI(25%) + Security(10%)

4. Quick Win 식별 — 우선순위 매트릭스 추가:
   각 Quick Win에 { impact: 'high'|'medium'|'low', effort: 'low'|'medium'|'high' }
   impact=high & effort=low → 최우선 추천

5. 결과 반환 — 확장된 DiagnosisDataSuccess
```

3. `DiagnosisDataSuccess` 확장:

```typescript
interface DiagnosisDataSuccess {
  // 기존
  seoScore: number
  geoScore: number
  performanceScore: number
  aiScore: number | null
  overallScore: number
  grade: Grade
  quickWins: QuickWin[]
  aiInsights: AiInsights | null
  aiUnavailable: boolean
  diagnosedAt: Date

  // 신규
  securityScore: number // 0-100
  seoDetails: SeoScoreDetail[]
  geoDetails: GeoScoreDetail[]
  performanceDetails: PerformanceDetail[] // CrUX 기반 상세
  securityDetails: SecurityDetail[]
  llmsTxtStatus: boolean // llms.txt 존재 여부
  cruxAvailable: boolean // CrUX 실사용자 데이터 존재 여부
  dataCompleteness: number // 0-100% — 수집 완료율
}
```

4. `dataCompleteness` 계산 로직:

```
전체 데이터 소스 10개:
- HTML 메타태그 (Firecrawl)
- 본문 마크다운 (Firecrawl)
- Schema Markup
- robots.txt
- sitemap
- llms.txt
- PageSpeed (mobile)
- PageSpeed (desktop)
- SSL 분석
- 보안 헤더 분석

각 소스별 10점 → 총 100점
수집 성공한 소스 수 × 10 = dataCompleteness
리포트에 "데이터 수집 완료율: 80%" 표시
```

#### 검증 기준

- 모든 데이터 소스 성공 시 dataCompleteness = 100
- 3개 소스 실패해도 리포트 정상 생성 (70%)
- 기존 테스트 수정 + 신규 테스트 (확장된 필드 검증)
- tsc → eslint → build → test 통과

---

## 환경변수 추가 목록

```env
# .env.local에 추가
FIRECRAWL_API_KEY=fc-xxxxx            # Firecrawl API 키
GOOGLE_PAGESPEED_API_KEY=AIzaxxxxx    # Google PageSpeed Insights
# SSL Labs와 Mozilla Observatory는 API 키 불필요
# Safe Browsing은 GOOGLE_PAGESPEED_API_KEY 공유 가능
```

`src/lib/env.ts`에 Zod 검증 추가:

```typescript
FIRECRAWL_API_KEY: z.string().min(1).startsWith('fc-'),
GOOGLE_PAGESPEED_API_KEY: z.string().min(1).startsWith('AIza'),
```

---

## 실행 순서

```
Task 13 (Firecrawl) → Task 14 (Google APIs) → Task 15 (SSL/보안)
                                                       ↓
Task 16 (llms.txt + GEO 강화) → Task 17 (AI 분석기 고도화)
                                           ↓
                              Task 18 (n8n 병렬 처리)
                                           ↓
                              Task 19 (오케스트레이터 통합)
```

Task 13~15는 독립적이므로 순서 유연. Task 16~17은 13에 의존. Task 18~19는 전체 통합.

---

## Self-Check (매 Task 완료 시)

```
□ 기존 1,562 테스트 전부 통과하는가?
□ 신규 테스트 추가했는가?
□ tsc --noEmit 에러 0인가?
□ any 타입 사용하지 않았는가?
□ Zod로 모든 외부 API 응답을 검증하는가?
□ 각 API 실패 시 전체 크롤링이 중단되지 않는가?
□ timeout이 설정되어 있는가?
□ 환경변수가 하드코딩되지 않았는가?
□ PROGRESS.md를 업데이트했는가?
□ learnings.md에 기록할 교훈이 있는가?
```

---

## Not Doing (이번 Epic 범위 밖)

- 경쟁사 자동 크롤링 (v2에서)
- AI 가시성 실시간 추적 — ChatGPT/Gemini/Perplexity 시뮬레이션 (v2에서)
- 주간 자동 재크롤링 스케줄러 (v2에서)
- Firecrawl self-hosting (클라우드 API 사용)
- 다국어 리포트 (한국어 우선)
