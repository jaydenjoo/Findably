# Findably 크롤링 업그레이드 — Claude Code 실행 프롬프트 모음

## Task 13~19 개별 프롬프트 (순서대로 실행)

> **사용법**: 각 Task의 프롬프트 블록을 Claude Code CLI에 복사-붙여넣기
> **규칙**: 한 Task 완료 → 검증 통과 → 다음 Task 진행

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Task 13: Firecrawl API 통합

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
PROGRESS.md와 docs/learnings.md를 먼저 읽어줘.

## Task 13: Firecrawl API 통합 — JS 렌더링 크롤링

### 배경
현재 src/lib/parsing/html-parser.ts가 Cheerio로 정적 HTML만 파싱 중.
React/Vue/SPA 사이트는 콘텐츠를 못 가져옴. Firecrawl API를 통합하여 JS 렌더링 완료 후 콘텐츠를 추출해야 함.

### 작업 내용

#### 1단계: 패키지 설치 + 환경변수
- `pnpm add @mendable/firecrawl-js` 설치
- src/lib/env.ts에 FIRECRAWL_API_KEY 추가 (Zod: z.string().min(1))
- src/lib/config.ts에 getFirecrawlConfig() 추가

#### 2단계: Firecrawl 클라이언트 모듈 생성
- 파일: src/lib/crawl/firecrawl-client.ts
- 함수 1: scrapeUrl(url: string)
  - Firecrawl /scrape 엔드포인트 호출
  - formats: ['markdown', 'html'] 요청
  - timeout: 30000ms
  - 반환 타입을 Zod로 검증 (title, description, ogTitle, ogDescription, ogImage, language, statusCode, markdown, html)
  - 성공: { success: true, data: FirecrawlScrapeResult }
  - 실패: { success: false, error: string }
- 함수 2: mapUrl(url: string)
  - Firecrawl /map 엔드포인트 호출
  - 사이트 전체 URL 목록 반환
  - timeout: 15000ms
  - 반환: { success: true, urls: string[] } | { success: false, error: string }

#### 3단계: CrawlResult 타입 확장
- src/types/crawl.ts의 CrawlResult 인터페이스에 추가:
  - markdownContent?: string (Firecrawl에서 추출한 LLM-ready 마크다운)
  - siteUrls?: string[] (Firecrawl /map에서 추출한 URL 목록)
  - firecrawlUsed?: boolean (Firecrawl 사용 여부)

#### 4단계: 기존 파서와의 통합
- 기존 html-parser.ts는 수정하지 않음 (폴백으로 유지)
- 오케스트레이션 레벨에서: Firecrawl 성공 → html-parser에 Firecrawl HTML 전달 + markdownContent 저장
- Firecrawl 실패 → 기존 Cheerio 파싱으로 자동 폴백 (rawHtml 사용)

#### 5단계: 테스트 작성
- src/lib/crawl/__tests__/firecrawl-client.test.ts 생성
- Firecrawl API를 모킹하여 테스트
- 성공 케이스, 실패 폴백 케이스, 타임아웃 케이스

### 금지 사항
- 기존 html-parser.ts 코드 수정 금지 (폴백으로 유지해야 함)
- any 타입 사용 금지
- 환경변수 하드코딩 금지
- 이 Task 범위 밖 파일 수정 금지

### 완료 기준
- tsc --noEmit → 0 errors
- eslint → 0 errors
- vitest run → 기존 1,562+ 테스트 통과 + 신규 테스트 통과
- PROGRESS.md 업데이트
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Task 14: Google CrUX + PageSpeed Insights API

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

````
PROGRESS.md와 docs/learnings.md를 먼저 읽어줘.

## Task 14: Google CrUX + PageSpeed Insights API 통합

### 배경
현재 src/types/crawl.ts에 PerformanceMetrics, CoreWebVitals 타입이 정의되어 있지만 실제 Google API 호출 코드가 없음.
봇 크롤링 속도와 실제 사용자 경험은 완전히 다름.
Google CrUX API = 실제 Chrome 사용자의 28일간 성능 데이터 = 정확한 속도 측정.
Google이 SEO 랭킹에 사용하는 것도 이 CrUX 데이터임.

### 작업 내용

#### 1단계: 환경변수
- src/lib/env.ts에 GOOGLE_PAGESPEED_API_KEY 추가 (Zod: z.string().min(1))
- src/lib/config.ts에 getGoogleApisConfig() 추가

#### 2단계: Google APIs 클라이언트 생성
- 파일: src/lib/performance/google-apis.ts
- 함수 1: fetchPageSpeedInsights(url: string, strategy: 'mobile' | 'desktop')
  - API: https://www.googleapis.com/pagespeedonline/v5/runPagespeed
  - params: url, strategy, key, category=performance
  - 반환값 Zod 검증:
    - lighthouseResult.categories.performance.score (0-1 → 0-100 변환)
    - loadingExperience (CrUX 필드 데이터): LCP, FID→INP, CLS, FCP, TTFB
    - lighthouseResult.audits (성능 개선 제안)
  - timeout: 20000ms
  - 실패: { success: false, error }

- 함수 2: fetchCruxData(origin: string)
  - API: https://chromeuxreport.googleapis.com/v1/records:queryRecord
  - body: { origin: origin } (도메인 레벨)
  - URL 레벨 데이터 없으면 origin 레벨로 폴백
  - 트래픽 부족 시 null 반환 (에러 아님)
  - 반환: CruxFieldData | null

- 함수 3: fetchSafeBrowsing(url: string)
  - API: https://safebrowsing.googleapis.com/v4/threatMatches:find
  - 반환: { safe: boolean, threats: string[] }
  - timeout: 10000ms

#### 3단계: 타입 확장
- src/types/crawl.ts에 추가:
```typescript
interface CruxFieldData {
  lcp: { p75: number; category: 'good' | 'needs-improvement' | 'poor' };
  cls: { p75: number; category: 'good' | 'needs-improvement' | 'poor' };
  inp: { p75: number; category: 'good' | 'needs-improvement' | 'poor' };
  fcp?: { p75: number; category: 'good' | 'needs-improvement' | 'poor' };
  ttfb?: { p75: number; category: 'good' | 'needs-improvement' | 'poor' };
}

interface LighthouseAudit {
  id: string;
  title: string;
  description: string;
  score: number | null;
  displayValue?: string;
}

interface SafeBrowsingResult {
  safe: boolean;
  threats: string[];
}
````

- CrawlResult에 추가:
  - cruxData?: CruxFieldData
  - lighthouseScore?: { mobile: number; desktop: number }
  - lighthouseAudits?: LighthouseAudit[]
  - safeBrowsing?: SafeBrowsingResult

#### 4단계: performance-scorer.ts 업그레이드

- 파일: src/lib/scoring/performance-scorer.ts
- 현재: 기본 점수만 반환
- 변경: CrUX 데이터 기반 100점 만점 계산
  - LCP (30점): < 2.5s = 30점, < 4.0s = 15점, > 4.0s = 0점
  - CLS (25점): < 0.1 = 25점, < 0.25 = 12점, > 0.25 = 0점
  - INP (25점): < 200ms = 25점, < 500ms = 12점, > 500ms = 0점
  - Lighthouse 점수 (20점): score \* 20
  - CrUX 데이터 없으면 Lighthouse 점수만으로 계산 (최대 80점)

#### 5단계: 테스트

- src/lib/performance/**tests**/google-apis.test.ts 생성
- Google API 모킹하여 테스트
- CrUX 데이터 있는 경우 / 없는 경우 / API 실패 경우
- performance-scorer 기존 테스트 수정 (새 점수 체계 반영)

### 금지 사항

- any 타입 사용 금지
- Google API 키 하드코딩 금지
- API 실패 시 전체 크롤링 중단 금지 (null 반환)
- 이 Task 범위 밖 파일 수정 금지

### 완료 기준

- tsc --noEmit → 0 errors
- vitest run → 전체 통과
- PROGRESS.md 업데이트

```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Task 15: SSL/보안 분석 모듈
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```

PROGRESS.md와 docs/learnings.md를 먼저 읽어줘.

## Task 15: SSL/보안 분석 모듈 추가

### 배경

마케팅 리포트에 보안 상태가 빠지면 불완전함.
SSL 등급과 보안 헤더는 Google SEO 랭킹 요소이기도 함.
SSL Labs와 Mozilla Observatory는 API 키 불필요 (무료 공개 API).

### 작업 내용

#### 1단계: 보안 분석 모듈 생성

- 파일: src/lib/security/ssl-analyzer.ts

- 함수 1: analyzeSSL(hostname: string)
  - API: https://api.ssllabs.com/api/v3/analyze?host={hostname}&fromCache=on&maxAge=24
  - fromCache=on으로 캐시된 결과 먼저 시도 (빠름)
  - 캐시 없으면 startNew=on으로 분석 시작 → 5초 간격 폴링 (최대 24회 = 120초)
  - 반환: { grade: string, expiryDate: string, protocol: string } | null
  - 실패/타임아웃 시 null 반환

- 함수 2: analyzeSecurityHeaders(url: string)
  - API: https://http-observatory.security.mozilla.org/api/v2/analyze?host={hostname}
  - POST로 스캔 시작 → GET으로 결과 조회
  - 반환: { grade: string, score: number, missingHeaders: string[] } | null
  - timeout: 30초

#### 2단계: 타입 추가

- src/types/crawl.ts에 추가:

```typescript
interface SecurityAnalysis {
  sslGrade?: string
  sslExpiry?: string
  sslProtocol?: string
  headerGrade?: string
  headerScore?: number
  missingHeaders?: string[]
}
```

- CrawlResult에: securityAnalysis?: SecurityAnalysis

#### 3단계: 보안 스코어러 생성

- 파일: src/lib/scoring/security-scorer.ts
- 100점 만점:
  - SSL 등급 (40점): A+/A = 40, B = 25, C = 10, D/F = 0
  - SSL 프로토콜 (15점): TLS 1.3 = 15, TLS 1.2 = 10, 이하 = 0
  - 인증서 만료 (15점): 30일+ 남음 = 15, 7~30일 = 8, 7일 미만 = 0
  - 보안 헤더 (30점): Observatory 점수 비례 (score/100 \* 30)

#### 4단계: 테스트

- src/lib/security/**tests**/ssl-analyzer.test.ts
- src/lib/scoring/**tests**/security-scorer.test.ts
- API 모킹, 캐시 히트/미스 케이스, 타임아웃 케이스

### 완료 기준

- tsc → eslint → vitest run 전부 통과
- SSL Labs 캐시 히트 시 10초 이내
- API 실패 시 null 반환 (전체 중단 없음)
- PROGRESS.md 업데이트

```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Task 16: llms.txt 분석 + GEO 스코어러 강화
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```

PROGRESS.md와 docs/learnings.md를 먼저 읽어줘.

## Task 16: llms.txt 파서 추가 + GEO 스코어러 10항목 확장

### 배경

llms.txt는 AI가 사이트를 이해하도록 돕는 파일. robots.txt의 AI 버전.
GEO(Generative Engine Optimization)에서 핵심 차별화 요소.
현재 GEO 스코어러가 6항목인데, 10항목으로 확장하여 정밀도를 높임.

### 작업 내용

#### 1단계: llms.txt 파서

- 파일: src/lib/parsing/llmstxt-parser.ts
- 함수: parseLlmsTxt(baseUrl: string)
  - {baseUrl}/llms.txt 와 {baseUrl}/llms-full.txt 둘 다 fetch 시도
  - 순수 HTTP fetch (Firecrawl 불필요 — 정적 텍스트 파일)
  - timeout: 5초
  - 반환: { exists: boolean, content?: string, hasFullVersion?: boolean }
  - 404 시 { exists: false } (에러 아님)

- src/types/crawl.ts의 CrawlResult에 추가:
  - llmsTxt?: { exists: boolean; content?: string; hasFullVersion?: boolean }

#### 2단계: GEO 스코어러 10항목 확장

- 파일: src/lib/scoring/geo-scorer.ts 수정
- 현재 6항목 → 10항목, 총점 여전히 100점

변경 전 → 변경 후:

1. Schema.org 마크업: 30점 → 20점
2. 구조화된 데이터 (Product/Org/LocalBusiness): 20점 → 15점
3. FAQ Schema: 15점 → 10점
4. 콘텐츠 길이: 15점 → 10점 (⚠️ 계산 방식 변경: headings → markdownContent 또는 rawHtml 본문)
5. 이미지 alt 텍스트: 15점 → 10점
6. E-E-A-T 신호: 5점 → 5점

신규 추가: 7. llms.txt 존재: 15점 (exists=true → 15점, hasFullVersion=true → 보너스 없음 단 15점 내) 8. Canonical URL 설정: 5점 (metaTags.canonical 존재 → 5점) 9. Open Graph 완성도: 5점 (ogTitle + ogDescription + ogImage 3개 모두 → 5점, 2개 → 3점, 1개 → 1점, 0개 → 0점) 10. hreflang/다국어: 5점 (hreflang 태그 존재 → 5점, 없으면 0점 — html-parser에서 추가 추출 필요)

#### 3단계: html-parser.ts 소폭 확장

- hreflang 태그 추출 추가
- link[rel="alternate"][hreflang] 태그에서 hreflang 값 추출
- MetaTags 타입에 hreflang?: string[] 추가

#### 4단계: 콘텐츠 길이 계산 변경

- 현재: headings 텍스트만 합산 (매우 부정확)
- 변경: markdownContent가 있으면 그 길이 사용, 없으면 rawHtml에서 태그 제거한 텍스트 길이
- 기준: ≥1000자 = 10점, ≥500자 = 5점, <500자 = 0점

#### 5단계: 테스트 수정 + 추가

- src/lib/scoring/**tests**/geo-scorer.test.ts 전면 수정 (10항목 반영)
- src/lib/parsing/**tests**/llmstxt-parser.test.ts 신규
- 기존 GEO 점수 테스트는 새 배점에 맞게 수정

### 주의사항

- GEO 총점은 반드시 100점 만점 유지
- 10개 항목의 maxPoints 합 = 100 확인
- llms.txt가 없는 사이트(대부분)에서 에러 없이 0점 처리

### 완료 기준

- tsc → eslint → vitest run 전부 통과
- 10개 GEO 항목의 maxPoints 합 = 100
- PROGRESS.md 업데이트

```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Task 17: AI 분석기 고도화
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```

PROGRESS.md와 docs/learnings.md를 먼저 읽어줘.

## Task 17: Claude AI 분석기 v2 — 컨설팅펌급 분석 프롬프트

### 배경

현재 claude-analyzer.ts의 문제:

1. bodyText가 2000자로 제한 → 콘텐츠 분석 깊이 부족
2. industry가 하드코딩 'general' → 업종 맞춤 분석 불가
3. 추천사항 3개 → 컨설팅펌급 리포트에 부족
4. aiCitability(AI 인용 가능성) 분석 없음 → GEO 차별화 불가

### 작업 내용

#### 1단계: 입력 스키마 확장

- src/lib/ai/claude-analyzer.ts의 contentAnalysisInputSchema 수정:
  - bodyText: z.string().max(2000) → markdownContent: z.string().max(8000)
  - industry 필드: 기존 enum 유지하되 'general' 추가
  - 신규 필드: seoScore: z.number().optional(), geoScore: z.number().optional()
    (다른 스코어러 결과를 AI에게도 전달하여 종합 분석 가능)

#### 2단계: 시스템 프롬프트 v2

- 기존 프롬프트 교체:

```
당신은 McKinsey Digital 출신 시니어 마케팅 컨설턴트입니다.
고객 웹사이트의 콘텐츠를 분석하여 데이터 기반 진단 리포트를 작성합니다.

## 분석 프레임워크

1. 콘텐츠 품질 (0-100): 명확성, 전문성, 사용자 검색 의도 충족도
2. SEO 콘텐츠 적합성 (0-100): 키워드 자연스러운 배치, 검색 의도와 콘텐츠 매칭
3. E-E-A-T 신호 강도 (0-100): 전문성(Expertise), 경험(Experience), 권위(Authority), 신뢰(Trust)의 텍스트 내 증거
4. AI 인용 가능성 (0-100): ChatGPT/Gemini/Perplexity가 이 콘텐츠를 인용할 확률 — 구조화 정도, 팩트 기반 문장 비율, 인용하기 쉬운 형식
5. 경쟁 차별화 (0-100): 동일 업종 내 유사 사이트 대비 고유한 가치 제안
6. 종합 AI 점수 (0-100): 위 5개 점수의 가중 평균

7. Quick Win 추천 (최대 5개): 즉시 실행 가능한 개선사항
   - 각 항목에 action(무엇을), expectedEffect(예상 효과), difficulty(low/medium/high) 포함

8. 전략적 추천 (최대 3개): 중장기 투자가 필요한 전략

## 응답 규칙
- 반드시 JSON 형식으로만 응답
- 한국어로 추천사항 작성
- 구체적인 수치와 예시 포함 (예: "제목 태그를 50-60자로 줄이세요" ← 이런 수준)
- "좋습니다" 같은 모호한 표현 금지, 데이터 기반으로만 판단
```

#### 3단계: 응답 스키마 v2

```typescript
const analysisResponseSchemaV2 = z.object({
  contentQuality: z.number().min(0).max(100),
  seoContentFit: z.number().min(0).max(100),
  eeatStrength: z.number().min(0).max(100),
  aiCitability: z.number().min(0).max(100),
  competitiveDiff: z.number().min(0).max(100),
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

#### 4단계: 호출부 수정

- max_tokens: 1024 → 2048 (응답이 더 길어지므로)
- 온보딩에서 수집한 industry, company_size를 실제 전달
  (src/lib/diagnosis/orchestrator.ts에서 이 값을 넘겨받도록 인터페이스 수정)
- Firecrawl markdownContent가 있으면 사용, 없으면 기존 bodyText 폴백

#### 5단계: AiInsights 타입 확장

- src/lib/diagnosis/orchestrator.ts의 AiInsights 인터페이스 확장:

```typescript
interface AiInsights {
  contentQuality?: number
  seoContentFit?: number // 신규
  eeatStrength?: number // 신규
  aiCitability?: number // 신규
  competitiveDiff?: number // 신규
  keywordDensity?: number // deprecated → seoContentFit로 대체
  uniqueness?: number // deprecated → competitiveDiff로 대체
  recommendations?: string[] // deprecated → quickWins로 대체
  quickWins?: Array<{
    action: string
    expectedEffect: string
    difficulty: 'low' | 'medium' | 'high'
  }>
  strategicRecommendations?: string[]
}
```

#### 6단계: 테스트 수정

- src/lib/ai/**tests**/claude-analyzer.test.ts 수정
- 새 스키마로 모킹 데이터 업데이트
- 8000자 마크다운 입력 테스트
- 폴백(2000자) 테스트

### 완료 기준

- tsc → eslint → vitest run 전부 통과
- 새 프롬프트로 Claude API 호출 시 v2 스키마에 맞는 응답 반환
- PROGRESS.md 업데이트

```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Task 18: n8n 워크플로우 병렬 처리 재설계
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```

PROGRESS.md와 docs/learnings.md를 먼저 읽어줘.

## Task 18: n8n 워크플로우 병렬 처리 재설계

### 배경

현재 n8n/workflows/findably-crawl.json이 순차 실행으로 느림.
Task 13~16에서 추가된 Firecrawl, Google APIs, SSL Labs, llms.txt를 통합하고
3개 병렬 그룹으로 실행하여 속도를 최적화해야 함.

### 작업 내용

#### 1단계: n8n 워크플로우 JSON 재설계

- 파일: n8n/workflows/findably-crawl.json 교체
- docs/n8n-workflow.md 업데이트

#### 워크플로우 구조:

```
[Webhook 트리거]
  POST body: { url, company_id, industry, company_size, audit_id }
  Bearer 토큰 인증 (기존 유지)
  │
  ├── [Set Node] 변수 정리
  │   url, company_id, hostname(URL에서 추출), timestamp
  │
  ├── [SplitInBatches/Parallel] 3개 그룹 병렬 실행
  │
  │   ┌─ 그룹 A: 콘텐츠 수집 ──────────────────────────┐
  │   │  [HTTP Request] Firecrawl /scrape                │
  │   │    URL: https://api.firecrawl.dev/v1/scrape      │
  │   │    body: { url, formats: ['markdown','html'] }   │
  │   │    header: Authorization: Bearer {{FC_API_KEY}}   │
  │   │    timeout: 30초                                  │
  │   │    continueOnFail: true                          │
  │   │                                                   │
  │   │  [HTTP Request] Firecrawl /map                   │
  │   │    URL: https://api.firecrawl.dev/v1/map         │
  │   │    body: { url }                                  │
  │   │    timeout: 15초                                  │
  │   │    continueOnFail: true                          │
  │   └──────────────────────────────────────────────────┘
  │
  │   ┌─ 그룹 B: 성능 + 보안 ──────────────────────────┐
  │   │  [HTTP Request] PageSpeed Insights (mobile)      │
  │   │    URL: googleapis.com/pagespeedonline/v5/...    │
  │   │    params: strategy=mobile, key={{PSI_KEY}}      │
  │   │    timeout: 20초, continueOnFail: true           │
  │   │                                                   │
  │   │  [HTTP Request] PageSpeed Insights (desktop)     │
  │   │    같은 구조, strategy=desktop                    │
  │   │                                                   │
  │   │  [HTTP Request] SSL Labs                         │
  │   │    URL: api.ssllabs.com/api/v3/analyze           │
  │   │    params: host={{hostname}}, fromCache=on        │
  │   │    timeout: 15초 (캐시만 시도, 없으면 skip)       │
  │   │    continueOnFail: true                          │
  │   │                                                   │
  │   │  [HTTP Request] Mozilla Observatory              │
  │   │    URL: observatory.mozilla.org/api/v2/analyze   │
  │   │    timeout: 15초, continueOnFail: true           │
  │   └──────────────────────────────────────────────────┘
  │
  │   ┌─ 그룹 C: 기본 fetch ────────────────────────────┐
  │   │  [HTTP Request] robots.txt                       │
  │   │    URL: {{url}}/robots.txt                       │
  │   │    timeout: 5초, continueOnFail: true            │
  │   │                                                   │
  │   │  [HTTP Request] sitemap.xml                      │
  │   │    URL: {{url}}/sitemap.xml                      │
  │   │    timeout: 5초, continueOnFail: true            │
  │   │                                                   │
  │   │  [HTTP Request] llms.txt                         │
  │   │    URL: {{url}}/llms.txt                         │
  │   │    timeout: 5초, continueOnFail: true            │
  │   │                                                   │
  │   │  [HTTP Request] llms-full.txt                    │
  │   │    URL: {{url}}/llms-full.txt                    │
  │   │    timeout: 5초, continueOnFail: true            │
  │   └──────────────────────────────────────────────────┘
  │
  ├── [Merge Node] Wait for All — 3개 그룹 결과 통합
  │
  ├── [Code Node] 결과 정규화
  │   → 모든 결과를 CrawlResult 구조로 변환
  │   → 각 API 실패 시 해당 필드 null (부분 실패 허용)
  │   → dataCompleteness 계산 (성공 소스 수 / 전체 소스 수 * 100)
  │
  ├── [HTTP Request] Supabase에 저장
  │   → POST /rest/v1/crawl_results
  │   → apikey + Authorization 헤더
  │
  └── [HTTP Request] Next.js 콜백
      → POST {{NEXTJS_URL}}/api/crawl/complete
      → body: { audit_id, crawl_result_id, status, dataCompleteness }
      → Bearer 토큰 인증
```

#### 2단계: docs/n8n-workflow.md 업데이트

- 워크플로우 구조 설명
- 환경변수 목록 (n8n Credentials에 설정):
  - FIRECRAWL_API_KEY
  - GOOGLE_PAGESPEED_API_KEY
  - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
  - NEXTJS_CALLBACK_URL
  - N8N_WEBHOOK_AUTH_TOKEN

#### 3단계: 콜백 API 라우트 수정

- src/app/api/crawl/complete/route.ts 수정
  - 받은 crawl_result_id로 DB에서 크롤링 결과 조회
  - 진단 오케스트레이터 트리거 (Task 19에서 확장)
  - dataCompleteness 값도 받아서 진단에 전달

### 주의사항

- n8n 워크플로우 JSON은 직접 n8n에서 만든 후 export하는 게 정확함
  → 여기서는 구조 설계 문서(docs/n8n-workflow.md)를 업데이트하고
  → JSON은 기본 골격만 생성 (n8n에서 import 후 미세 조정)
- 모든 HTTP Request 노드에 continueOnFail: true 필수
- 전체 워크플로우 타임아웃: 180초

### 완료 기준

- docs/n8n-workflow.md 업데이트 완료
- n8n/workflows/findably-crawl-v2.json 생성
- 콜백 API 라우트 수정
- tsc → eslint → vitest run 통과
- PROGRESS.md 업데이트

```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Task 19: 진단 오케스트레이터 통합 + 리포트 품질 극대화
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```

PROGRESS.md와 docs/learnings.md를 먼저 읽어줘.

## Task 19: 진단 오케스트레이터 v2 — 전체 통합 + 데이터 완성도 추적

### 배경

Task 13~18에서 추가된 모든 데이터 소스를 오케스트레이터에 통합.
확장된 CrawlResult → 5개 스코어러 → AI 분석 v2 → 종합 리포트.
핵심: 부분 실패 시에도 리포트 품질을 최대한 유지하는 것.

### 작업 내용

#### 1단계: 오케스트레이터 입력 확장

- src/lib/diagnosis/orchestrator.ts의 DiagnosisOrchestratorInput 수정:

```typescript
interface DiagnosisOrchestratorInput {
  crawlResult: CrawlResult // 확장된 타입 (Task 13~16 필드 포함)
  companyId: number
  crawlResultId: number
  industry: string // 온보딩에서 수집 (신규)
  companySize: string // 온보딩에서 수집 (신규)
  dataCompleteness: number // n8n에서 계산 (신규)
}
```

#### 2단계: 실행 흐름 v2

```
1. [동기 병렬] 4개 스코어러 실행
   - SEO 점수 (calculateSeoScore) — 기존 유지
   - GEO 점수 (calculateGeoScore) — Task 16에서 10항목으로 확장됨
   - 성능 점수 (calculatePerformanceScore) — Task 14에서 CrUX 기반으로 변경됨
   - 보안 점수 (calculateSecurityScore) — Task 15에서 신규 추가됨

2. [비동기] Claude AI 분석 v2
   - Task 17의 확장된 프롬프트 사용
   - markdownContent (8000자) 전달
   - industry, companySize 전달
   - seoScore, geoScore도 전달 (AI가 종합 맥락 파악)
   - 실패 시 기존 패턴대로 null 처리

3. 종합 점수 집계 — 가중치 v2:
   SEO(20%) + GEO(25%) + Performance(20%) + AI(25%) + Security(10%)
   → AI 실패 시: SEO(25%) + GEO(30%) + Performance(25%) + Security(20%)

4. Quick Win 통합
   - 기존 identifyQuickWins(crawlResult) 결과 +
   - AI v2의 quickWins 결과를 병합
   - 중복 제거 후 impact=high & difficulty=low 우선 정렬

5. dataCompleteness 기반 리포트 신뢰도 표시
   - 100%: "전체 데이터 기반 분석"
   - 70-99%: "일부 데이터 수집 불가 — 해당 항목 제외하고 분석"
   - <70%: "데이터 부족 — 재분석을 권장합니다"
```

#### 3단계: DiagnosisDataSuccess 확장

```typescript
interface DiagnosisDataSuccess {
  // 점수
  seoScore: number
  geoScore: number
  performanceScore: number
  securityScore: number // 신규
  aiScore: number | null
  overallScore: number
  grade: Grade

  // 상세
  seoDetails: SeoScoreDetail[]
  geoDetails: GeoScoreDetail[]
  performanceDetails: Array<{
    item: string
    value: string
    status: 'good' | 'needs-improvement' | 'poor'
  }>
  securityDetails: Array<{
    item: string
    points: number
    maxPoints: number
    status: string
  }>

  // AI 인사이트
  aiInsights: AiInsights | null // v2 확장 타입
  aiUnavailable: boolean

  // Quick Wins (통합)
  quickWins: Array<{
    action: string
    expectedEffect: string
    difficulty: 'low' | 'medium' | 'high'
    impact: 'high' | 'medium' | 'low'
    source: 'rule' | 'ai' // 룰 기반 vs AI 기반
  }>
  strategicRecommendations: string[]

  // 메타
  diagnosedAt: Date
  dataCompleteness: number
  llmsTxtExists: boolean
  cruxAvailable: boolean
  reportReliability: 'high' | 'medium' | 'low'
}
```

#### 4단계: score-aggregator.ts 수정

- 기존: 4개 점수 입력
- 변경: 5개 점수 입력 (securityScore 추가)
- 가중치 로직 추가 (AI 실패 시 재분배)

#### 5단계: 테스트 수정

- src/lib/diagnosis/**tests**/orchestrator.test.ts 전면 수정
- 시나리오:
  1. 전체 데이터 성공 (dataCompleteness=100)
  2. Firecrawl 실패 + 나머지 성공 (polllback)
  3. CrUX 데이터 없음 (소규모 사이트)
  4. AI 분석 실패
  5. SSL Labs 타임아웃
  6. 3개 소스 동시 실패 (dataCompleteness=70)
- score-aggregator 테스트도 5개 점수 체계로 수정

### 완료 기준

- tsc → eslint → build → vitest run 전부 통과
- 모든 실패 시나리오에서 리포트 생성 (부분 리포트)
- 전체 통합 테스트: CrawlResult → Orchestrator → DiagnosisDataSuccess 파이프라인
- PROGRESS.md 업데이트
- docs/learnings.md에 이번 Epic 교훈 기록

```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 모든 Task 완료 후 최종 검증
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```

PROGRESS.md와 docs/learnings.md를 먼저 읽어줘.

## 최종 통합 검증 — Task 13~19 전체

### 검증 항목

1. 빌드 검증
   - tsc --noEmit → 0 errors
   - eslint → 0 errors
   - pnpm build → 성공
   - vitest run → 전체 통과

2. 타입 검증
   - CrawlResult 타입에 모든 신규 필드 존재
   - DiagnosisDataSuccess에 모든 신규 필드 존재
   - any 타입 사용 0건

3. 에러 복원력 검증
   - 각 외부 API별 실패 시나리오 테스트
   - 3개 이상 API 동시 실패해도 리포트 생성
   - dataCompleteness가 정확하게 계산되는지

4. 환경변수 검증
   - FIRECRAWL_API_KEY
   - GOOGLE_PAGESPEED_API_KEY
   - 기존 환경변수 모두 유지

5. 문서 업데이트 확인
   - PROGRESS.md — Task 13~19 완료 기록
   - docs/learnings.md — 교훈 기록
   - docs/architecture.md — ADR-003 업데이트 (Firecrawl 추가)
   - docs/n8n-workflow.md — 병렬 워크플로우 반영

6. PROGRESS.md 다음 할 일 업데이트:
   → v2 기능: 경쟁사 벤치마킹, AI 가시성 실시간 추적, 주간 자동 재크롤링

```

```
