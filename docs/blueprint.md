# Epic 3 — 4-Layer 크롤링 엔진

## 목표

URL 입력 후 자동으로 4단계 데이터 수집 → `diagnoses.crawl_data` JSONB에 저장.
Epic 4(진단 엔진)의 입력 데이터를 생산하는 파이프라인 완성.

완료 시: `pending → crawling → analyzing → completed` 상태 머신이 작동하고,
Layer 1~3 크롤링 데이터가 `crawl_data` 컬럼에 구조화된 JSON으로 저장됨.

---

## 아키텍처 결정

### n8n + Next.js 하이브리드 실행

| 실행 환경                 | 역할                                  | 이유                                      |
| ------------------------- | ------------------------------------- | ----------------------------------------- |
| **n8n (Elest.io)**        | Playwright 크롤링 (Layer 1)           | Vercel 10초 타임아웃, Playwright 바이너리 |
| **Next.js API Route**     | Google API/보안 도구 호출 (Layer 2~3) | 경량 HTTP 요청, Vercel Edge 적합          |
| **Next.js Server Action** | 트리거 + 상태 폴링                    | 사용자 인터랙션 담당                      |

```
[사용자] URL 입력
  → submitUrlAction (Server Action)
  → diagnoses INSERT (status: 'pending')
  → POST /api/crawl/trigger (fire-and-forget)
  → n8n Webhook 호출
      → Playwright 크롤링 (Layer 1)
      → n8n → POST /api/crawl/callback (결과 저장)
          → Layer 2~3 API 호출
          → crawl_data UPDATE
          → status: 'crawling' → 'analyzing'
  → AnalyzingScreen 폴링으로 완료 감지
  → /dashboard 이동
```

### 상태 머신

```
pending ──→ crawling ──→ analyzing ──→ completed
   │            │            │
   └────────────┴────────────┴──→ failed
```

| 전이                  | 트리거                       | 실행자                      |
| --------------------- | ---------------------------- | --------------------------- |
| pending → crawling    | n8n 크롤링 시작              | service_role (n8n callback) |
| crawling → analyzing  | Layer 1 완료, Layer 2~3 시작 | service_role (callback)     |
| analyzing → completed | 모든 Layer 완료              | service_role (callback)     |
| \* → failed           | 에러 발생                    | service_role (callback)     |

> 클라이언트 RLS에 UPDATE 없음 — 모든 상태 전이는 `service_role`만 가능 (보안)

---

## 4-Layer 상세

### Layer 1: 직접 크롤링 (n8n + Playwright) — 비용 0원

| 수집 항목      | 설명                                           |
| -------------- | ---------------------------------------------- |
| HTML 메타      | title, description, canonical, og:_, twitter:_ |
| H 태그 구조    | H1~H6 텍스트 + 위계                            |
| Schema Markup  | JSON-LD, Microdata 파싱                        |
| 내부/외부 링크 | href, 깨진 링크 감지                           |
| 이미지         | src, alt 유무, 크기                            |
| robots.txt     | AI 봇 14개 차단 여부                           |
| sitemap.xml    | 존재 여부, URL 수                              |
| llms.txt       | AI 크롤러용 요약 존재 여부                     |
| CMS 감지       | WordPress, Shopify 등                          |
| 모바일         | viewport 375px 렌더링                          |

### Layer 2: Google 무료 API 4종 — 비용 0원

| API                | 수집 항목                  |
| ------------------ | -------------------------- |
| PageSpeed Insights | LCP, FID, CLS, 속도 점수   |
| CrUX               | 실사용자 경험 데이터       |
| Safe Browsing      | 악성 사이트 여부           |
| Search Console     | 연동 시 — 검색 노출 데이터 |

### Layer 3: 오픈소스 도구 — 비용 0원

| 도구                | 수집 항목         |
| ------------------- | ----------------- |
| SSL Labs            | 인증서 등급 (A~F) |
| Mozilla Observatory | 보안 헤더 점수    |

### Layer 4: 유료 API (Phase 2) — 사용량 비례

- Moz Free (MVP~): DA/PA 점수
- DataForSEO (100명+): 키워드/백링크
- Ahrefs (500명+): 상세 SEO 메트릭

---

## crawl_data JSONB 구조

`diagnoses.crawl_data` 컬럼에 저장되는 타입:

```ts
interface CrawlData {
  version: '1.0'
  crawled_at: string // ISO 8601
  duration_ms: number // 총 크롤링 소요 시간

  // Layer 1: Playwright 직접 크롤링
  layer1: {
    meta: {
      title: string | null
      description: string | null
      canonical: string | null
      og: Record<string, string> // og:title, og:image 등
      twitter: Record<string, string>
    }
    headings: Array<{ level: number; text: string }>
    schema_markup: unknown[] // JSON-LD 원본
    links: {
      internal: Array<{ href: string; text: string; status?: number }>
      external: Array<{ href: string; text: string; status?: number }>
      broken: Array<{ href: string; status: number }>
    }
    images: Array<{
      src: string
      alt: string | null
      width?: number
      height?: number
    }>
    html_size_bytes: number
    word_count: number
    language: string | null
  }

  // robots.txt 분석
  robots_txt: {
    exists: boolean
    raw?: string
    ai_bots: Array<{
      name: string // 'GPTBot' | 'ClaudeBot' | 'PerplexityBot' 등 14개
      allowed: boolean
    }>
    sitemap_urls: string[]
  }

  // sitemap.xml 분석
  sitemap: {
    exists: boolean
    url_count: number
    urls_sample: string[] // 최대 10개 샘플
  }

  // llms.txt
  llms_txt: {
    exists: boolean
    content?: string
  }

  // CMS 감지
  cms: {
    detected: string | null // 'wordpress' | 'shopify' | 'wix' 등
    version?: string
    technologies: string[] // Wappalyzer 결과
  }

  // 모바일 크롤링
  mobile: {
    viewport_meta: boolean
    responsive: boolean
    touch_targets_ok: boolean
    font_size_ok: boolean
    screenshot_path?: string
  }

  // Layer 2: Google API
  layer2: {
    pagespeed?: {
      performance_score: number
      lcp_ms: number
      fid_ms: number
      cls: number
      fcp_ms: number
      ttfb_ms: number
    }
    crux?: {
      lcp_p75: number
      fid_p75: number
      cls_p75: number
      origin_summary: boolean
    }
    safe_browsing?: {
      safe: boolean
      threats: string[]
    }
  }

  // Layer 3: 오픈소스 도구
  layer3: {
    ssl?: {
      grade: string // 'A+' ~ 'F'
      valid: boolean
      issuer: string
      expires_at: string
    }
    security_headers?: {
      score: number // 0-100
      headers_present: string[]
      headers_missing: string[]
    }
  }
}
```

---

## 비정상 행동 카탈로그

### 카테고리 1: 입력 공격

| 시나리오                          | 위험                | 대응                                                          |
| --------------------------------- | ------------------- | ------------------------------------------------------------- |
| SSRF (내부 IP 접근)               | 🔴 서버 내부 접근   | URL 보안 검증: 사설 IP, localhost, 메타데이터 엔드포인트 차단 |
| 초장문 URL (>2048)                | 🟡 리소스 낭비      | Zod `.max(2048)`                                              |
| 비HTTP 프로토콜 (ftp://, file://) | 🔴 파일 시스템 접근 | `.refine(startsWith http)` 이미 있음                          |
| 동일 URL 폭탄 (1000회 제출)       | 🟡 리소스 고갈      | Rate limiting (Phase 2) + n8n 큐                              |
| 유니코드 공격 (IDN homograph)     | 🟡 피싱 사이트 진단 | URL 정규화 후 저장                                            |

### 카테고리 2: 크롤링 공격

| 시나리오                           | 위험           | 대응                                          |
| ---------------------------------- | -------------- | --------------------------------------------- |
| 타겟 사이트 무한 리다이렉트        | 🟡 크롤러 멈춤 | 최대 리다이렉트 5회 제한                      |
| 타겟 사이트 거대 응답 (100MB HTML) | 🟡 메모리 폭발 | 최대 응답 크기 10MB 제한                      |
| 타겟 사이트 응답 없음              | 🟡 타임아웃    | 30초 타임아웃                                 |
| 타겟 사이트 HTTP 401/403           | 🟢 정상 에러   | 접근 불가 안내 + 가능한 Layer 2~3만 실행      |
| robots.txt 전체 차단               | 🟢 크롤링 불가 | 대체 데이터(PageSpeed, SSL 등 ~60%) + 안내 UI |

### 카테고리 3: 폴링 공격

| 시나리오                 | 위험           | 대응                            |
| ------------------------ | -------------- | ------------------------------- |
| 다른 사용자 진단 ID 조회 | 🔴 데이터 탈취 | RLS + `user_id` 이중 검증       |
| diagnosisId 무작위 대입  | 🟡 불필요 쿼리 | UUID v4 (추측 불가) + RLS       |
| 폴링 간격 0ms 설정       | 🟡 서버 부하   | 서버 측 rate limiting (Phase 2) |

### 카테고리 4: 데이터 무결성

| 시나리오               | 위험            | 대응                                       |
| ---------------------- | --------------- | ------------------------------------------ |
| n8n 콜백 위조          | 🔴 데이터 변조  | `X-Webhook-Secret` 검증                    |
| 중복 콜백 (n8n 재시도) | 🟡 데이터 중복  | 멱등성: `status` 확인 후 UPDATE            |
| 콜백 누락 (n8n 장애)   | 🟡 영구 pending | 30분 타임아웃 → failed 전환 (Phase 2 cron) |

---

## 환경변수

```
# n8n 연동
N8N_WEBHOOK_URL=https://n8n.jayden.example/webhook/findably-crawl
N8N_WEBHOOK_SECRET=<random-32-char>

# Google API
GOOGLE_API_KEY=<google-cloud-api-key>

# Supabase (기존)
SUPABASE_SERVICE_ROLE_KEY=<already-exists>
```

---

## Task 분해 (11개, 6 Phase)

### Phase 1: 기반 (Task 3.1)

**Task 3.1: 크롤링 모듈 스캐폴드 + URL 보안 + 트리거**

| 파일                                                     | 상태 | 설명                             |
| -------------------------------------------------------- | ---- | -------------------------------- |
| `features/crawling/types.ts`                             | 신규 | CrawlData, CrawlResult 타입      |
| `features/crawling/constants.ts`                         | 신규 | 타임아웃, IP 블록리스트, 봇 목록 |
| `features/crawling/schemas.ts`                           | 신규 | CrawlRequestSchema (Zod)         |
| `features/crawling/utils/url-security.ts`                | 신규 | SSRF 방어 유틸                   |
| `features/crawling/index.ts`                             | 신규 | 공개 인터페이스                  |
| `config/crawling.ts`                                     | 신규 | 크롤링 설정 외부화               |
| `lib/adapters/crawler.ts`                                | 신규 | n8n 웹훅 트리거 어댑터           |
| `app/api/crawl/trigger/route.ts`                         | 신규 | 트리거 API (인증 + n8n 호출)     |
| `onboarding/schemas.ts`                                  | 수정 | SSRF 검증 + max 2048 추가        |
| `onboarding/actions/submit-url.ts`                       | 수정 | triggerCrawl() 호출 추가         |
| `features/crawling/utils/__tests__/url-security.test.ts` | 신규 | 15+ 테스트                       |

> 상세: `docs/blueprint-task-3.1.md` 참조

### Phase 2: Layer 1 — Playwright 크롤링 (Task 3.2~3.5)

**Task 3.2: robots.txt 파싱 + AI 봇 14개 체크**

| 파일                                                     | 상태 | 설명                             |
| -------------------------------------------------------- | ---- | -------------------------------- |
| `features/crawling/parsers/robots-txt.ts`                | 신규 | robots.txt 파싱 + 봇별 차단 판정 |
| `features/crawling/parsers/__tests__/robots-txt.test.ts` | 신규 | 파싱 테스트 (다양한 형식)        |

- AI 봇 목록: GPTBot, ChatGPT-User, ClaudeBot, Claude-Web, PerplexityBot, Bytespider, GoogleOther, Bingbot, Applebot, Meta-ExternalAgent, Amazonbot, anthropic-ai, cohere-ai, FacebookBot
- 차단 시 `robots_txt.ai_bots[].allowed = false` 기록

**Task 3.3: sitemap.xml + llms.txt 파싱**

| 파일                                    | 상태 | 설명                      |
| --------------------------------------- | ---- | ------------------------- |
| `features/crawling/parsers/sitemap.ts`  | 신규 | sitemap.xml 파싱          |
| `features/crawling/parsers/llms-txt.ts` | 신규 | llms.txt 존재 확인 + 파싱 |

**Task 3.4: CMS 감지**

| 파일                                 | 상태 | 설명                           |
| ------------------------------------ | ---- | ------------------------------ |
| `features/crawling/detectors/cms.ts` | 신규 | HTML 패턴 + 메타 기반 CMS 감지 |
| `config/cms-signatures.ts`           | 신규 | CMS별 시그니처 정의            |

- WordPress, Shopify, Wix, Squarespace, Webflow, Next.js, Gatsby 등
- Wappalyzer 오픈소스 시그니처 참고

**Task 3.5: 모바일 크롤링 (375px)**

| 파일                                    | 상태 | 설명                                |
| --------------------------------------- | ---- | ----------------------------------- |
| `features/crawling/analyzers/mobile.ts` | 신규 | viewport, 터치 타겟, 폰트 크기 검사 |

- n8n에서 Playwright viewport 375x812로 별도 크롤링
- viewport meta, 반응형 여부, 터치 타겟(44x44px), 폰트 크기(16px+) 검사

### Phase 3: Layer 2 — Google API (Task 3.6~3.8)

**Task 3.6: PageSpeed Insights API**

| 파일                                  | 상태 | 설명                     |
| ------------------------------------- | ---- | ------------------------ |
| `features/crawling/apis/pagespeed.ts` | 신규 | PSI API 호출 + 결과 파싱 |
| `lib/adapters/google.ts`              | 신규 | Google API 공통 어댑터   |

- `GOOGLE_API_KEY` 환경변수 사용
- LCP, FID, CLS, FCP, TTFB 수집

**Task 3.7: CrUX API**

| 파일                             | 상태 | 설명          |
| -------------------------------- | ---- | ------------- |
| `features/crawling/apis/crux.ts` | 신규 | CrUX API 호출 |

- 실사용자 경험 데이터 (트래픽 부족 시 null 허용)
- PageSpeed와 Google 어댑터 공유

**Task 3.8: Safe Browsing API**

| 파일                                      | 상태 | 설명                     |
| ----------------------------------------- | ---- | ------------------------ |
| `features/crawling/apis/safe-browsing.ts` | 신규 | Safe Browsing Lookup API |

- 악성/피싱/원치않는 SW 여부

### Phase 4: Layer 3 — 오픈소스 도구 (Task 3.9)

**Task 3.9: SSL Labs + Mozilla Observatory**

| 파일                                         | 상태 | 설명                    |
| -------------------------------------------- | ---- | ----------------------- |
| `features/crawling/apis/ssl-labs.ts`         | 신규 | SSL Labs API            |
| `features/crawling/apis/security-headers.ts` | 신규 | Mozilla Observatory API |

- SSL 등급(A+~F), 인증서 정보
- 보안 헤더 점수, 누락 헤더 목록

### Phase 5: 통합 (Task 3.10)

**Task 3.10: 크롤링 결과 → Supabase 저장 + 콜백 API**

| 파일                                            | 상태 | 설명                           |
| ----------------------------------------------- | ---- | ------------------------------ |
| `app/api/crawl/callback/route.ts`               | 신규 | n8n → Next.js 콜백 (결과 저장) |
| `features/crawling/services/save-crawl-data.ts` | 신규 | crawl_data 조합 + UPDATE       |

- n8n에서 Layer 1 완료 → POST `/api/crawl/callback`
- `X-Webhook-Secret` 검증 → `service_role`로 `crawl_data` UPDATE
- Layer 2~3은 콜백 내에서 순차 호출 (Google API + SSL)
- 모든 Layer 완료 → `status: 'analyzing'` 전환

### Phase 6: 차단 대응 (Task 3.11)

**Task 3.11: robots.txt 차단 시 대체 데이터 + 안내 UI**

| 파일                                           | 상태 | 설명                              |
| ---------------------------------------------- | ---- | --------------------------------- |
| `features/crawling/services/fallback-crawl.ts` | 신규 | 차단 시 Layer 2~3만 실행          |
| 대시보드 배너 컴포넌트                         | 신규 | "일부 항목이 제한되었습니다" 안내 |

- robots.txt 차단 감지 → Layer 1 스킵 → Layer 2~3만 수집 (~60%)
- `crawl_data` 에 `restricted: true` 플래그
- 대시보드에 안내 배너 + GSC 연동 유도 (Phase 2)

---

## n8n 워크플로우 설계 (참고)

```
[Webhook 수신] diagnosisId, url
  → [HTTP Request] robots.txt 확인
  → [IF] 차단됨?
      → Yes: POST callback (restricted: true, Layer 1 스킵)
      → No:
        → [Playwright] HTML 크롤링 (데스크톱)
        → [Playwright] HTML 크롤링 (모바일 375px)
        → [Code] 메타/링크/이미지/Schema 파싱
        → [Code] CMS 감지
        → [HTTP Request] sitemap.xml 파싱
        → [HTTP Request] llms.txt 확인
        → POST callback (Layer 1 결과)
```

n8n은 Task 3.10에서 연동 테스트. 워크플로우 구축은 n8n UI에서 수동.

---

## 리스크

| 리스크                 | 영향                   | 대응                                         |
| ---------------------- | ---------------------- | -------------------------------------------- |
| Vercel 10초 타임아웃   | Layer 2~3 API 타임아웃 | 개별 API 5초 타임아웃 + 실패 시 skip         |
| n8n 서버 다운          | 크롤링 불가            | fire-and-forget + pending 유지 + 재시도 안내 |
| Google API 할당량 초과 | Layer 2 데이터 없음    | graceful skip + null 허용                    |
| 타겟 사이트 응답 없음  | Layer 1 실패           | 30초 타임아웃 → Layer 2~3만 실행             |
| SSRF 우회              | 🔴 내부 네트워크 접근  | DNS rebinding 방어는 Phase 2, 현재 IP 검증만 |
| 콜백 시크릿 유출       | 🔴 데이터 변조         | 환경변수 관리 + 시크릿 로테이션              |
| crawl_data JSONB 크기  | 인덱스 성능 저하       | 이미지/링크 최대 100개 제한                  |

---

## 스코프 외 (하지 않을 것)

- 진단 엔진 (룰 기반 점수) → Epic 4
- AI 상세 분석 (5-Agent) → Epic 5
- 경쟁사 크롤링 → Epic 6
- Rate limiting → Phase 2
- DNS rebinding 방어 → Phase 2
- Layer 4 유료 API → Phase 2
- 중복 URL 체크 → Phase 2
- GSC 연동 → Phase 2

---

## 구현 순서 (권장)

```
Task 3.1  → 스캐폴드 + URL 보안 + 트리거     (기반)
Task 3.2  → robots.txt 파싱                    (Layer 1 시작)
Task 3.3  → sitemap + llms.txt 파싱
Task 3.4  → CMS 감지
Task 3.5  → 모바일 크롤링
Task 3.6  → PageSpeed Insights API              (Layer 2 시작)
Task 3.7  → CrUX API
Task 3.8  → Safe Browsing API
Task 3.9  → SSL Labs + Security Headers         (Layer 3)
Task 3.10 → 콜백 API + 결과 통합 저장           (통합)
Task 3.11 → robots.txt 차단 대응                (엣지 케이스)
```

---

## 검증 방법

1. `pnpm tsc --noEmit` — 타입 에러 0
2. `pnpm lint` — 에러 0
3. `pnpm build` — 빌드 성공
4. `pnpm test` — 단위 테스트 통과
5. Task 3.10 완료 후: URL 입력 → n8n 크롤링 → 콜백 → crawl_data 저장 → AnalyzingScreen 완료 감지 E2E 확인
6. SSRF 테스트: `http://127.0.0.1`, `http://169.254.169.254` 등 차단 확인
7. Supabase: `diagnoses` 테이블에 `crawl_data` JSONB 저장 확인
