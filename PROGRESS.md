# Findably — 진행상황 문서

> **이 파일을 세션 시작 시 첫 번째로 읽으면 100% 이어서 작업 가능**
> 최종 업데이트: 2026-03-23

---

## 📌 프로젝트 개요

| 항목                  | 내용                                            |
| --------------------- | ----------------------------------------------- |
| **프로젝트명**        | Findably                                        |
| **목적**              | URL 하나로 SEO+GEO 통합 진단 AI SaaS            |
| **기술 스택**         | Next.js 15 + Supabase + Tailwind v4 + shadcn/ui |
| **보안 분류**         | 🔴 결제(billing) / 🟡 나머지                    |
| **과금 모델**         | 건당 9.9만원 (Phase 1)                          |
| **Supabase 프로젝트** | chatsio-v1 공유 (ID: souqwsdwabhqbbvpwfpe)      |
| **개발 포트**         | 3600                                            |

---

## ✅ 완료된 작업

### STEP 1~6 (설계)

- [x] PRD v3.0 작성 (건당 과금 모델, 19개 섹션)
- [x] Next.js 15 프로젝트 초기화
- [x] v6.4 스캐폴드 (폴더 구조 + config + adapters + shared)
- [x] shadcn/ui 초기화 + 기본 컴포넌트
- [x] CLAUDE.md / PROGRESS.md / plan.md Findably 맞춤 세팅
- [x] docs/design-system.md (토큰, 타이포, Anti-AI-Slop)
- [x] IA 설계 3개 문서 (ia-sitemap, ia-navigation, ia-userflows)
- [x] docs/spec.md (랜딩 9섹션 + 페이지 명세 + API + DB + 에러 매트릭스)

### Epic 1: 프로젝트 셋업 ✅

| Task | 설명                                                             | 상태    |
| ---- | ---------------------------------------------------------------- | ------- |
| 1.1  | Next.js 15 + Supabase + shadcn/ui 초기화                         | ✅ 완료 |
| 1.2  | features/ 모듈 구조 + registry + adapters/                       | ✅ 완료 |
| 1.3  | Supabase Auth (이메일 + Google)                                  | ✅ 완료 |
| 1.4  | DB 스키마 (5개 테이블 + RLS + 타입)                              | ✅ 완료 |
| 1.5  | GNB + 라우팅 + 레이아웃                                          | ✅ 완료 |
| 1.6  | config/ (점수, 접근제어, 메뉴, SEO)                              | ✅ 완료 |
| 1.7  | 공통 컴포넌트 (ErrorBoundary, Skeleton, EmptyState, BlurOverlay) | ✅ 완료 |
| 1.8  | SEO 기반 (metadata, JSON-LD, sitemap, robots.txt, llms.txt)      | ✅ 완료 |
| 1.9  | Sentry + CI/CD                                                   | ✅ 완료 |

### Epic 2: 온보딩 ✅

| Task | 설명                        | 상태    |
| ---- | --------------------------- | ------- |
| 2.1  | 랜딩 페이지 7섹션 + SEO     | ✅ 완료 |
| 2.2  | 회원가입/로그인 디자인 보완 | ✅ 완료 |
| 2.3  | URL 입력 + 선택 정보 폼     | ✅ 완료 |
| 2.4  | 분석 대기 화면              | ✅ 완료 |

### Epic 3: 4-Layer 크롤링 엔진 ✅

| Task | 설명                                     | 상태    | 커밋      |
| ---- | ---------------------------------------- | ------- | --------- |
| 3.1  | 크롤링 인프라 (타입/상수/스키마/URL보안) | ✅ 완료 | `3a010f6` |
| 3.2  | robots.txt 파싱 (AI 봇 14개)             | ✅ 완료 | `825a0ab` |
| 3.3  | sitemap.xml + llms.txt 파서              | ✅ 완료 | `f898950` |
| 3.4  | CMS 감지 (15개 CMS/프레임워크)           | ✅ 완료 | `91045a7` |
| 3.5  | 모바일 크롤링 (viewport/터치 분석)       | ✅ 완료 | `ce4e423` |
| 3.6  | PageSpeed Insights API                   | ✅ 완료 | `214e296` |
| 3.7  | CrUX API (실제 사용자 필드 데이터)       | ✅ 완료 | `89794ec` |
| 3.8  | Safe Browsing API (URL 위협 검사)        | ✅ 완료 | 커밋 대기 |
| 3.9  | SSL Labs + Mozilla Observatory           | ✅ 완료 | 커밋 대기 |
| 3.10 | 크롤링 결과 → Supabase 저장              | ✅ 완료 | `dcc474f` |
| 3.11 | robots.txt 차단 시 대시보드 안내 UI      | ✅ 완료 | 커밋 대기 |

---

## 📦 Epic 3 크롤링 주요 파일

### 공통 인프라 (3.1)

- `src/features/crawling/types.ts` — CrawlData, Layer1~3Data 전체 타입
- `src/features/crawling/constants.ts` — AI_BOT_LIST, 타임아웃, UA 등 상수
- `src/features/crawling/schemas.ts` — Zod 스키마 (crawlDataSchema)
- `src/features/crawling/index.ts` — 공개 인터페이스 (re-export)
- `src/shared/utils/url-security.ts` — URL 보안 검증 (SSRF 방어)
- `src/config/crawling.ts` — googleApiKey 등 외부 설정

### 파서 (3.2~3.5) — parsers/ (순수 함수, 네트워크 호출 없음)

- `src/features/crawling/parsers/robots-txt.ts` — parseRobotsTxt
- `src/features/crawling/parsers/sitemap.ts` — parseSitemap
- `src/features/crawling/parsers/llms-txt.ts` — parseLlmsTxt
- `src/features/crawling/parsers/cms.ts` — detectCms (15개 CMS 정규식)
- `src/features/crawling/parsers/mobile.ts` — checkMobile (viewport+터치)

### 페처 (3.6~3.9) — fetchers/ (외부 API 호출)

- `src/features/crawling/fetchers/pagespeed.ts` — fetchPageSpeed (Google PSI v5)
  - 30초 AbortController 타임아웃
  - API 키 없으면 null 반환 (graceful)
  - 방어적 파싱: 필드 누락 시 null
- `src/features/crawling/fetchers/crux.ts` — fetchCrux (CrUX API v1)
  - POST origin 기반 쿼리 (28일 rolling p75)
  - 15초 AbortController 타임아웃
  - LCP/INP/CLS/TTFB/FCP 수집, CLS 문자열→숫자 변환
  - 404 = 트래픽 부족 (정상 null 반환, 에러 로깅 안 함)
- `src/features/crawling/fetchers/safe-browsing.ts` — fetchSafeBrowsing (Google v4)
  - POST 요청, 4종 위협 타입 (MALWARE 등) 검사
  - 10초 AbortController 타임아웃, API 키 필수
  - is_safe + threats[] 반환, 빈 응답 = 안전
- `src/features/crawling/fetchers/ssl-labs.ts` — fetchSslLabs (SSL Labs API v3)
  - GET 캐시 우선 (fromCache=on, maxAge=72h)
  - status=READY만 사용 (폴링 안 함)
  - grade + valid + expires_at + issuer 추출
- `src/features/crawling/fetchers/observatory.ts` — fetchObservatory (Mozilla Observatory v1)
  - 2단계: POST /analyze → GET /getScanResults
  - state=FINISHED만 사용, issues = 실패 테스트 score_description
  - getScanResults 실패 시 빈 issues (grade/score는 유지)

### 테스트 (250개 전체 통과)

- `parsers/__tests__/robots-txt.test.ts` — 21개
- `parsers/__tests__/sitemap.test.ts` — 21개
- `parsers/__tests__/llms-txt.test.ts` — 18개
- `parsers/__tests__/cms.test.ts` — 23개
- `parsers/__tests__/mobile.test.ts` — 20개
- `fetchers/__tests__/pagespeed.test.ts` — 13개
- `fetchers/__tests__/crux.test.ts` — 16개
- `fetchers/__tests__/safe-browsing.test.ts` — 15개
- `fetchers/__tests__/ssl-labs.test.ts` — 18개
- `fetchers/__tests__/observatory.test.ts` — 17개
- (+ 기타 auth/shared 테스트)

### 설계 패턴

- **parsers/ vs fetchers/ 분리**: 순수 함수(파서)와 네트워크 호출(페처) 구분
- **lib/adapters/ 사용 안 함**: PageSpeed API는 crawling 전용 → features/crawling 내부 배치
- **타입 파생**: `type PageSpeedData = NonNullable<Layer2Data['pagespeed']>` — types.ts 중복 정의 방지

---

## 📦 미커밋 변경 (스테이징 외)

- `docs/blueprint.md` — 수정됨 (Task 3.1~3.7 blueprint 통합)
- `src/features/onboarding/actions/submit-url.ts` — 신규 (Task 2.3 관련 WIP)
- `src/features/onboarding/schemas.ts` — 수정됨 (Task 2.3 관련 WIP)

### Epic 4: 진단 엔진 ✅

| Task | 설명                  | 상태    |
| ---- | --------------------- | ------- |
| 4.1  | 룰 기반 SEO 점수      | ✅ 완료 |
| 4.2  | 룰 기반 GEO 점수      | ✅ 완료 |
| 4.3  | AI 인용 가능성 점수   | ✅ 완료 |
| 4.4  | Quick Win 자동 식별   | ✅ 완료 |
| 4.5  | 종합 점수 + 등급 산출 | ✅ 완료 |

### Epic 5: AI 상세 분석 ✅

| Task | 설명                           | 상태    | 커밋      |
| ---- | ------------------------------ | ------- | --------- |
| 5.1  | 5-Agent 병렬 실행 구조         | ✅ 완료 | `6a8ef7b` |
| 5.2  | Content Agent 데이터 품질 강화 | ✅ 완료 | `6a8ef7b` |
| 5.3  | AI 인용 실제 추적 (4플랫폼)    | ✅ 완료 | `c3154fd` |
| 5.4  | CMO 검증 에이전트              | ✅ 완료 | `909995a` |
| 5.5  | SWOT 자동 생성                 | ✅ 완료 | `51829d5` |
| 5.6  | 90일 로드맵 자동 생성          | ✅ 완료 | `51829d5` |

### Epic 6: 경쟁사 비교 ✅

| Task | 설명               | 상태    | 커밋      |
| ---- | ------------------ | ------- | --------- |
| 6.1  | 경쟁사 자동 탐색   | ✅ 완료 | `15771ef` |
| 6.2  | 경쟁사 병렬 크롤링 | ✅ 완료 | `15771ef` |
| 6.3  | 비교 매트릭스 생성 | ✅ 완료 | `15771ef` |
| 6.4  | 갭 분석            | ✅ 완료 | `15771ef` |

### Epic 7: 리포트 + 실행 도구 ✅

| Task | 설명                      | 상태    | 커밋      |
| ---- | ------------------------- | ------- | --------- |
| 7.1  | 대시보드                  | ✅ 완료 | `51829d5` |
| 7.2  | 간단 리포트 (무료)        | ✅ 완료 | `0a97fa3` |
| 7.3  | 상세 리포트 (유료, 웹)    | ✅ 완료 | `6a848ca` |
| 7.4  | PDF 리포트 생성           | ✅ 완료 | `6a848ca` |
| 7.5  | Schema Markup 코드 생성   | ✅ 완료 | `df1bb2c` |
| 7.6  | 메타태그 최적화안         | ✅ 완료 | `281b505` |
| 7.7  | CMS 감지 기반 맞춤 가이드 | ✅ 완료 | `3e2d66b` |

### Epic 8: 샘플 리포트 ✅

| Task | 설명                             | 상태    | 커밋      |
| ---- | -------------------------------- | ------- | --------- |
| 8.1  | 가상 회사 "그린테크" 데이터 생성 | ✅ 완료 | `0a97fa3` |
| 8.2  | /reports/sample 풀 리포트 페이지 | ✅ 완료 | `0a97fa3` |

### Epic 9: Free/유료 분기 + 결제 ✅

| Task | 설명                           | 상태    | 비고                                  |
| ---- | ------------------------------ | ------- | ------------------------------------- |
| 9.1  | 사용자 상태 미들웨어           | ✅ 완료 | middleware.ts (PROTECTED/AUTH 경로)   |
| 9.2  | BlurOverlay 컴포넌트           | ✅ 완료 | shared/BlurOverlay (gradient+CTA)     |
| 9.3  | 유료 전환 CTA 배치             | ✅ 완료 | Dashboard, Pricing 페이지 연동        |
| 9.4  | Toss Payments 건당 결제 (Mock) | ✅ 완료 | MockPaymentAdapter + checkout API     |
| 9.5  | 결제 완료 → 상세 진단 트리거   | ✅ 완료 | fire-and-forget /api/dev/trigger-paid |

> **결제 참고**: MockPaymentAdapter 사용 중. Toss Payments 실 연동은 별도 지시 시 진행 예정. `lib/adapters/payment.ts` 어댑터 패턴으로 교체 용이.

---

### Epic 10: 인프라 + 품질 (부분 완료)

| Task | 설명                     | 상태      | 비고                            |
| ---- | ------------------------ | --------- | ------------------------------- |
| 10.1 | Vercel 배포 + 도메인     | 🔧 인프라 | 배포 설정 필요                  |
| 10.2 | n8n 서버 (Elest.io)      | 🔧 인프라 | 크롤링 자동화 연동              |
| 10.3 | E2E 테스트 (핵심 3 Flow) | ✅ 완료   | 19 tests, 3 files               |
| 10.4 | 404/500 에러 페이지      | ✅ 완료   | not-found + global-error        |
| 10.5 | 접근성 + Lighthouse      | ✅ 완료   | SkipLink + ErrorBoundary + ARIA |

---

### Task 18: n8n 워크플로우 병렬 처리 재설계 ✅

| 산출물        | 파일                                               | 설명                             |
| ------------- | -------------------------------------------------- | -------------------------------- |
| n8n JSON 골격 | `n8n/workflows/findably-crawl-v2.json`             | 16노드 3-Group 병렬 워크플로우   |
| 설계 문서     | `docs/n8n-workflow.md`                             | 아키텍처 + 노드 상세 + 환경변수  |
| 콜백 API      | `src/app/api/crawl/complete/route.ts`              | n8n → Next.js 웹훅 시크릿 인증   |
| 정규화 파서   | `src/features/crawling/services/parse-crawl-v2.ts` | raw crawlResult → CrawlData 변환 |

> v1 순차(~90초) → v2 3-Group 병렬(~35초). 10개 소스 동시 실행 + dataCompleteness 장애 허용.

---

### Task 19: 진단 오케스트레이터 v2 ✅

| 산출물         | 파일                                                            | 설명                                                              |
| -------------- | --------------------------------------------------------------- | ----------------------------------------------------------------- |
| 스코어링 상수  | `src/config/scoring.ts`                                         | 매크로 가중치·매핑·임계값 외부화                                  |
| 타입 확장      | `src/features/diagnosis-free/types.ts`                          | MacroScore, AggregatedScores, ReportReliability + QuickWin.source |
| 점수 집계기    | `src/features/diagnosis-free/services/score-aggregator.ts`      | 5-score 가중 합산 + reportReliability                             |
| 테스트         | `src/features/diagnosis-free/services/score-aggregator.test.ts` | 7개 케이스                                                        |
| 오케스트레이터 | `src/features/diagnosis-free/services/run-diagnosis.ts`         | params 객체화 + aggregateScores 통합                              |

> 5개 매크로 점수(SEO 20% / GEO 25% / Performance 20% / AI 25% / Security 10%) 가중 합산.
> AI 데이터 없으면 자동 폴백 가중치(SEO 25% / GEO 30% / Perf 25% / Sec 20%).
> dataCompleteness → reportReliability(high/medium/low) 매핑.

---

## ⏳ 아키텍처 리뷰 (2026-03-23) ✅ 완료

### 종합 아키텍처 리뷰 및 문서화

| 산출물         | 파일                                                       | 설명                                       |
| -------------- | ---------------------------------------------------------- | ------------------------------------------ |
| 리뷰 보고서    | `docs/ARCHITECTURE-REVIEW.md`                              | 600+ 줄, 10개 섹션, 8개 영역 분석          |
| 모듈 경계 문서 | `docs/module-boundary.md`                                  | 10개 모듈 의존성 맵, DAG 구조, 어댑터 정리 |
| 기억 저장      | `.claude/agent-memory/architect/arch-review-2026-03-23.md` | 향후 세션 참조용                           |

**리뷰 범위:**

- ✅ 모듈 경계: 95% 준수 (0건 중대 위반)
- ✅ 어댑터 패턴: 100% 일관성 (8개 adapters)
- ✅ Config 외부화: 11개 파일, 매직 넘버 제로
- ✅ 타입 공유: 읽기 의존만, 순환 없음
- ✅ 5-Agent 파이프라인: 견고함, 타임아웃/CMO 검증
- ✅ E2E 테스트: 75% 커버리지, +7 테스트 권장
- ✅ Phase 2 확장성: 준비됨 (구독, GSC, 모니터링)

**P0 권장사항:**

- [x] 모듈 경계 문서화 (완료)
- [ ] E2E +7 테스트 추가 (선택)

---

## ⏳ 진행 중

### Task 10.4 + 10.5: 접근성/에러 페이지 (부분 완료)

**완료된 부분:**

- [x] `src/components/shared/SkipLink.tsx` — 신규 생성 (Server Component, 키보드 스킵 내비게이션)
- [x] `src/app/layout.tsx` — SkipLink + ErrorBoundary 래핑 추가
- [x] `src/app/(public)/layout.tsx` — `<main id="main-content">` 추가
- [x] `src/app/(dashboard)/layout.tsx` — `<main id="main-content">` 추가
- [x] `src/app/(onboarding)/layout.tsx` — `<main id="main-content">` 추가
- [x] `src/app/(marketing)/page.tsx` — `<main id="main-content">` 추가 (리뷰에서 발견 후 수정)
- [x] 랜딩 8개 섹션 aria-labelledby 적용 (hero, pain-points, score-preview, features, comparison, how-it-works, concerns, pricing, cta)
- [x] `src/components/landing/score-preview.tsx` — SVG Gauge에 `role="meter"` + `aria-valuenow/min/max` + `aria-label` 추가
- [x] 코드 리뷰 통과 (4-gate 리뷰 → 🟠 1개 + 🟡 1개 → 전체 수정 완료)

**미완료 (플랜 기준):**

- [ ] `src/app/not-found.tsx` — 404 전용 페이지 신규 생성
- [ ] `src/app/global-error.tsx` — 500 페이지 수정 (디자인 토큰 적용, role="alert", 홈 링크 추가)

**플랜 파일:** `/Users/jayden/.claude/plans/tranquil-strolling-manatee.md`

**참고:**

- `.next` 캐시 문제: 삭제된 `(public)/page.tsx` 참조로 `validator.ts` tsc 에러 발생 → `grep -v 'validator.ts'`로 필터링하면 실제 에러 0개
- `rm -rf .next` 후 재빌드하면 해결됨

## 🔜 다음 할 일

### Task 10.4 잔여 — 404/500 에러 페이지

1. **`src/app/not-found.tsx`** — 404 전용 페이지 (Server Component, SearchX 아이콘, 디자인 토큰 적용)
2. **`src/app/global-error.tsx`** — 500 페이지 개선 (bg-blue→bg-primary, role="alert", 홈 링크 추가)

### Phase 1 마무리 (인프라)

3. **Task 10.1** — Vercel 배포 + 도메인 연결
4. **Task 10.2** — n8n 서버 설정 (Elest.io)
5. **Toss Payments 실 연동** — 현재 Mock → 별도 지시 시 진행

### Phase 2 (v2 기능)

4. **경쟁사 벤치마킹** — 경쟁사 자동 탐색 + 병렬 크롤링 + 비교 매트릭스
5. **AI 가시성 실시간 추적** — 타겟 키워드별 AI 플랫폼 인용 주기적 추적
6. **주간 자동 재크롤링** — 크론 기반 주간 재진단 + 점수 변화 추적 + 이메일 알림

> **Phase 1 코딩 작업 전체 완료** (2026-03-17). 최종 검증: 596 tests, 0 failed.

---

## 📦 Epic 5 주요 파일 (Task 5.1~5.4)

### diagnosis-paid 모듈

- `src/config/diagnosis-paid.ts` — 5개 에이전트 + CMO 에이전트 설정 + 인용 추적 4플랫폼 설정
- `src/features/diagnosis-paid/types.ts` — AIInsight, AIAgentResult, PaidAnalysisData, CmoVerificationResponse, CitationKeywordResult 등
- `src/features/diagnosis-paid/index.ts` — 공개 인터페이스
- `src/features/diagnosis-paid/services/run-diagnosis-paid.ts` — 핵심 실행 로직
  - `runDiagnosisPaid()` — 5-Agent 병렬 실행 + CMO 검증 + DB 저장
  - `buildCrawlSummary()` — CrawlData → AI 프롬프트용 텍스트
  - `parseAgentResponse()` — AI 응답 JSON 파싱 + 유효성 검증
  - `parseCompetitorsResult()` — SWOT/로드맵/경쟁사 파싱
  - `executeCmoAgent()` — CMO AI 호출 + 15초 타임아웃 + 폴백 (Task 5.4)
  - `parseCmoResponse()` — CMO JSON 파싱 + 유효성 검증 (Task 5.4)
  - `generateCmoSummaryFallback()` — CMO 실패 시 폴백 요약 (Task 5.4)
- `src/features/diagnosis-paid/services/track-citations.ts` — AI 인용 실제 추적 (Task 5.3)
  - `trackCitations()` — 4플랫폼 × 키워드 병렬 쿼리
  - 어댑터 패턴: Claude/OpenAI/Google/Perplexity 통합 타입
- `src/features/diagnosis-paid/services/__tests__/run-diagnosis-paid.test.ts` — 39개 테스트

### Task 5.3 변경 요약 (AI 인용 실제 추적)

- `CITATION_TRACKING` 설정: 4플랫폼(Claude, ChatGPT, Gemini, Perplexity) + 쿼리 템플릿
- `CitationKeywordResult`, `CitationPlatformSummary`, `AICitationTrackingResult` 타입
- `AIPlatform` 타입을 `diagnosis-free`에서 import (OST 준수)
- `PaidAnalysisData.aiCitationTracking` 필드 추가

### Task 5.4 변경 요약 (CMO 검증 에이전트)

- `CMO_AGENT` 별도 상수 (AGENTS 배열 분리 — 병렬 실행 포함 방지)
- `AgentId`에 `'cmo'` 추가, `AnalysisAgentId = Exclude<AgentId, 'cmo'>` 타입 별칭
- `CmoVerificationResponse` 타입 (executive_summary + quality_score + issues_found)
- `executeCmoAgent()`: Promise.race 타임아웃 + clearTimeout 클린업
- `aggregateResults()` → async 변환 (CMO 호출 포함)
- `generateCmoSummary()` → `generateCmoSummaryFallback()`으로 리네임
- 8개 새 테스트 추가 (parseCmoResponse 성공/실패/코드블록/필드 누락 등)

---

## 🔧 검증 명령어

```bash
pnpm tsc --noEmit && pnpm lint && pnpm build && pnpm test
```

최종 검증: ✅ 전체 통과 (596 tests, 0 failed, 2026-03-17)

## 📝 빌드 참고

- `pnpm lint` 경고 존재 (pre-existing, 블로킹 아님)
- 개발 서버: `pnpm dev` (포트 3600)

---

## 🔑 핵심 설계 결정사항

| 결정      | 선택                    | 이유                                   |
| --------- | ----------------------- | -------------------------------------- |
| 과금 모델 | 건당 9.9만원            | MVP 검증 — 구독보다 진입장벽 낮음      |
| 인증      | Supabase Auth           | 무료, RLS 통합                         |
| 크롤링    | Playwright + n8n        | Layer 1 비용 0원                       |
| AI        | Claude API (Sonnet 4.6) | 유료만 호출 — 원가 ~500원/건           |
| 결제      | Toss Payments 🔴        | 한국 시장 최적, 건당 결제 지원         |
| 배포      | Vercel                  | Next.js 최적화                         |
| DB 접두사 | findably\_              | chatsio-v1과 Supabase 공유 → 충돌 방지 |
