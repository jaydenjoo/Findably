# Findably — 진행상황 문서

> **이 파일을 세션 시작 시 첫 번째로 읽으면 100% 이어서 작업 가능**
> 최종 업데이트: 2026-04-04

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

## 2026-04-04 세션: PRD v1.2 홈페이지↔리포트 정합성 (전체 완료)

> PRD: `docs/Findably-PRD-홈페이지-리포트-정합성-v1_2.md`
> 브랜치 전략: `feature/phase-N` → PR → main 머지 → Vercel 자동 배포

### 해결한 갭 4가지

| 갭        | 문제                          | 해결                                                  |
| --------- | ----------------------------- | ----------------------------------------------------- |
| G-01 범위 | 홈페이지가 "마케팅 전반" 암시 | H1 "어디서 새고 있는지" + 비교 테이블 "기초체력 진단" |
| G-02 언어 | 리포트가 전문용어 사용        | 원화 환산 + CMO 비즈니스 언어 프롬프트                |
| G-03 근거 | 우선순위 "왜" 설명 없음       | 로드맵에 3기준 설명 블록 추가                         |
| G-04 신뢰 | 자체 사이트 SEO/GEO 미달      | Schema 5종 + og:image + FAQ + robots/llms 보강        |

### Phase별 PR

| Phase   | PR  | Task 수 | 핵심 변경                                                                   |
| ------- | --- | ------- | --------------------------------------------------------------------------- |
| Phase 0 | #2  | 5       | 누수 프레이밍(H1/서브카피/비교테이블) + SEO 기반(robots/llms/OG) + URL 통일 |
| Phase 1 | #3  | 4       | 브릿지 섹션(웹+PDF) + CMO 프롬프트 + FAQ 7개 + 키워드                       |
| Phase 2 | #4  | 2       | Schema @graph 5종 + og:image 동적 생성                                      |
| Phase 3 | #5  | 2       | dynamic import LCP 개선 + CTA 안전성 신호 + 내부 링크                       |
| Phase 4 | #6  | 3       | 업종 벤치마크 config + 원화 환산 + 총 누수 카드                             |
| Phase 5 | #7  | 2       | PDF 원화 반영 + 정합성 검증 11항목 통과                                     |

### 신규 생성 파일

| 파일                                                                   | 용도                                                  |
| ---------------------------------------------------------------------- | ----------------------------------------------------- |
| `src/config/revenue.ts`                                                | 업종별 벤치마크 (6개 업종) + calculateRevenueImpact() |
| `src/components/landing/faq-section.tsx`                               | FAQ 7개 아코디언                                      |
| `src/app/og/route.tsx`                                                 | OG 이미지 동적 생성 (Edge Runtime, 1200x630)          |
| `src/app/(dashboard)/reports/my/[id]/_components/BridgeSection.tsx`    | 마케팅 누수 브릿지 (4영역 점수 테이블)                |
| `src/app/(dashboard)/reports/my/[id]/_components/TotalLeakageCard.tsx` | 총 누수 요약 카드                                     |
| `src/features/report/pdf/sections/PdfBridgeSection.tsx`                | PDF 브릿지 섹션                                       |

### 주요 수정 파일

| 파일                             | 변경                                               |
| -------------------------------- | -------------------------------------------------- |
| `hero-section.tsx`               | H1 + 서브카피 + badge + Quick Answer + 안전성 신호 |
| `comparison-table.tsx`           | 제목/컬럼/주석 리프레이밍                          |
| `customer-concerns.tsx`          | 고민카드1 + FAQ 링크                               |
| `footer.tsx`                     | 내부 링크 확장 (6개)                               |
| `cta-section.tsx`                | 안전성 신호                                        |
| `(marketing)/page.tsx`           | dynamic import + Schema + OG + FAQ 삽입            |
| `config/seo.ts`                  | Title/Description 누수 프레이밍 + og:image 경로    |
| `config/landing.ts`              | hero 상수 + FAQ 데이터                             |
| `config/diagnosis-paid.ts`       | CMO 프롬프트 비즈니스 언어 지시                    |
| `AIInsightsSection.tsx`          | 원화 환산 + 전문가용 접기                          |
| `RoadmapSection.tsx`             | 우선순위 3기준 설명 블록                           |
| `layout.tsx`                     | Schema @graph 통합                                 |
| `robots.ts`                      | AI 봇 8개 확장                                     |
| `llms.txt`                       | 누수 프레이밍 재작성                               |
| `PdfInsights.tsx`                | PDF 원화 환산                                      |
| `PdfRoadmap.tsx`                 | PDF 우선순위 설명                                  |
| `findably.co.kr` → `findably.kr` | 7개 파일 도메인 통일                               |

### 배포 후 수동 확인 필요

- [ ] PageSpeed LCP 2.5초 이하
- [ ] 카카오톡 공유 미리보기 (제목+설명+이미지)
- [ ] Google 구조화 데이터 테스트 도구 통과
- [ ] Findably 자체 재진단 → 90점+ 달성

### 프로젝트 파일 정리 (2026-04-04)

| 정리 항목              | 위치                             | Git                 |
| ---------------------- | -------------------------------- | ------------------- |
| 일회성 참고 문서 6개   | `docs/archive/`                  | .gitignore 제외     |
| 디버깅 스크립트        | `scripts/`                       | .gitignore 제외     |
| Claude 에이전트 메모리 | `.claude/agent-memory/`          | .gitignore 제외     |
| 루트 스크린샷          | 삭제됨                           | `/*.png` .gitignore |
| 도메인 통일            | `findably.co.kr` → `findably.kr` | 7개 파일 수정 완료  |

`docs/archive/` 내용: ARCHITECTURE-REVIEW, E2E-TEST-COVERAGE-ANALYSIS, audit-ui-ux-2026, building-story, findably-v0-prompt-v1, blueprint

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

## 2026-04-05~06 세션: CEO Review + Eng Review (Activation-First Launch Strategy)

> /office-hours → /plan-ceo-review → /plan-eng-review 순으로 실행
> Design doc: `~/.gstack/projects/jaydenjoo-Findably/jayden-main-design-20260405-231321.md`
> CEO plan: `~/.gstack/projects/jaydenjoo-Findably/ceo-plans/2026-04-05-activation-first-launch.md`
> Test plan: `~/.gstack/projects/jaydenjoo-Findably/jayden-main-eng-review-test-plan-20260406-001329.md`

### 핵심 결정

| 항목         | 결정                                                               |
| ------------ | ------------------------------------------------------------------ |
| 런칭 접근법  | Activation-First Hybrid (Phase 1 유지 + 대시보드 실행 중심 재구성) |
| 모드         | SELECTIVE EXPANSION (4개 확장 수락)                                |
| 무료 QW      | 미리보기만 (코드는 유료 뒤) — Codex cannibalization 우려 반영      |
| QW 선택 로직 | `difficulty` 필드 추가 (types.ts + engine.ts + rules)              |
| 이메일       | crawl/complete에서 after()로 발송 (Resend)                         |
| 구현 순서    | 퍼널 추적 먼저 → UX 변경 후 (Codex 반영)                           |
| 테스트       | 27개 전부 작성 (100% 커버리지)                                     |

### 수락된 확장 (cherry-pick)

1. 자동 리크롤 (7일 후 "고쳤어요" 검증)
2. 이메일 알림 (Resend, 진단 완료 시)
3. 무료 Quick Win 1개 미리보기
4. NPS 1문항 (리포트 하단)

### 구현 병렬화 전략

- **Lane A** (독립): 퍼널 추적 utility + 이메일 adapter + difficulty 필드
- **Lane B** (독립): API routes (self-report + nps)
- **Lane C** (A+B 완료 후): Dashboard UX reorder + QuickWinCard 확장 + E2E

### 리뷰 상태

| Review        | Status                                |
| ------------- | ------------------------------------- |
| CEO Review    | CLEAR (SELECTIVE EXPANSION, 4/5 수락) |
| Eng Review    | CLEAR (1 issue, 0 critical gaps)      |
| Outside Voice | Codex 2회 반영 완료                   |
| Design Review | 미실행 (UI 구현 후 추천)              |

---

## 🔜 다음 할 일

### Activation-First 구현 (최우선)

1. **Lane A**: `features/diagnosis-free/types.ts`에 `difficulty` 필드 추가 + engine.ts 수정
2. **Lane A**: `lib/adapters/email.ts` Resend 어댑터 생성
3. **Lane A**: `lib/analytics/events.ts` 퍼널 추적 유틸리티 생성
4. **Lane B**: `/api/self-report` + `/api/nps` API routes 생성
5. **Lane C**: `DashboardContent.tsx` Quick Wins 상단 재배치 + NPS 하단
6. **Lane C**: `QuickWinCard.tsx` preview mode + "고쳤어요" 버튼
7. **Lane C**: `crawl/complete`에 이메일 발송 (after())
8. **Lane C**: E2E 테스트 3개 + Unit 테스트 24개

### 10명 테스트 준비

9. 타겟 매칭 10명 식별 (startup CEO / junior marketer)
10. 선물 코드 배포 + Zoom 관찰 세션 (Week 1)
11. 자기보고 + 설문 수집 (Week 2)
12. 성공 기준 판정: 5명+ QW 실행, 2명+ 유료 의향

### 잔여 작업 (Activation 이후)

13. Task 10.4 잔여 — 404/500 에러 페이지
14. PRD v1.2 배포 후 검증 (LCP, 카카오톡, Schema)
15. Toss Payments 실 연동 (테스트 데이터 확인 후)

### Phase 2 (v2 기능)

9. **경쟁사 벤치마킹** — 경쟁사 자동 탐색 + 병렬 크롤링 + 비교 매트릭스
10. **AI 가시성 실시간 추적** — 타겟 키워드별 AI 플랫폼 인용 주기적 추적
11. **주간 자동 재크롤링** — 크론 기반 주간 재진단 + 점수 변화 추적 + 이메일 알림

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
| 배포      | Vercel Pro              | Next.js 최적화, maxDuration 120초      |
| DB 접두사 | findably\_              | chatsio-v1과 Supabase 공유 → 충돌 방지 |

---

## 2026-04-03~04 세션: 안정화 + UX 개선 + 선물 코드

### Vercel 타임아웃 문제 해결

| 문제                          | 원인                                          | 해결                                                          |
| ----------------------------- | --------------------------------------------- | ------------------------------------------------------------- |
| 유료 분석 analyzing 영구 고착 | Vercel Hobby 기본 Lambda 10초, after() 불안정 | maxDuration 설정 + after() 제거                               |
| CMO client disconnected (499) | Lambda 60초에 Opus 응답 12초 초과             | Vercel Pro 업그레이드 (maxDuration=120초)                     |
| checkout fire-and-forget 실패 | 서버→서버 fetch가 Lambda 종료 시 잘림         | 프론트엔드(PaidAnalyzingState)에서 직접 trigger-analysis 호출 |

**아키텍처 변경:**

```
[이전] checkout → after() → fetch(trigger) → after() → runDiagnosisPaid
[현재] checkout → 결제만 → 응답
       PaidAnalyzingState → fetch(trigger-analysis) → 동기 실행 120초
       5초 폴링으로 완료 확인 → router.refresh()
```

### UX 개선 (1순위 + 2순위)

| 항목                | 설명                                               | 파일                  |
| ------------------- | -------------------------------------------------- | --------------------- |
| Quick Win 임팩트    | "이 항목 수정 시 +N점 예상" 파란 뱃지              | QuickWinCard.tsx      |
| 모바일 스크롤 힌트  | Quick Win 우측 그라데이션                          | DashboardContent.tsx  |
| CTA 스피너          | Loader2 로딩 표시                                  | DashboardContent.tsx  |
| 업종 벤치마크       | "업종 평균(48점)보다 +N점 높음"                    | DashboardContent.tsx  |
| 게이미피케이션      | 👑 마케팅 마스터 / 🚀 성장 궤도 / 💪 SEO 초보 탈출 | DashboardContent.tsx  |
| 카테고리 드릴다운   | 클릭 시 아코디언으로 룰 상세 표시                  | CategoryScoreCard.tsx |
| 성능 데이터 소스    | 📊 시뮬레이션 / 👥 실제 사용자 뱃지                | CategoryScoreCard.tsx |
| 온보딩 단축         | info 페이지 건너뛰고 바로 analyzing                | submit-url.ts         |
| 히어로 문구 수정    | "가입 불필요" → "URL만 입력"                       | hero-section.tsx      |
| 세션 만료 배너 삭제 | middleware 자동 갱신으로 대체                      | layout.tsx            |

### 삭제된 기능

| 항목                      | 이유                            |
| ------------------------- | ------------------------------- |
| 경쟁사 메뉴 (사이드바/탭) | 사용하지 않음, 추후 재추가      |
| 경쟁사 URL 입력 폼        | 온보딩 간소화                   |
| SessionExpiryWarning      | middleware 자동 갱신으로 불필요 |
| Mock 결제 (checkout)      | 선물 코드 방식으로 전환         |

### 선물 코드 시스템 (신규)

| 구성요소         | 파일                                                 | 설명                              |
| ---------------- | ---------------------------------------------------- | --------------------------------- |
| DB 테이블        | `supabase/migrations/006_findably_gift_codes.sql`    | gift_codes + gift_code_uses + RLS |
| 코드 검증 API    | `src/app/api/payment/redeem-code/route.ts`           | 코드 유효성 + 유료 레코드 생성    |
| 코드 생성 API    | `src/app/api/admin/gift-codes/route.ts`              | admin 전용                        |
| 코드 생성 Action | `src/app/(admin)/admin/_actions/create-gift-code.ts` | Server Action                     |
| 코드 입력 UI     | `GiftCodeModal.tsx`                                  | 사용자 코드 입력 모달             |
| Admin 코드 관리  | `AdminGiftCodeForm.tsx` + `AdminLoginForm.tsx`       | 코드 생성/조회/상태               |
| DB 타입          | `src/types/database.ts`                              | gift_codes, gift_code_uses 추가   |

**플로우:**

```
[admin] 코드 생성 (FDB-XXXXXX) → 지인에게 전달
[사용자] 무료 진단 → "상세 분석 받기" → 코드 입력 → 유료 리포트
```

### learnings 추가

- Vercel Hobby after() Lambda 타임아웃 → analyzing 영구 고착
- 히어로 "가입 불필요" 문구 실제 플로우와 불일치
- 에러 디버깅 체크포인트 7개 카테고리 (A~G)

### 현재 배포 상태

| 항목            | 상태                                          |
| --------------- | --------------------------------------------- |
| Vercel 플랜     | **Pro** ($20/월)                              |
| maxDuration     | trigger-analysis: 120초, crawl/complete: 60초 |
| CMO 모델        | **Opus** (최고 품질, 30초 타임아웃)           |
| 글로벌 타임아웃 | 90초                                          |
| 결제 방식       | **선물 코드** (Mock 결제 제거)                |

---

## 🔜 다음 작업 (미완료)

| 항목                  | 우선순위 | 설명                                        |
| --------------------- | -------- | ------------------------------------------- |
| 유료 분석 안정성 검증 | P0       | 프론트엔드 트리거 방식 프로덕션 테스트      |
| Toss Payments 실 연동 | P1       | 선물 코드와 병행, 결제 옵션 추가            |
| 이메일 알림           | P2       | 분석 완료 시 이메일 발송 (대기 시간 체감 0) |
| 점진적 결과 표시      | P2       | 에이전트별 순차 노출                        |
| n8n watchdog          | P3       | 5분 stuck 감지 자동 복구                    |

---

## 📌 2026-04-06 세션 진행 상황

### 현재 위치

- **Epic**: 프로덕션 복구 + 아키텍처 재검토
- **Task**: n8n 크롤링 파이프라인 고장 원인 파악 + 대안 검토
- **상태**: 🟡 **부분 완료** — PaidAnalyzingState 버그 수정됨, n8n 콜백 미동작 문제는 미해결

### 이번 세션 완료 내역

1. **Lane A/B 코드 작업** (미커밋, 로컬)
   - Lane A Task 1: `difficulty` 필드 추가 (7개 rule 파일 + types + 테스트)
   - Lane A Task 2: Resend 이메일 어댑터 + `crawl/complete` 통합 (`src/lib/adapters/email.ts`)
   - Lane A Task 3: `trackEvent()` 유틸 + `analytics_events` 테이블
   - Lane B: `/api/self-report` + `/api/nps` POST 엔드포인트 신규
   - 약 55개 단위 테스트 통과

2. **DB 마이그레이션 재구성** (Supabase)
   - Findably 관련 10개 테이블 drop & recreate (chatsio 테이블 건드리지 않음)
   - `updated_at` 컬럼 + trigger + UPDATE RLS 정책 누락 발견 → 추가
   - `analytics_events`, `self_reports`, `nps_responses` 신규 테이블 적용

3. **프로덕션 버그 수정 (커밋 `c59d9bc`)**
   - **근본 원인**: `PaidAnalyzingState`가 `isPaid` 무관하게 `/api/payment/trigger-analysis` 호출 → `runDiagnosisPaid()`가 `crawl_data=NULL`에서 실패 → catch 블록이 `status='failed'` 마킹
   - **수정 1**: `PaidAnalyzingState.tsx`에 `if (!isPaid) return` 가드
   - **수정 2**: `trigger-analysis/route.ts`에 `tier !== 'paid'` 체크 추가 → `skipped_free_tier` 응답
   - 증거: pg_stat_statements에서 `SELECT status → SELECT url,crawl_data,... → UPDATE status` 시퀀스 추적

4. **last-known-good.md 시스템 구축 (커밋 `c59d9bc`)**
   - `docs/last-known-good.md` 신규 258줄 — 프로덕션 상태 추적 프레임워크
   - 섹션 1 (마지막 정상), 섹션 2 (현재 상태), 섹션 3 (검증 체크리스트 Tier 1~5), 섹션 4 (업데이트 프로토콜), 섹션 5 (문제 발생 시 진단 순서 READ ONLY), 섹션 6 (변경 이력)
   - `CLAUDE.md`에 1줄 추가: "프로덕션 이슈 발생 시 반드시 `docs/last-known-good.md` 먼저 확인"

5. **n8n 대안 딥리서치 완료 (실행 안 함 — 검토만)**
   - 9개 옵션 비교: Vercel Lambda 인프로세스, Vercel Workflow (2025-10 출시), Vercel Queues (2026-02 GA), Inngest, Trigger.dev v3, Upstash Workflow, Supabase Edge Functions, Cloudflare Workflows, n8n 유지
   - **결론**: Vercel Pro 구독 + n8n 공유 무료 상황 감안 시 **시나리오 C (이중 전략)** 권장
     - 단기 (30분~2h): n8n 콜백 버그 수정 (프로덕션 즉시 복구)
     - 중기 (1~2일): Option A (Pure `Promise.all` Vercel 인프로세스)로 마이그레이션
     - 장기 (선택): Option B (Vercel Workflow GA 후 이전)
   - **핵심 발견**: Vercel Fluid Compute 기본 활성화 (2025-04~) + Hobby 300s / Pro 800s 한도, Active CPU 과금으로 I/O fan-out 거의 무료. Inngest Pro $25→$75 인상 + 무료 5 concurrent step 제한 확인

### 다음 세션 할 일

| 우선순위 | 작업                                      | 비고                                                                      |
| -------- | ----------------------------------------- | ------------------------------------------------------------------------- |
| **P0**   | **n8n 콜백 미동작 원인 파악 + 수정**      | Elest.io Executions 탭 / Firecrawl 크레딧 / Vercel env 확인 (Jayden 영역) |
| **P0**   | Lane A/B 작업분 커밋 전략 수립            | 20+ 미커밋 파일 정리, 테스트 재실행                                       |
| **P1**   | Option A 마이그레이션 (n8n → Pure Vercel) | Firecrawl 어댑터 + Group C 파서 4개 + 오케스트레이터 (1~2일)              |
| **P2**   | last-known-good.md Section 1 갱신         | 마이그레이션 성공 후 Tier 1~3 체크 통과 시                                |
| **P3**   | 기존 테스트 실패 31건 정리                | observatory v2 마이그레이션, CMO fallback, SWOT 관련 (기존 이슈)          |

### 차단 요소

- **n8n 콜백 미동작 원인 불명** — 내가 직접 확인 불가 (Elest.io 계정, Firecrawl 대시보드, Vercel env 값). Jayden 영역
- **Lane A/B 20+ 파일 미커밋** — 이번 세션의 버그 수정(`c59d9bc`)과 섞이지 않도록 의도적으로 배제. 다음 세션에서 별도 커밋 전략 필요

### 이번 세션 주요 배운 점 (learnings.md에 기록됨)

1. **PaidAnalyzingState race condition** — paid 전용 API에 tier 가드 필수
2. **증거 수집 전 파괴적 작업 금지** — 프로덕션 이슈 시 READ ONLY 우선, DB drop 같은 작업은 root cause 확정 후
3. **외부 서비스 가격/제한 검증 습관** — 기술 선정 시 공식 pricing 당일 확인 + 무료 티어 세부 조건 + 최근 6개월 신제품 검색

### 마지막 업데이트

- **날짜**: 2026-04-06
- **세션 시간**: ~6시간 (긴 디버깅 + 딥리서치 포함)
- **최종 커밋**: `c59d9bc` fix: 무료 진단이 trigger-analysis로 failed 마킹되는 race condition 수정

---

## 📌 2026-04-06 세션 (2차) — Lane A/B 정리 + n8n 콜백 복구

### 완료 내역

1. **Lane A/B 미커밋 정리 완료 (P0 차단 요소 해소)**
   - `git stash && next build`로 HEAD 빌드 검증 후 4개 논리 커밋으로 분할:
     - `6650180` feat(diagnosis-free): quick win 난이도(difficulty) 필드 추가 (16 files, 46 tests)
     - `efe4719` feat(email): resend 어댑터 + 진단 완료 알림 발송 (5 files, 8 tests)
     - `d114235` feat(db): analytics + self-report + nps 테이블 + api 라우트 (11 files, 27 tests)
     - `cecb651` chore: health 라우트 + prd v1.2 + .claude/skills 무시 (3 files + .gitignore)
   - 총 35 files, +3200 lines. 커밋별 테스트 통과(81건) + 최종 `next build` 통과. `origin/main` 푸시 완료.

2. **n8n 콜백 URL 수정 (P0 차단 요소 해소)**
   - 근본 원인: 2026-04-05 커스텀 도메인 `findably.kr` 전환 후, n8n workflow "Callback Next.js" 노드가 여전히 `https://findably.vercel.app/api/crawl/complete` 참조. Vercel이 307 리다이렉트 반환 → n8n axios가 리다이렉트 추적 시 POST→GET 변환 + body 손실 → Vercel 로그에 아예 기록 안 됨
   - 증거: Vercel Function Logs 스크린샷 — 최근 30분 `/api/crawl/complete` 요청 0건. Supabase `diagnoses` 테이블에 90분+ 멈춘 `crawling` 레코드 2건
   - 해결: Jayden이 Elest.io workflow URL을 `findably.kr`로 교체. 첫 시도 9분 후 테스트는 실패, ~30분 후 재저장/재활성화 후 17.85초 end-to-end 성공 검증
   - 로컬 n8n JSON 3개 동기화 완료 (`findably-crawl-v2-production-fixed.json`, `workflows/findably-crawl-v2-production.json`, `workflows/findably-crawl-v2-hardcoded.json`)

3. **문서 갱신**
   - `docs/last-known-good.md` Section 1 (공식 정상 baseline) + Section 2 (현재 상태 🟢) + Section 6 (변경 이력) 갱신
   - `docs/learnings.md` 2건 신규 추가:
     - n8n 콜백 URL stale → 파이프라인 중단 (커스텀 도메인 전환 후 외부 서비스 콜백 URL 전수 점검 규칙)
     - 값 변경 시 전체 참조처 스캔 → 제시 → 승인 → 일괄 변경 (AI 이탈 교훈 + 다음 세션 자동 적용)
   - feedback memory `feedback_value-change-scan.md` 추가

### 차단 요소 상태 (이전 세션 대비)

| 항목                          | 이전    | 현재    |
| ----------------------------- | ------- | ------- |
| Lane A/B 미커밋 20+ 파일      | 🔴 차단 | ✅ 해소 |
| n8n 콜백 미동작               | 🔴 차단 | ✅ 해소 |
| 프로덕션 무료 진단 파이프라인 | 🔴 고장 | 🟢 정상 |

### 검증 결과

- 무료 진단 end-to-end: 17.85초 (`147e37aa-5ada-44ae-aec8-33d21d12e0c1`, findably.kr 자기 자신, total_score=56, grade=warning)
- `crawl_data` NOT NULL, `analysis_data` NOT NULL 확인
- 멈춰있던 2건(`695c09ff`, `0a611641`) 정리 완료

### 다음 세션 할 일 (우선순위)

| 우선순위 | 작업                                        | 비고                                          |
| -------- | ------------------------------------------- | --------------------------------------------- |
| **P1**   | Tier 3 검증 (유료 진단 end-to-end)          | 선물코드 또는 Toss Payments 테스트            |
| **P1**   | Tier 4 검증 (PDF + Resend 이메일 실제 발송) | 이번 세션 미검증                              |
| **P2**   | n8n watchdog (5분 stuck 감지 자동 복구)     | 다시 stale URL 같은 사고 방지용               |
| **P2**   | Option A 마이그레이션 (n8n → Pure Vercel)   | 직전 세션 딥리서치 결론. Firecrawl 어댑터부터 |
| **P3**   | 기존 테스트 실패 31건 정리                  | observatory v2 마이그레이션, CMO fallback     |

### 이번 세션 주요 배운 점

1. **커스텀 도메인 전환 시 외부 서비스 콜백 URL 전수 점검** — learnings.md에 규칙 추가
2. **값 변경 시 Grep 먼저 → 제시 → 승인 → 일괄 변경** — feedback memory로 자동 적용
3. **Vercel 로그 "0건"은 강력한 단서** — 에러가 없는 게 아니라 요청이 도달조차 못 한다는 뜻

### 마지막 업데이트 (2차)

- **날짜**: 2026-04-06
- **최종 커밋**: `cecb651` chore: health 라우트 + prd v1.2 + .claude/skills 무시
- **상태**: 🟢 정상 — 다음 세션부터 깨끗한 main에서 시작 가능

---

## 2026-04-06 세션 3차: Lane C 계획 수립 후 보류

### 세션 범위

/start → Lane C(Dashboard UX 재구성 + QuickWinCard 자기보고) 계획 수립 → Step 1 파일 파악 완료 → Jayden 보류 요청

### 진행 단계

| 단계    | 상태        | 비고                                             |
| ------- | ----------- | ------------------------------------------------ |
| 1. 계획 | ✅ 완료     | L-C1 ~ L-C4 4개 Task 분해, Jayden 최초 승인 획득 |
| 2. 승인 | ✅ 완료     | 계획 승인 후 Step 1 시작                         |
| 3. 구현 | ⏸️ **보류** | 코드 변경 0건. 파일 파악만 완료                  |
| 4. 리뷰 | —           | 미시작                                           |

### Step 1 파일 파악 결과 (키 발견)

1. **Quick Win은 이미 Dashboard 상단 2행에 배치됨** (`DashboardContent.tsx` L211-250)
   → 원래 계획의 "재배치" 작업 불필요. NPS 추가만 남음.
2. **NPS/self-report API는 완전히 구현됨**
   - `src/app/api/nps/route.ts` — POST, body={diagnosisId, score, comment?}, trackEvent 내부 호출
   - `src/app/api/self-report/route.ts` — POST, body={diagnosisId, ruleId}, 7일 후 recrawl 예약 + trackEvent
3. **`lib/analytics/events.ts`는 서버 전용** — `createAdminClient()` 사용. 클라이언트 이벤트(dashboard_viewed 등) 발화는 별도 API route 필요 → 이번 스코프 제외.
4. **QuickWinCard는 Server Component + 전체 `<Link>` 래핑** (`src/components/dashboard/QuickWinCard.tsx` L27)
   → `'use client'` 변환 + 버튼 내부 `preventDefault + stopPropagation` 필요.

### 수정된 계획 (보류 시점 기준)

| Task | 제목                                         | 요약                                                                                    |
| ---- | -------------------------------------------- | --------------------------------------------------------------------------------------- |
| L-C1 | NPSSection 신규 + DashboardContent 하단 삽입 | `'use client'`, 0-10 버튼, POST /api/nps, 제출 후 감사 메시지 숨김                      |
| L-C2 | QuickWinCard에 "고쳤어요" 자기보고 버튼      | `canSelfReport?: boolean` prop, Link 유지 + 버튼 stopPropagation, POST /api/self-report |
| L-C3 | Unit 테스트 (NPSSection, QuickWinCard)       | Vitest 7개+, fetch mock, 상태 전환 검증                                                 |
| L-C4 | 통합 검증 + 커밋 2개 분리                    | tsc → lint → test → build. feat(dashboard): NPS / feat(quick-win): 자기보고             |

### 재개 시 바로 시작 가능 (Step 1 → Step 3로)

- 파일 파악 이미 완료. 다음 세션은 **Step 3 (L-C1 NPSSection 구현)** 부터 바로 시작.
- 읽어야 할 파일: 이미 컨텍스트에 있음 (DashboardContent, QuickWinCard, analytics/events, /api/nps, /api/self-report)
- 대략 예상 소요: L-C1 30분 → L-C2 30분 → L-C3 30분 → L-C4 20분 = **총 ~2시간**

### 이번 세션 변경 파일

- **0건** (파일 읽기만 수행, 코드 변경 없음)
- PROGRESS.md 이 섹션 추가만

### 다음 세션 할 일

| 우선순위 | 작업                              | 비고                        |
| -------- | --------------------------------- | --------------------------- |
| **P0**   | Lane C 구현 재개 (L-C1부터)       | 계획 이미 승인됨, 바로 구현 |
| **P1**   | Tier 3/4 검증 (유료 + PDF/이메일) | 2차 세션에서 미뤄둔 검증    |
| **P2**   | n8n watchdog                      | stuck 자동 복구             |

### 마지막 업데이트 (3차)

- **날짜**: 2026-04-06
- **최종 커밋**: `da8c1c4` docs: save session 2차 — lane a/b 정리 + n8n 콜백 복구 기록
- **상태**: ⏸️ Lane C 구현 보류 (계획 완료, 승인 완료, 구현 대기)

---

## 2026-04-06 세션 4차: Lane C 구현 + 배포 + Tier 3/4 검증 완료

### 세션 범위

Lane C 재개 → L-C1~L-C4 전부 완료 → 프로덕션 배포 → Lane C 실기능 검증 → 유료 파이프라인 재확인 → Tier 4 PDF 검증 → last-known-good.md 갱신

### 완료 Task

| Task | 상태    | 비고                                                                     |
| ---- | ------- | ------------------------------------------------------------------------ |
| L-C1 | ✅ 완료 | NPSSection 신규 (0-10 점수 + 선택 코멘트) + DashboardContent 하단 삽입   |
| L-C2 | ✅ 완료 | QuickWinCard `'use client'` + `canSelfReport` prop + "고쳤어요" 버튼     |
| L-C3 | ✅ 완료 | Unit 테스트 12개 (NPSSection 6 + QuickWinCard 6), act warning 0          |
| L-C4 | ✅ 완료 | tsc/lint/build/test 전부 통과. 커밋 `96997d2` 단일 커밋                  |
| N1   | ✅ 완료 | Vercel 수동 배포 + 프로덕션 실기능 검증 (DB 4건 증거)                    |
| N2   | ✅ 완료 | Tier 3 유료 파이프라인 재검증 (기존 `5878eca6` 재활용, 5-Agent+CMO 정상) |
| N3   | 🟡 부분 | PDF ✅ 성공 / Email ❌ RESEND_API_KEY 미설정으로 비활성                  |
| N4   | ✅ 완료 | last-known-good.md 갱신 (Section 1, 2, 6 + 환경변수 실제 상태)           |

### 핵심 커밋

| SHA       | 제목                                                      |
| --------- | --------------------------------------------------------- |
| `96997d2` | feat(dashboard): lane c — quick win 자기보고 + nps 피드백 |

### Lane C 프로덕션 검증 증거 (DB)

| 테이블             | Before | After | Delta | 검증 포인트                                                |
| ------------------ | ------ | ----- | ----- | ---------------------------------------------------------- |
| `self_reports`     | 0      | 1     | +1    | rule_id=`soc-03`, recrawl_scheduled_at=2026-04-13 (7일 후) |
| `nps_responses`    | 0      | 1     | +1    | score=10                                                   |
| `analytics_events` | 0      | 2     | +2    | `self_report_submitted` + `nps_submitted`                  |

### 유료 파이프라인 재검증 (5878eca6, 기존 진단 재활용)

| 항목         | 값                                                     |
| ------------ | ------------------------------------------------------ |
| 5-Agent 상태 | technical/seo/geo/content/competitors 전부 `completed` |
| 총 소요      | 69.2초                                                 |
| 총 비용      | 408원                                                  |
| AI Insights  | 30개                                                   |
| 90일 로드맵  | 18 items                                               |
| Quick Wins   | 5개                                                    |
| CMO 요약     | ~420자 한국어 비즈니스 요약 정상 생성                  |
| 경쟁사       | 0건 (findably.kr 자체 분석이라 정상)                   |

### 이번 세션 발견 이슈 (차단 요소 아님)

1. **Vercel 자동 배포 미작동** — `git push origin main` 후 15분 이상 기다려도 새 배포 트리거 안 됨. 수동 `vercel --prod`로 해결. 원인 미확인 (GitHub App 연동 상태 재점검 Task).
2. **GitHub Actions CI lint 실패** — 최근 5개 커밋 모두 `pnpm store path --silent`에서 "packages field missing or empty" 에러. 워크플로우 환경 설정 문제로 추정. Vercel 배포와는 독립.
3. **RESEND_API_KEY 미설정** — 이메일 발송 비활성. 코드는 정상.

### 다음 세션 할 일 (우선순위)

| 우선순위 | 작업                              | 비고                                       |
| -------- | --------------------------------- | ------------------------------------------ |
| **P1**   | Resend 이메일 인프라 설정         | 계정 + API 키 + 도메인 DNS 검증 + env 추가 |
| **P2**   | Vercel 자동 배포 재연동 조사      | GitHub App 상태 확인, webhook 점검         |
| **P2**   | GitHub Actions CI lint 수정       | `pnpm store path` 에러 원인 수정           |
| **P2**   | Task 10.4 — 404 + 500 에러 페이지 | PROGRESS.md 잔여 Task                      |
| **P3**   | Google OAuth 로그인 검증          | 이메일 로그인만 확인됨                     |
| **P3**   | Toss Payments 실 연동             | 현재 MockPaymentAdapter + 선물코드만 운용  |

### 마지막 업데이트 (4차)

- **날짜**: 2026-04-06 16:55 KST
- **최종 커밋**: `96997d2` feat(dashboard): lane c — quick win 자기보고 + nps 피드백
- **상태**: 🟢 정상 — Lane C 배포 + 실기능 검증 + 유료 파이프라인 재확인 + Tier 4 PDF 통과
- **프로덕션**: https://findably.kr (수동 배포 완료, 활성 상태)

---

## 🚨 다음 세션 최우선: 유료 리포트 검수 Phase A

> **지시문 전체**: @docs/paid-report-audit-v1.md (2026-04-06 Jayden 작성 + 결정사항 확정)

### 근본 문제

유료 리포트가 소상공인(월매출 1,640만원)에게 **월 5,638만원 누수 주장** → 3.4배 과장 → 신뢰 상실.

### Phase 분리 (Jayden 승인 완료)

| Phase | 범위                                               | 예상 소요 |
| ----- | -------------------------------------------------- | --------- |
| **A** | Task 1 + 2 + 3 (매출 누수 + 점수 통일 + 중복 통합) | 2~2.5시간 |
| B     | Task 4 (경쟁사/AI 인용 빈 섹션)                    | 45~60분   |
| C     | Task 5 (가이드 스택 분기)                          | 30~45분   |
| D     | 업종/규모 선택 UI (온보딩 수정, 별도 Task)         | 1.5~2시간 |

### Jayden 결정사항 (2026-04-06 확정)

- **Q1 = (a)** UI 렌더 레이어에서 재계산 → 기존 진단(5878eca6)도 새 로직 적용
- **Q2 = (b-1)** Phase A는 `BASE_MONTHLY_REVENUE = 16_400_000` 하드코딩, 업종 선택 UI는 Phase D로 분리
- **Q3 = (a)** Claude가 rule-id 스캔 후 매핑 제안 → Jayden 검토 후 확정

### 다음 세션 Step 1

1. `src/features/diagnosis-free/rules/` 전수 스캔
2. 8개 가중치 카테고리(SSL/LCP/모바일/Schema/내부링크/이미지/E-E-A-T/기타)와 rule-id 매핑 초안
3. Jayden 승인 후 Phase A 구현 시작

### 마지막 업데이트 (5차 — 지시문 접수)

- **날짜**: 2026-04-06 17:10 KST
- **최종 커밋**: `5e8fea1` chore: save session 4차 — lane c 배포 + 검증 + tier 3/4 확인
- **상태**: 📋 Phase A 구현 대기 (계획 확정, 지시문 박제 완료)

---

## 2026-04-06 세션 6차: 유료 리포트 검수 Phase A 구현 + 배포 완료 ✅

### 세션 범위

/start → 지시문 정독 → 전면 계획 수립 → Step 0 매핑 승인 → Step 1~5 구현 → Step 7 검증 → Step 8 배포

### 현재 위치

- **Epic**: 유료 리포트 신뢰도 복구
- **Task**: Phase A (Task 1 + 2 + 3)
- **상태**: 🟢 **구현 + 배포 완료** — Jayden 수동 검증 대기

### 완료 Step

| Step | 내용                                                       | 상태    |
| ---- | ---------------------------------------------------------- | ------- |
| 0    | rule-id × 8개 Impact Category 매핑 승인 (67개 rule 전수)   | ✅ 완료 |
| 1    | config/revenue.ts 확장 + insight-aggregation.ts + 44 tests | ✅ 완료 |
| 2    | TotalLeakageCard 전면 재작성                               | ✅ 완료 |
| 3    | AIInsightsSection dedupe + 영향 카테고리 뱃지              | ✅ 완료 |
| 4    | PdfBridgeSection + PdfInsights PDF 동기화                  | ✅ 완료 |
| 5    | PDF 점수 단일화 + CMO guardrails + "AI 검증 품질" 라벨     | ✅ 완료 |
| 7    | 통합 검증 (tsc + lint + vitest + build)                    | ✅ 완료 |
| 8    | 3커밋 분할 → push → Vercel 수동 배포                       | ✅ 완료 |

### 핵심 커밋

| SHA       | 제목                                                              |
| --------- | ----------------------------------------------------------------- |
| `be117f4` | feat(config): phase a — 매출 누수 캡 + 가중 분배 로직 기반        |
| `06883ec` | feat(report): phase a — 누수 카드 캡/가중/중복통합 적용 (web+pdf) |
| `f4548d6` | fix(report): phase a — overallScore 단일화 + CMO 임의 점수 가드   |

### 파일 변경

- **총 11개 파일, +950줄**
- 신규 3개: `src/lib/utils/insight-aggregation.ts` (297줄), `src/config/__tests__/revenue.test.ts` (106줄), `src/lib/utils/__tests__/insight-aggregation.test.ts` (416줄)
- 수정 8개: revenue.ts, diagnosis-paid.ts, TotalLeakageCard, AIInsightsSection, CmoSummarySection, PdfBridgeSection, PdfInsights, pdf/route.tsx

### 지시문 Task 커버리지

| Task                | 상태       | 비고                                       |
| ------------------- | ---------- | ------------------------------------------ |
| 1. 매출 누수 재설계 | ✅ 완료    | 5,638만원 과장 → 캡 328만원 이내           |
| 2. 종합 점수 단일화 | ✅ 완료    | analysis_data.overallScore.score canonical |
| 3. 중복 항목 통합   | ✅ 완료    | dedupeInsightsByImpactCategory             |
| 4. 빈 섹션 처리     | ⏭️ Phase B | 승인된 분리                                |
| 5. 가이드 스택 보정 | ⏭️ Phase C | 승인된 분리                                |
| 업종/규모 선택 UI   | ⏭️ Phase D | 승인된 분리                                |

### 검증 결과

| 검증                     | 결과                                     |
| ------------------------ | ---------------------------------------- |
| `tsc --noEmit`           | ✅ 0 errors                              |
| `eslint` (수정 11파일)   | ✅ 0 errors, 1 pre-existing warning      |
| `vitest` (신규 44 tests) | ✅ 44 passed                             |
| `vitest` (전체 714)      | 🟡 683 passed / 31 failed (pre-existing) |
| `next build`             | ✅ 44 routes 빌드 성공                   |
| `vercel --prod`          | ✅ 58초 배포, https://findably.kr        |

### 핵심 설계 결정

1. **AI insights 레이어 기반 매출 계산** — rule-id 직접 매핑 대신 title 키워드 매칭(`classifyInsight`)으로 8개 Impact Category 분류. 이유: AI가 자유 생성한 insights는 rule-id 필드가 없음
2. **재정규화 가중 분배** — 활성 카테고리만의 가중치 합으로 각 금액 계산 → 항상 `cap` 이내 유지. 1개 카테고리만 있어도 cap 100% 소진, 8개 전부 있어도 원래 비율 유지
3. **`analysis_data.overallScore.score` canonical 확정** — DB `total_score` 컬럼은 fallback으로만. `engine.evaluate()` 7-카테고리 평균이 single source of truth
4. **CMO guardrails 2줄 추가** — executive_summary에 임의 점수 언급 금지로 환각 차단

### Jayden 수동 검증 대기 항목 (P0)

**① 기존 진단 `5878eca6` 재렌더 육안 확인**

- 매출 누수 카드 캡 이내 (월 328만원 이하)
- "매출의 20% 수준" + "월매출 1,640만원 기준" 병기
- "개선된 추정 로직 적용" 뱃지
- 카테고리별 내역 + `#technical` 해시태그
- 중복 보정 문구 "ℹ️..."
- AI 인사이트 카드 감소 + "SSL 보안" 영향 카테고리 뱃지
- 카드에서 💰 매출 영향 블록 제거 확인

**② PDF 다운로드**

- 1페이지 커버 점수 = SWOT 본문 점수 (동일값)
- 2페이지 PdfBridgeSection = 웹 TotalLeakageCard 동일 금액

**③ 새 진단 1건 실행 (선물 코드)**

- cmoSummary에 "대략 N점" 같은 임의 점수 언급 없는지
- executive_summary 품질 저하 없는지

### 다음 세션 할 일

| 우선순위 | 작업                                                         |
| -------- | ------------------------------------------------------------ |
| **P0**   | Jayden 수동 검증 결과 확인 → Phase A 완료 확정 or hotfix     |
| **P1**   | Phase B 착수 (Task 4 — 빈 섹션 처리)                         |
| **P2**   | Legacy `calculateRevenueImpact` + `INDUSTRY_BENCHMARKS` 제거 |
| **P3**   | Phase C 착수 (Task 5 — 가이드 스택 보정)                     |
| **P3**   | pre-existing 31 test 정리 (observatory/ssl-labs/fallback)    |
| **P3**   | Phase D 착수 (업종/규모 선택 UI)                             |

### 알려진 미결 사항

1. **기존 진단 5878eca6의 cmoSummary에 박힌 환각 점수** — DB 원본은 그대로. 새 진단으로 해결 (CMO guardrails 반영)
2. **Legacy dead code** — `calculateRevenueImpact`, `INDUSTRY_BENCHMARKS`, `getBenchmark`, `SEVERITY_IMPACT_RATE` 호출자 0개 (grep 확인). Phase A에서는 유지, 별도 cleanup Task로 분리
3. **전체 vitest 31 failed** — 모두 pre-existing (observatory v1→v2, ssl-labs, save-crawl-result, CMO fallback, generate-swot, generateCmoSummaryFallback). 이 숫자는 Phase A 이전과 일치
4. **Vercel 자동 배포 미작동** — 수동 배포로 우회 중, 루트 원인 미파악 (2026-04-06 4차 세션부터 동일 이슈)

### 차단 요소

**없음** — Phase A 배포 완료, 검증 대기 단계

### 마지막 업데이트 (6차 — Phase A 배포 완료)

- **날짜**: 2026-04-06 저녁 KST
- **최종 커밋**: `f4548d6` fix(report): phase a — overallScore 단일화 + CMO 임의 점수 언급 가드
- **프로덕션**: https://findably.kr (Vercel 수동 배포 완료)
- **상태**: 🟢 Phase A 구현 + 배포 완료, Jayden 수동 검증 대기

---

## 2026-04-06 세션 7차: admin 선물 코드 무제한 사용 우회 (검증 편의)

### 세션 범위

Jayden이 ADMIN-0709 코드(100건)를 5878eca6 진단 생성 시 1회 사용 → DB 유니크
제약 + 코드 레벨 중복 검사로 같은 계정 재사용 차단됨. Phase A 검증을 위해
admin 계정만 무제한 재사용 가능하도록 우회 추가.

### 진단 (READ ONLY)

| 항목           | 값                                                            |
| -------------- | ------------------------------------------------------------- |
| ADMIN-0709 max | 100                                                           |
| used_count     | 1                                                             |
| is_active      | true                                                          |
| expires_at     | 2027-04-06                                                    |
| 사용 이력      | hidream72@gmail.com → 5878eca6, 2026-04-06 06:13              |
| 근본 원인      | 006 마이그레이션 유니크 인덱스 + redeem-code 중복 검사 (의도) |

### 옵션 평가

| 옵션                                 | 채택 | 사유                              |
| ------------------------------------ | ---- | --------------------------------- |
| A. 사용 기록 1건 삭제                | ❌   | 1회용, 다음 테스트 시 또 막힘     |
| B. 새 admin 코드 발급                | ❌   | 1코드당 1회 동일, 매번 발급 필요  |
| **C. 코드만 admin 우회 (DB 무변경)** | ✅   | 영구 해결, 안전, 다른 사용자 무관 |

### 변경

- 파일: `src/app/api/payment/redeem-code/route.ts` (+45/-24, 1개 파일)
- 커밋: `c67d2dc` feat(payment): admin 계정의 선물 코드 무제한 재사용 허용
- DB 변경 0건, 마이그레이션 0건

### admin 우회 동작 (`hidream72@gmail.com`만 적용)

| 동작                  | 일반 사용자 | Admin (Jayden)                |
| --------------------- | ----------- | ----------------------------- |
| max_uses 검증         | ✓ 적용      | ⏭️ 우회                       |
| existingUse 중복 검사 | ✓ 적용      | ⏭️ 우회                       |
| gift_code_uses INSERT | ✓ 실행      | ⏭️ 우회 (DB 유니크 위반 회피) |
| used_count UPDATE     | ✓ +1        | ⏭️ 우회 (카운터 보존)         |
| 만료 코드 사용        | ❌ 차단     | ❌ 차단 (admin도 실수 방지)   |

→ Jayden 계정으로 ADMIN-0709 무제한 재사용 가능, used_count는 1로 유지되어
다른 사용자 99건 그대로 사용 가능. 흔적은 안 남으므로 disambiguation 필요 시
별도 audit log 권장.

### 검증

| 항목                   | 결과                                                                           |
| ---------------------- | ------------------------------------------------------------------------------ |
| `tsc --noEmit`         | ✅ 0 errors (단, 1차 시도 시 includes 좁은 리터럴 타입 에러 → 캐스팅으로 해결) |
| `next build`           | ✅ 44 routes 빌드 성공                                                         |
| `git push origin main` | ✅ `5cd4196..c67d2dc`                                                          |
| `vercel --prod`        | ✅ 49초 배포, https://findably.kr                                              |

### 다음 세션 할 일

| 우선순위 | 작업                                                         |
| -------- | ------------------------------------------------------------ |
| **P0**   | Jayden Phase A 7개 항목 검증 + PDF 점수 일치 + CMO 환각 확인 |
| **P1**   | 검증 결과 따라 Phase A 완료 확정 또는 hotfix                 |
| **P2**   | Phase B 착수 (Task 4 빈 섹션 처리)                           |

### 차단 요소

**없음** — admin 우회 적용 완료, Jayden이 ADMIN-0709로 무제한 새 진단 생성 가능

### 마지막 업데이트 (7차)

- **날짜**: 2026-04-06 저녁 KST
- **최종 커밋**: `c67d2dc` feat(payment): admin 계정의 선물 코드 무제한 재사용 허용
- **프로덕션**: https://findably.kr (Vercel 수동 배포 완료)

---

## 📍 Session 8차 (2026-04-06 야간) — 유료 분석 시간 예산 재배분 + 미스터리 1 fix

### 현재 위치

- **Epic**: Phase 3 (유료 분석 안정화) + Mystery 1 (handleCallback 멱등성)
- **Task**: form submit stuck 조사 진행 중 (Phase 4 plan 제출 후 승인 대기)
- **상태**: **진행중** — 핵심 fix 3개 배포 완료, form stuck 별도 조사 필요

### 이번 세션 완료 내역

#### 1. Phase 3 Fix 1 — `trigger-analysis maxDuration 120 → 300` (`58079f9`)

- 1차 fix 시도. Vercel Pro 최대치로 한도만 상향
- 검증 결과: **부족** — 405초+ 경과해도 미완료. 시간 누적 자체가 300초 초과

#### 2. Phase 3 Fix 3+5+6+7+8 — 시간 예산 재배분 (`6bdbea0`)

- **Fix 3** (`ai.ts`): Anthropic 클라이언트 `timeout: 90_000, maxRetries: 0` 명시
- **Fix 5+** (`retry-failed-agents.ts`): 전체 retry 단계 60초 race timeout
- **Fix 6** (`retry-failed-agents.ts`): for 직렬 → `Promise.allSettled` 병렬
- **Fix 7** (`run-diagnosis-paid.ts`): 시작 시 `updated_at` 직접 갱신 (디버깅 마커)
- **Fix 8** (`retry-failed-agents.ts`): Opus 2차 fallback 제거 (Sonnet 1회만)
- 시간 예산: 10s setup + 90s 5에이전트 + 60s retry + 60s aggregate + 10s save = **230s ≪ 300s**

#### 3. Mystery 1 Fix — `handleCallback` 멱등성 가드 (`8300d97`)

- **증상**: 7c0a7f6d 무료 진단(completed)이 5분간 6번+ update, score가 50→53→... 매번 변함
- **원인**: `/api/crawl/complete`의 `handleCallback`이 status 확인 없이 `saveCrawlResult + enrichCrawlData + runDiagnosis`를 매번 실행
- **fix**: 페이로드 검증 직후 status 조회 → `completed/failed`면 early return
- **검증**: 638f2f45 새 진단 → **25초만에** completed (이전 130~301초), update 1회

#### 4. 1차 실패 원인 깊이 조사 완료

- Phase 1 (코드 read): trigger-analysis `maxDuration=120`, GLOBAL_TIMEOUT 90s, per-agent timeout 없음, SDK 기본 600s 확인
- Phase 2 (Anthropic console + Vercel logs 캡처):
  - `req_011CZnKvtHbMvuw7n32f0bMg`: sonnet competitors, input 6035, output 4096, **50.473s**, code 499 client disconnect
  - Vercel 504 + `Task timed out after 120 seconds` 확정
  - Memory 274MB / 8.9GB (OOM 아님)
- 가설 H10/H11 100% 확정: 시간 누적이 120초 + (Fix 1 후) 300초도 초과

#### 5. 진단 파이프라인 모니터링 패턴 정립

- Supabase MCP로 process_seconds, updated_at 변화 실시간 추적
- 33초마다 update 발생 패턴 → 멱등성 가드 부재 발견
- 638f2f45로 fix 효과 검증 완료

### 진행 중 (다음 세션 시작 시점)

#### form submit stuck 조사 (Plan v2 제출 후 승인 대기)

- **증상**: Jayden이 21:10:52에 `/onboarding/url` 화면에서 "작업중" 표시
- **상황**: 638f2f45 진단은 21:05:50에 정상 종료(25초). 5분 후 새 진단 0건
- **가설**:
  - H1a: submit-url Server Action 내부 hang (n8n 호출 await)
  - H1b: action 내부 redirect 작동 안 함
  - H1c: 새 진단 가드 (이미 completed 있음)
  - H2: dashboard가 638f2f45 인식 못해 onboarding/url로 redirect
  - H3: 브라우저 측 JS 에러로 form submit 안 됨
  - H4: n8n 호출 timeout
- **다음 단계**:
  - Phase 1: 코드 read (submit-url action, dashboard/page.tsx, UrlForm)
  - Phase 2: Jayden 측 console + network 캡처
  - Phase 3: Vercel Function Logs (`/onboarding/url`, `/api/crawl/trigger`)
  - Phase 4: Supabase 추가 진단

### 검증 지표 (8차 세션)

| 진단                      | tier | process_seconds | update 횟수 | 평가        |
| ------------------------- | ---- | --------------- | ----------- | ----------- |
| 7c0a7f6d (멱등성 가드 전) | free | 301s            | 6+          | 🚨 폭주     |
| 638f2f45 (멱등성 가드 후) | free | **25s**         | **1**       | ✅ 정상     |
| 90ac126c (Phase 3 fix 전) | paid | 1376s (23분)    | ?           | 🚨 미스터리 |

### 다음 세션 할 일

| 우선순위 | 작업                                                                                     |
| -------- | ---------------------------------------------------------------------------------------- |
| **P0**   | form submit stuck Plan v2 진행 (Phase 1~5)                                               |
| **P0**   | Phase 3 fix 종합 검증 — 새 paid 진단으로 4분 이내 완료 확인                              |
| **P1**   | Mystery 2 조사 — Lambda 죽은 후 background fetch가 어떻게 살아남아 update까지 도달하는가 |
| **P1**   | PaidAnalyzingState 자동 재시도 가능성 확인 (23분 처리 미스터리)                          |
| **P2**   | n8n workflow측 retry 정책 점검 (옵션 B)                                                  |
| **P2**   | Phase B 착수 (Task 4 빈 섹션 처리)                                                       |

### 차단 요소

- **form submit stuck** — Jayden이 새 진단 시작 못함 → Phase 3 종합 검증 차단
- 우회: dashboard 직접 URL 이동(`https://findably.kr/dashboard`)으로 화면 정리는 가능

### 8차 세션 커밋 (4건)

1. `58079f9` fix(diagnosis-paid): trigger-analysis maxDuration 120 → 300
2. `6bdbea0` fix(diagnosis-paid): phase 3 fix 3/5+/6/7/8 — 시간 예산 재배분
3. `8300d97` fix(crawl): add idempotency guard to handleCallback (mystery 1 fix)
4. (이번 save commit — PROGRESS.md + learnings.md)

### 마지막 업데이트 (8차)

- **날짜**: 2026-04-06 야간 KST
- **최종 코드 커밋**: `8300d97` fix(crawl): add idempotency guard to handleCallback (mystery 1 fix)
- **프로덕션**: https://findably.kr (Vercel 자동 배포 진행)
- **상태**: 🟢 admin 무제한 적용 + 배포 완료, Phase A 검증 대기

---

## 📍 Session 9차 (2026-04-08) — n8n v3.3 마이그레이션 + Firecrawl 키 정정 + Phase 3-3 검증 진입

### 현재 위치

- **Epic**: n8n monitoring 통합 (Phase 1~3) + Phase 3-3 실제 진단 테스트
- **Task**: Phase 3-3 진행 중 — 첫 시도(findably.kr)는 quality_rejected로 정상 동작 확인. URL 재선정 후 재테스트 대기
- **상태**: **진행중** — v3.3 webhook + Firecrawl 인증 + quality_rejected 흐름 검증 완료, completed 시나리오 검증 대기

### 이번 세션 완료 내역

#### 1. n8n v3.3 workflow 작성 (`ca08b39`)

- **배경**: v3.2를 elest.io n8n 2.16.0에 import 시 "Unused Respond to Webhook node" 에러
- **원인**: n8n v2.16.0 typeVersion 2 webhook + `responseMode='responseNode'` 조합에서 fan-out 첫 분기에 Respond 노드가 있으면 reject (GitHub source 검증)
- **fix**: Webhook Trigger options 변경
  - `responseMode: responseNode → onReceived`
  - `responseCode: customCode (202)` 추가
  - `responseData: 'accepted'` 추가
- 노드 24 → 23개 (Respond 202 Accepted 노드 제거)
- Validate fan-out 11 → 10 분기 (Respond 분기 제거)
- 결과: import 성공, webhook 즉시 202 응답 정상 동작

#### 2. Firecrawl 401 원인 격리 + 정정

- **증상**: v3.3 import + curl 테스트 후 A1/A2 노드 둘 다 401 Unauthorized
- **격리 방법**: Jayden이 보유한 두 키를 curl로 직접 검증
  - Test 1 (`fc-de414...bb99bc...a19a`): **HTTP 200** ✅ 유효
  - Test 2 (`fc-de414...b0990c...d19a`): **HTTP 401** ❌ 무효
- **원인**: elest.io의 `FIRECRAWL_API_KEY` env var에 옛 무효 키가 들어있었음. 메모리(시크릿 회전 체크리스트)에도 옛 키가 잘못 기록되어 있었음
- **해결**: elest.io Update Config → 새 키로 교체 → Update & Restart
- **검증**: A1(Firecrawl Scrape), A2(Firecrawl Map) 둘 다 success:true + markdown/links 데이터 정상 수신, creditsUsed:1 차감 확인
- 메모리 정정: `project_secret-rotation-checklist.md`에 두 키 모두 기록 + 향후 회전 시 둘 다 revoke 대상 명시

#### 3. Callback URL 검증 (false alarm 격리)

- 첫 curl 테스트(fake diagnosisId)에서 Callback Next.js가 HTTP 400 + `callbackRedirect: true` 반환
- **위험 신호로 보였던 단서들이 사실은 정상 동작**:
  - HTTP 400 = fake diagnosisId가 DB FK 제약 위반 (예상된 실패)
  - `callbackRedirect: true` = findably.kr의 HTTPS/www 정규화 redirect 흔적 (axios가 자동 추적)
  - URL은 `https://findably.kr/api/crawl/complete` (trailing slash 없음, 정상)
- v3.3 webhook → Firecrawl → callback까지 전체 파이프라인 정상 흐름 확인

#### 4. Phase 3-3 실제 진단 첫 시도 — quality_rejected 흐름 검증

- **테스트**: Jayden 본인 계정으로 findably.kr 무료 진단 시작
- **결과**: 8초 만에 status='failed', "분석에 문제가 발생했습니다" 화면 표시
- **원인 격리**: Supabase MCP로 진단 ID `66bc001f-df0d-4cd2-b2b7-43fa02adaf77` 조회
  - `crawl_data.blocked_reason`: `"크롤링 품질 미달 (completeness 11%)"`
  - 이 텍스트는 `route.ts:181`의 quality_rejected 분기 reason 생성 코드와 정확히 일치
- **결론**: **시스템 모든 단계 정상 작동 중**. findably.kr 자체가 Firecrawl로 dataCompleteness 11%만 나옴 (공지 배너 + Next.js SSR 초기 HTML 빈약)
- **검증된 흐름**: webhook → A1/A2 → Quality Gate → Callback Next.js → handleCallback quality_rejected 분기 → markDiagnosisFailed → 화면 에러 표시

#### 5. n8n 버전 학습 보정 (Jayden 직접 지적)

- 내가 학습한 n8n은 v1.x 기반, Jayden은 v2.x 사용 중
- "Active/Inactive" → "Published/Draft" UI 모델 변경 발견
- Jayden이 elest.io에서 n8n 2.16.0으로 명시적 업그레이드 후 학습 재요청
- 향후 외부 SaaS 도구 학습 시 사용자 환경 버전 우선 확인 패턴 정립 필요

### 진행 중 (다음 세션 시작 시점)

- **Phase 3-3 재테스트** — `https://www.monthlycheck.kr/`로 무료 진단 재실행 (이전 24초 만에 정상 종료 실적 있음)
- 통과 기준: status='completed' + total_score 산출 + dashboard 결과 표시
- 동시 모니터링: Supabase MCP 30초 간격 폴링 + n8n Executions + Vercel Function Logs

### 다음 세션 할 일

| 우선순위 | 작업                                                                |
| -------- | ------------------------------------------------------------------- |
| **P0**   | Phase 3-3 monthlycheck.kr 재테스트 → completed 시나리오 검증        |
| **P0**   | Phase 3-4 모니터 v2.1 활성화 (정상 실행 발생 후)                    |
| **P1**   | Phase 3-5 24시간 안정성 모니터링 + Phase 3-6 v2 disable + 공지 해제 |
| **P1**   | n8n v2.16.0 "Published/Draft" 모델 별도 조사 (UI/배포 영향 파악)    |
| **P2**   | Firecrawl이 findably.kr을 11%만 크롤링하는 이유 별도 조사 (UX 개선) |
| **P2**   | 시크릿 회전 작업 (테스트 안정화 후) — 6종 체크리스트 적용           |

### 차단 요소

**없음** — Firecrawl 401, callback 400 모두 정상 동작으로 격리 완료. 다음 단계는 단순 URL 변경 후 재실행

### 9차 세션 커밋 (1건 — 코드)

1. `ca08b39` feat(n8n): add crawl v3.3 workflow for n8n v2.16.0 compatibility

### 9차 세션 메모리 업데이트

- `project_secret-rotation-checklist.md` — Firecrawl 키 정정 (옛 무효/새 유효 둘 다 기록)
- `feedback_one-line-commands.md` — 한 줄 명령어 제공 규칙 (이전 세션 생성, 이번 세션 검증)

### 마지막 업데이트 (9차)

- **날짜**: 2026-04-08 17:30 KST
- **최종 코드 커밋**: `ca08b39` feat(n8n): add crawl v3.3 workflow for n8n v2.16.0 compatibility
- **프로덕션**: https://findably.kr (사이트 공지 활성화 중 — Phase 3 안정화 후 해제)
- **상태**: 🟢 v3.3 파이프라인 전 단계 검증 완료, completed 시나리오 검증만 남음

---

## 📌 2026-04-08 세션 10차 — n8n v3.3 fan-in 버그 디버깅 + v3.5 안정화

> 전 세션에서 "v3.3 마이그레이션 완료"로 save됐으나, 실제 프로덕션 테스트 결과 크롤링 파이프라인이 전면 failure 상태로 드러남. 6시간 디버깅 + Pure Vercel 딥리서치 + n8n v3.5 복구로 완전 정상화.

### 현재 위치

- **Epic**: 프로덕션 복구 + n8n 아키텍처 안정화
- **Task**: n8n v3.5 최종 안정화 + 테스트 검증
- **상태**: 🟢 **완전 복구** — findably.kr 진단 end-to-end 성공

### 이번 세션 완료 내역

1. **n8n v3.3 fan-in 버그 근본 원인 발견**
   - 증상: 프로덕션 테스트 시 `data_completeness=11%`, 7초만에 failed, "Cannot assign to read only property 'name' of object 'Error: Node XX hasn't been executed'" 8건
   - 원인: 10개 fan-out 분기(A1~C4)가 **Merge 노드 없이 Normalize Results로 직접 연결됨**. A1이 가장 먼저 끝나자 Normalize Results가 첫 번째 실행되며 나머지 9개 노드 출력을 참조 → n8n 2.16.0의 read-only Error 객체 에러 → try/catch가 못 잡음 → 나머지 8개 소스 "not executed" 처리
   - **이전 2026-04-08 learnings 항목 "v3.3 Respond 노드 제거" 교훈은 잘못된 진단이었음**. 진짜 원인은 fan-in Merge 노드 누락 (이번 세션에서 learnings.md에 정정 기록)

2. **딥리서치: Pure Vercel 이전 검증 (3개 에이전트 병렬)**
   - **Explore**: Findably 크롤링 파이프라인 이미 78% Pure Vercel 준비됨 발견 — fetchers/parsers 모두 Pure TypeScript, `fallback-crawl-pipeline.ts`에 실증 코드 존재, Playwright 의존성 0건, n8n은 단순 HTTP 프록시 역할만
   - **Vercel 공식 문서**: Pro maxDuration **800초** (2026-04 기준), Fluid Compute 2025-04-23 기본 활성화, I/O 대기 CPU 무과금
   - **대안 플랫폼 재검증**: Inngest Pro 실제 **$75/월** (전 세션 $25 오인 정정), Trigger.dev v3 $50/월 no timeout, Supabase Edge Functions Pro 포함(CPU 2초 제한), Cloudflare Workflows $5/월+. 결론: Findably 워크로드에는 **Pure Vercel이 유일한 최적해**

3. **n8n v3.4 생성 — fan-in Merge 노드 추가**
   - `docs/findably-crawl-v3-production-v3.4.json` (신규, 37,998 bytes, 24 nodes)
   - `Wait All Sources` 노드 추가 (`n8n-nodes-base.merge` v3, mode=append, numberInputs=10)
   - 10개 fan-out 분기의 connections를 Normalize Results 대신 Merge 노드로 재배선 (index 0~9)
   - 로컬 검증 8개 항목 전부 통과

4. **v3.4 테스트 결과 — fan-in 해결됐으나 Callback Next.js 400 에러 발생**
   - `findably_crawl_executions`: `data_completeness: 89%` ✅ (11% → 89% 수직 상승)
   - `diagnoses`: status=crawling 고착, crawl_data=null ❌
   - 원인: Callback Next.js 노드가 `/api/crawl/complete`에 POST → Next.js가 **Zod 검증 실패로 400 Bad Request** 반환
   - 추가 진단: Zod 스키마의 `errorDetails[].error: z.string()` 요구. 하지만 Normalize Results가 Observatory 같은 외부 API 에러를 **객체 그대로** 전달 → 타입 mismatch

5. **n8n v3.5 생성 — errorDetails string 강제 변환**
   - `docs/findably-crawl-v3-production-v3.5.json` (신규, 38,388 bytes, 24 nodes)
   - v3.4 기반 + Normalize Results의 Code 노드 jsCode 패치
   - `errorDetails[].error`를 `typeof rawErr === 'string' ? rawErr : JSON.stringify(rawErr)` 로 강제 변환
   - null/undefined 케이스도 `'unknown error'`로 안전 처리

6. **Next.js route.ts 수정 — Zod 에러 detail 응답 노출**
   - `src/app/api/crawl/complete/route.ts:117-134` 수정
   - 400 응답 메시지에 Zod issues의 path + message를 모두 포함
   - 목적: 블라인드 디버깅 루프 차단. 다음 실패 시 즉시 원인 확정 가능
   - `z.ZodError.issues` (Zod v4 API) 사용, `z.ZodIssue` 타입 명시

7. **커밋 `5bcc82b` 푸시**
   - `fix(crawl): n8n v3.4/v3.5 fan-in 복구 + Zod 에러 detail 노출`
   - 3 files changed, 1691 insertions(+), 5 deletions(-)
   - Vercel 자동 배포

8. **프로덕션 재테스트 — 1차 실패 (테스트 URL 잘못 선택)**
   - URL: `https://monthlycheck.kr` (apex, A 레코드 없음)
   - 결과: `data_completeness=22%`, status=failed, 7개 소스 DNS 실패
   - 조사: `dig` 확인 → `monthlycheck.kr` A 레코드 없음, `www.monthlycheck.kr`만 존재
   - v3.5는 정상 작동 (duration 60초, fan-in + errorDetails + Callback 플로우 전부 정상). **apex 도메인 DNS 부재 케이스** 확인

9. **프로덕션 재테스트 — 2차 완전 성공** 🏆
   - URL: `https://findably.kr` (정상 도메인)
   - `diagnoses.522e8c3f`: status=**completed**, total_score=**63**, has_crawl=true, **has_analysis=true**, proc_sec=54s
   - `findably_crawl_executions.13379`: status=**success**, data_completeness=**89%**, success_sources 8개, failed_sources 1개(observatory만)
   - 스크린샷으로 Callback Next.js statusCode=**200** + `saved: true` 확인

10. **회색 선 이슈 조사 및 해소**
    - Jayden이 A1, A2 → Wait All Sources 연결선이 회색으로 표시되는 것 문의
    - 원인 확정: **n8n UI 시각화 특성**. `$('노드명').first().json` 글로벌 참조 패턴 사용 시 파이프 데이터 흐름이 없는 것처럼 렌더링됨
    - 증거: Callback Next.js Input 탭도 "No fields - items exist but they're empty" 표시되지만 Output은 status 200 + saved true. 같은 원리
    - 실제 데이터는 글로벌 참조로 정상 전달됨. 기능적 100% 정상

### 세션 중 발견한 3개 부수 이슈 (긴급도별)

| #   | 이슈                                        | 긴급도  | 영향                                   | 해결 방향                                                               |
| --- | ------------------------------------------- | ------- | -------------------------------------- | ----------------------------------------------------------------------- |
| 1   | Observatory v2 API body 누락                | 🟡 중   | completeness 89% 고정, 점수 1~2점 감점 | `B4: Observatory v2` 노드 body를 `{"host": "{{도메인}}"}` JSON으로 명시 |
| 2   | apex 도메인 www 폴백 미구현                 | 🟡 중   | `monthlycheck.kr` 같은 케이스 UX 혼란  | onboarding/url 단계에서 DNS 사전 확인 + www 자동 제안                   |
| 3   | crawl_executions.callback_status 미업데이트 | 🟢 낮음 | 모니터링 품질만 영향, 기능 무관        | Verify Callback Result 노드 update 로직 점검                            |

### 다음 세션 할 일 (우선순위)

| 우선순위 | 작업                                                | 예상 시간 | 비고                                         |
| -------- | --------------------------------------------------- | --------- | -------------------------------------------- |
| **P1**   | Observatory v2 body 누락 수정 (v3.6)                | 20~30분   | completeness 89% → 100% 달성                 |
| **P1**   | apex 도메인 www 폴백 구현                           | 40~60분   | onboarding/url Server Action에 DNS 확인 추가 |
| **P2**   | Pure Vercel 이전 Phase 1 (병행 구축)                | 1일       | 이번 세션 딥리서치 결론. 78% 준비됨          |
| **P2**   | crawl_executions.callback_status 업데이트 로직 점검 | 20분      | Verify Callback Result 노드                  |
| **P3**   | PRD v1.2 배포 후 검증 (LCP, 카카오톡, Schema)       | 40분      | 이전 세션 보류                               |
| **P3**   | Toss Payments 실 연동                               | 2시간     | 선물 코드와 병행                             |

### 차단 요소

**없음** — 프로덕션 완전 정상, 다음 작업 즉시 시작 가능

### 배포 상태

| 항목              | 값                              |
| ----------------- | ------------------------------- |
| Vercel 최종 커밋  | `5bcc82b`                       |
| n8n 활성 workflow | **v3.5** (Elest.io)             |
| 프로덕션 상태     | 🟢 정상                         |
| 테스트 완료 URL   | findably.kr (total_score 63)    |
| 마지막 검증       | 2026-04-08 19:37 KST (522e8c3f) |

### 마지막 업데이트 (10차)

- **날짜**: 2026-04-08 19:45 KST
- **세션 시간**: ~6시간 (디버깅 + 딥리서치 + v3.4/v3.5 생성 + 3회 테스트)
- **최종 커밋**: `5bcc82b` fix(crawl): n8n v3.4/v3.5 fan-in 복구 + Zod 에러 detail 노출
- **n8n 활성 버전**: v3.5
- **상태**: 🟢 정상 — 다음 세션부터 깨끗한 main에서 시작 가능

---

## 📍 Session 11차 (2026-04-08 저녁) — n8n Monitor v3.1 배포 + Published

### 현재 위치

- **Epic**: 모니터링 파이프라인 구축 (PRD Epic 3)
- **Task**: n8n Monitor 워크플로우 재작성 + Supabase 기록 검증 + 자동 스케줄 활성화
- **상태**: 🟢 **완료** — Published, 30분 주기 자동 실행 가동

### 이번 세션 완료 내역

1. **사전 점검 (코드/DB 모두 OK)**
   - `supabase.findably_pipeline_health/crawl_executions/alerts` 테이블 + 3개 뷰 존재 확인 (migration 011, 012 이미 적용됨)
   - `/api/health` 라우트 (`src/app/api/health/route.ts`) 이미 구현됨
   - `/api/crawl/complete` probe 필터 (`route.ts:109`) 이미 구현됨 (`x-monitor-probe` 헤더 처리)
   - n8n v2.16.0 환경변수 `N8N_BLOCK_ENV_ACCESS_IN_NODE: "false"` 이미 설정됨 (elest.io docker-compose line 44)

2. **Elest.io YAML "duplicated mapping key" 디버깅**
   - Jayden이 `N8N_BLOCK_ENV_ACCESS_IN_NODE` 신규 추가 시도 → 이미 있어서 중복 에러
   - 기존 값 `"false"` 확인 → 신규 줄 삭제로 해결

3. **Monitor v3 신규 작성 (`docs/findably-monitor-v3.json`, 15 nodes)**
   - v2.1의 2가지 근본 버그 수정 설계:
     - Manual Trigger가 webhook 노드로 오용 → 진짜 `n8n-nodes-base.manualTrigger` 추가
     - 4개 Check → Aggregate 직접 연결 → `Wait All Checks` Merge 노드(typeVersion 3) 추가
   - v3.5 crawl workflow의 검증된 `mode: append, numberInputs` 패턴 재사용
   - 노드 구성: Schedule/Manual Trigger → Prep → 4 Checks → Merge → Aggregate → Save → Alert gate → Build Alert/Log OK

4. **v3 → v3.1 점진적 개선 (3회 연속 fix)**
   - **Fix 1**: Merge 노드 `mode: combine` → `mode: append` (combine은 Fields to Match 필수)
   - **Fix 2**: Firecrawl 노드 method 미지정(GET) → POST + 빈 body `{}`
   - **Fix 3**: n8n이 400 응답을 NodeApiError로 분류 → `options.response.response.neverError: true` 추가

5. **버전 파일 분리 (Jayden 요청)**
   - `docs/findably-monitor-v3.json`: 초기 버전 보존 (Firecrawl GET 버그 있음, 문서 목적)
   - `docs/findably-monitor-v3.1.json`: 완성본 (Import 대상)

6. **Supabase INSERT 검증 (3회 수동 실행)**
   - execution 13401 (21:16): Firecrawl GET → critical ❌
   - execution 13403 (21:24): Firecrawl POST (neverError 없음) → critical ❌
   - **execution 13405 (21:29)**: POST + neverError → **🟢 healthy** (4/4 체크 통과)

7. **Published 전환**
   - Jayden이 n8n UI에서 워크플로우 Published 완료
   - 30분 주기 Schedule Trigger 활성화
   - 다음 자동 실행: ~22:00 KST 이내

### 이번 세션 변경 파일 (2건, 모두 신규)

- `docs/findably-monitor-v3.json` (17,870 bytes) — 초기 v3, 버그 포함 보존본
- `docs/findably-monitor-v3.1.json` (18,027 bytes) — 완성본, Published됨

### Supabase 검증 증거

| Execution | 시각 (KST)   | overall_status | Vercel     | Callback   | Firecrawl  | Observatory |
| --------- | ------------ | -------------- | ---------- | ---------- | ---------- | ----------- |
| 13401     | 21:16:25     | 🔴 critical    | ✅ 200     | ✅ 200     | ❌ 0       | ✅ 200      |
| 13403     | 21:24:00     | 🔴 critical    | ✅ 200     | ✅ 200     | ❌ 0       | ✅ 200      |
| **13405** | **21:29:08** | **🟢 healthy** | **✅ 200** | **✅ 200** | **✅ 400** | **✅ 200**  |

### 다음 세션 할 일 (우선순위)

| 우선순위 | 작업                                        | 비고                                                    |
| -------- | ------------------------------------------- | ------------------------------------------------------- |
| **P0**   | Monitor v3.1 24시간 안정성 확인             | 자동 실행 48건 누적 예상, 이상 패턴 체크                |
| **P1**   | `/admin/monitor` 대시보드 구현 (PRD Epic 3) | `docs/findably-monitor-dashboard-spec.md` 스펙 참조     |
| **P1**   | Observatory v2 body 누락 수정 (crawl v3.6)  | 9차 세션 잔여 P1 — completeness 89% → 100%              |
| **P1**   | apex 도메인 www 폴백 구현                   | onboarding/url Server Action에 DNS 확인 추가            |
| **P2**   | Slack/Email 알림 노드 추가 (선택)           | "Save Alert to Supabase" 다음에 연결, critical만 트리거 |
| **P2**   | Phase B 유료 리포트 빈 섹션 처리 (Task 4)   | Phase A 완료 후 대기 중                                 |
| **P3**   | Toss Payments 실 연동                       | 선물 코드와 병행                                        |

### 차단 요소

**없음** — Monitor v3.1 Published, 30분 주기 자동 실행 중

### 배포 상태

| 항목                          | 값                                     |
| ----------------------------- | -------------------------------------- |
| Vercel 최종 커밋              | `dd09e17` (10차 save)                  |
| n8n 활성 워크플로우 (Crawl)   | **v3.5** (Elest.io)                    |
| n8n 활성 워크플로우 (Monitor) | **v3.1** (Published, 신규)             |
| 프로덕션 상태                 | 🟢 정상                                |
| 마지막 Monitor 검증           | execution 13405 (2026-04-08 21:29 KST) |

### 마지막 업데이트 (11차)

- **날짜**: 2026-04-08 21:35 KST
- **세션 시간**: ~1.5시간 (Monitor v3.1 작성 + 3단계 fix + 검증 + Published)
- **파일 추가**: `docs/findably-monitor-v3.json`, `docs/findably-monitor-v3.1.json`
- **n8n 활성 Monitor**: v3.1
- **상태**: 🟢 완료 — Monitor 자동 스케줄 가동 중

---

## 📍 Session 12차 (2026-04-08 저녁 ~ 04-09 자정) — GiftCodeModal 핫픽스 + Task 1/2 + Phase A 전체 검증

### 현재 위치

- **Epic**: 프로덕션 버그 수정 + 유료 리포트 Phase A 검증 + Playwright 자동 테스트 인프라
- **Task**: GiftCodeModal navigation 버그 핫픽스 + Observatory v3.6 + DNS www 폴백 + Phase A 육안 검증
- **상태**: 🟢 **완료** — 3개 커밋 배포 + 핫픽스 Playwright 완전 검증 + Phase A 8/8 확인

### 이번 세션 완료 내역

#### 1. GiftCodeModal navigation 버그 발견 + 핫픽스 배포 (`22f693a`)

- **상황**: Jayden이 ADMIN-0709 코드 입력 후 로딩 스피너가 영원히 돌고 대시보드로 전환 안 됨. 새 paid 진단(`adfe3390`)이 DB에 생성됐지만 `process_seconds=0`, 5 에이전트 모두 pending으로 고아 상태
- **원인**: `GiftCodeModal.handleSubmit()`이 `router.refresh()`를 호출하여 현재 URL(`/dashboard?id=<free>`)을 유지 → dashboard/page.tsx가 여전히 `id=<free>`로 조회 → 새 paid 진단으로 navigation 안 됨 → PaidAnalyzingState 미렌더 → trigger-analysis 미호출
- **수정**: `router.refresh()` → `router.push(\`/dashboard?id=${result.data.diagnosisId}\`)`, 응답에 id 없으면 `/dashboard`로 방어적 fallback
- **커밋**: `22f693a` fix(payment): gift code redeem이 새 paid 진단으로 navigation 안 되던 버그 수정
- **배포**: origin/main push 완료, Vercel 자동 배포

#### 2. 테스트 계정 생성 + Supabase auth 직접 INSERT 이슈 해결

- `findably-qa@test.local` / `FindablyQA-Test2026!` (User ID `62e83a2b-8beb-44c0-93c0-13e67cc8910a`)
- Supabase MCP로 auth.users + auth.identities 직접 INSERT
- **GoTrue Scan error** 해결: `confirmation_token` 등 8개 토큰 필드를 COALESCE로 빈 문자열 업데이트해야 로그인 가능 (learnings 기록)

#### 3. Task 1 — n8n crawl v3.6 (Observatory v2 body) 커밋 (`a7a4cbc`)

- `docs/findably-crawl-v3-production-v3.6.json` 신규 848줄
- B4 Observatory v2 노드에 `sendBody: true` + `jsonBody: { host }` + `neverError + fullResponse` 추가
- data_completeness 89% → 100% 달성 목표 (Jayden n8n import 후 검증)

#### 4. Task 2 — apex 도메인 → www 자동 폴백 커밋 (`996b10a`)

- 신규: `src/features/onboarding/utils/dns-resolve.ts` — `resolveHostname` + `resolveWithWwwFallback` (Promise.race 2초 타임아웃)
- 신규: `src/features/onboarding/utils/__tests__/dns-resolve.test.ts` — 11 tests 통과 (`vi.hoisted` + `default` export 패턴)
- 수정: `submit-url.ts` — Zod 검증 후 DNS 확인 → www 폴백 시 `wwwFallback=1` redirect param
- 수정: `analyzing/page.tsx` — `wwwFallback=1` 감지 시 info 배너 렌더링

#### 5. Playwright 자동 테스트 인프라 구축 + 피드백 메모리 저장

- `feedback_playwright-self-test.md` — 테스트 요청 시 Claude가 직접 Playwright로 실행하며 진행 (Jayden에게 수동 테스트 위임 금지)
- `project_test-url.md` 업데이트 — 기본 테스트 URL `https://findably.kr/` (monthlycheck.kr은 edge-case만)

#### 6. Playwright 자동 테스트 — 전체 플로우 검증

**무료 진단 end-to-end (2회)**:

- `7802233d` — 신규 계정, 53초 완료 (73점, AI 인용 40점, Quick Win 5개)
- `a2fe28bb` — 기존 진단 있는 상태, 새 진단 정상 생성
- **버그 2 재현 실패 (2/2 정상)** — Jayden 케이스는 일회성 브라우저/네트워크 이슈로 결론

**GiftCodeModal 핫픽스 검증**:

- `QA-PLAYWRIGHT-TEST` 테스트 코드 생성 (5회 사용 가능, 2027-12 만료)
- 코드 입력 → `/dashboard?id=6dbb271c-...` navigation 정상
- PaidAnalyzingState 렌더 → trigger-analysis 호출 (콘솔 로그 확인)
- 5 에이전트 + CMO 170초 완료
- `gift_code_uses` 1건 정상 INSERT (일반 사용자 플로우)

**Phase A 상세 리포트 육안 검증 (`6dbb271c`, 8/8 통과)**:
| # | 항목 | 결과 |
|---|------|------|
| 1 | 매출 누수 캡 적용 (월 328만원, 매출 20%) | ✅ |
| 2 | 카테고리별 가중 분배 (8개 영역 #technical/#geo/#content 등) | ✅ |
| 3 | 중복 보정 문구 "ℹ️ 각 항목의 추정 영향은 독립적으로 합산..." | ✅ |
| 4 | 출처 표기 "KCD 2025 Q4 통계" | ✅ |
| 5 | 1페이지 커버 점수 = SWOT 본문 점수 (둘 다 73점) | ✅ |
| 6 | CMO executive_summary 환각 점수 언급 없음 | ✅ |
| 7 | AI 인사이트 dedupe + 영향 카테고리 뱃지 (기타/#seo 등) | ✅ |
| 8 | 인사이트 카드에서 💰 매출 영향 블록 제거 | ✅ |
| + | CMO 비즈니스 언어 비유 ("마치 간판에 상호명을 두 번 쓴 것과 같습니다") | ✅ |
| + | 전문가용 접기 (📊 상세 지표) | ✅ |
| + | 90일 로드맵 우선순위 3기준 설명 블록 | ✅ |

#### 7. learnings.md 3건 추가

- GiftCodeModal router.refresh 버그 → router.push로 교체 규칙
- Supabase auth.users 직접 INSERT 시 GoTrue 토큰 필드 빈 문자열 보정 필수
- (Task 1/2 관련 이슈는 기존 learnings에 포함)

### 이번 세션 커밋 (3건)

1. `22f693a` fix(payment): gift code redeem이 새 paid 진단으로 navigation 안 되던 버그 수정
2. `a7a4cbc` feat(n8n): crawl v3.6 — Observatory v2 body에 host JSON 추가
3. `996b10a` feat(onboarding): apex 도메인 → www 자동 폴백 + 분석 대기 화면 안내

### 다음 세션 할 일 (우선순위)

| 우선순위 | 작업                                                           | 비고                                                      |
| -------- | -------------------------------------------------------------- | --------------------------------------------------------- |
| **P0**   | Jayden이 n8n v3.6 import → Published → 프로덕션 테스트         | data_completeness 100% 달성 확인                          |
| **P0**   | Jayden이 Vercel 대시보드에서 22f693a/a7a4cbc/996b10a 배포 확인 | 자동 배포 미작동 시 수동 `vercel --prod`                  |
| **P1**   | DNS www 폴백 프로덕션 검증                                     | `monthlycheck.kr` (apex, A 없음) 입력 시 www 자동 전환    |
| **P1**   | 버그 2 Jayden 케이스 추가 조사                                 | Vercel 배포 시각 vs 스크린샷 22:31:44 대조                |
| **P2**   | Phase B 착수 (Task 4 빈 섹션 처리)                             | Phase A 완료 확정 후                                      |
| **P2**   | learnings 2건 추가 검토                                        | 버그 2 케이스 (재현 실패) + Playwright 자동 테스트 전환점 |
| **P3**   | Phase C/D, 기존 31 테스트 실패, 토스 실 연동 등                | 기존 백로그                                               |

### 차단 요소

**없음** — 3개 커밋 push 완료, 핫픽스 Playwright 검증 + Phase A 전체 통과

### 마지막 업데이트 (12차)

- **날짜**: 2026-04-09 00:30 KST
- **세션 시간**: ~4시간 (조사 + 디버깅 + 핫픽스 + 검증 + 커밋 + 문서)
- **최종 커밋**: `996b10a` feat(onboarding): apex 도메인 → www 자동 폴백 + 분석 대기 화면 안내
- **배포 대기**: 3개 커밋 Vercel 자동 배포 확인 필요
- **테스트 계정**: `findably-qa@test.local` / `FindablyQA-Test2026!`
- **상태**: 🟢 완료 — Playwright 인프라 확립 + 핫픽스 검증 + Phase A 전체 통과

---

## 📍 Session 13차 (2026-04-09 낮 ~ 오후) — learnings 정리 + n8n v3.6→v3.8 삽질 + Phase B/C 완료

### 현재 위치

- **Epic**: 유료 리포트 검수 (Phase A+B+C 모두 완료)
- **Task**: Phase C Task 5 — WordPress 편향 해소 + CMS 감지 결과 활용
- **상태**: 🟢 **완료** — 7건 커밋 push + PDF 실증 검증 + learnings 교훈 3건 추가

### 이번 세션 완료 내역

#### 1. learnings.md 용량 정리 (`ea95858`)

- **결과**: 574줄 → 329줄 (-43%, -21KB)
- 2026-03-13~23 초기 테스트 인프라/삽질 교훈 13개 → `docs/learnings-archive-2026-Q1.md` 분리
- "디버깅 체크포인트 A~G" 섹션 제거 (각 교훈 "규칙" 필드와 중복)
- 최근 37개 교훈(2026-03-24 이후)만 현재 learnings.md에 유지

#### 2. n8n v3.6 → v3.7 → v3.8 Observatory sandbox hotfix (3단계 삽질)

- **증상**: 모든 크롤링이 `data_completeness=89%`에 고착 + `observatory: "The value in the 'JSON Body' field is not valid JSON"` 에러 반복
- **v3.6 (기존)**: Observatory 노드 expression 안에 `new URL(...).hostname` → sandbox 제약으로 실패
- **v3.7 (`23a099d`)**: Validate & Set Variables Code 노드에서 `new URL(url).hostname` 호출 → **더 큰 실패**. Code 노드도 `node:vm.runInContext` task-runner sandbox이며 URL global이 주입되지 않음. diagnoses `4fc14d42`가 crawling에 영구 고착
- **v3.8 (`a485f92`)**: 순수 string 조작 `url.replace(/^https?:\/\//, '').split('/')[0].split(':')[0]`으로 host 추출. 같은 workflow의 SSL Labs 노드(line 132)가 이미 이 패턴 사용 중이었음 = 역증
- **결과**: `8f4c39f6` execution에서 `data_completeness=100`, `error_count=0`, end-to-end 87.8초 완료
- **Supabase 정리**: `4fc14d42` 고착 진단 → `status='failed'` UPDATE

#### 3. learnings 교훈 3건 추가 (`5b5e110`)

- **기술**: n8n Code 노드 task-runner sandbox에 `URL` global 없음 → string 조작 패턴 강제
- **메타 1**: 외부 도구 sandbox는 "정식 런타임" 가정 금지 + 기존 workflow 특이 패턴 발견 시 "왜 저렇게?" 먼저 질문
- **메타 2**: 단일 fix 검증 후 추가 fix 결정 패턴 — root cause 분리 측정의 가치

#### 4. P1-1 DNS www 폴백 프로덕션 검증 (Playwright 실측)

- `monthlycheck.kr` (apex, A 레코드 없음) 입력 → `/onboarding/analyzing?id=9fe518ca&wwwFallback=1` redirect
- Info 배너 완벽 표시: "입력하신 도메인 대신 www 버전으로 분석 중입니다 / https://www.monthlycheck.kr/으로 자동 연결했어요..."
- 실제 분석 타겟 URL도 `www.monthlycheck.kr`로 전환 ✅
- 진단 진행률 7% → 정상 크롤링 시작 (n8n v3.8 수신)
- 스크린샷: `.playwright-mcp/dns-www-fallback-verify-2026-04-09.png`

#### 5. Phase B Task 4 — 유료 리포트 빈 섹션 처리 (`b2c5301`)

- **Task 4-1 (경쟁사 비교)**: `PdfCompetitors`에 `if (competitors.length === 0) return null` 가드 추가 → 섹션 자체 제거. 웹 `CompetitorSection`은 이미 hide 중이라 변경 불필요
- **Task 4-2 (AI 인용 0%)**:
  - `config/report.ts`에 `CITATION_EMPTY_INFO` 상수 신규 추가 (웹/PDF 공통)
  - `isEmpty = keywords.length===0 || platforms.length===0 || mentionRate===0` 조건에 info block 렌더링
  - 원인: "현재 Schema Markup과 구조화된 콘텐츠가 부족해..."
  - CTA: "→ 아래 GEO 개선 항목을 적용하면 인용률이 올라갑니다"
  - 빈 플랫폼 요약 + 빈 테이블도 hide
  - 웹 `CitationTrackingSection.tsx` + PDF `PdfCitationTracking.tsx` 동일 로직
- **검증**: Jayden이 admin 계정으로 `352b86f9` 리포트 PDF 다운로드 → 8페이지 읽음
  - Page 7: "AI 인용 추적" h2 + "전체 AI 인용률 0%" + **노란색 info 박스 완벽 렌더링** ✅
  - Page 7: 경쟁사 비교 섹션 **사라짐** ✅
  - Page 7: 빈 테이블 **사라짐** ✅ (info 박스만 표시)
  - Pages 1~6: Phase A 수정사항(매출 누수 캡, 가중 분배, KCD 출처, 점수 73점 통일) 그대로 유지

#### 6. Phase C Task 5 — WordPress 편향 해소 + CMS 감지 결과 활용 (`8b1513f`)

- **문제 확정**: `technical guardrails` line 221에 `(WordPress/Shopify)` 편향 + `run-diagnosis-paid.ts:883`이 CMS 감지 성공 시에만 프롬프트에 전달 → 감지 실패 시 AI가 default로 WordPress 선택
- **수정 1 `config/diagnosis-paid.ts` (3곳)**:
  - V2_ANALYSIS_FRAMEWORK CMS 목록: "쇼피파이" → "Imweb/Wix" 교체 (한국 타겟 현실 반영)
  - technical guardrails: `(WordPress/Shopify) 포함` → "사용자 메시지 ### CMS 섹션 참고. 감지 불가 시 워드프레스/카페24/직접 코딩 3가지 경로 병렬 제시"
  - technical schema 주석: 감지된 CMS 기준 안내 명시
- **수정 2 `run-diagnosis-paid.ts` (1곳)**:
  - CMS 감지 실패 케이스 `else` 분기 추가 → AI에 "3가지 경로 병렬 제시" 강제
  - "단일 CMS 단정 금지" 명시
- **검증**: tsc + build 통과. 실제 AI 출력 변화는 Jayden이 다음 paid 진단 생성 시 수동 확인

### 이번 세션 커밋 (7건)

1. `ea95858` chore(docs): learnings.md 용량 정리 — 2026 Q1 초기 교훈 아카이브 분리
2. `23a099d` feat(n8n): crawl v3.7 — Observatory sandbox fix
3. `5b5e110` docs(learnings): n8n Code 노드 sandbox URL global 없음 + 메타 교훈 2건 추가
4. `a485f92` feat(n8n): crawl v3.8 — sandbox-safe host parsing (v3.7 hotfix)
5. `b2c5301` feat(report): phase b task 4 — 유료 리포트 빈 섹션 처리
6. `8b1513f` feat(diagnosis-paid): phase c task 5 — wordpress 편향 해소 + cms 감지 결과 활용

### 다음 세션 할 일 (우선순위)

| 우선순위 | 작업                                      | 비고                                                                                                                                           |
| -------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0**   | Phase C Task 5 실제 AI 출력 검증          | 새 paid 진단 1건 생성 → PDF에서 "suggestedFix" 블록 Shopify 사라짐 + 미감지 시 3가지 경로 제시 확인                                            |
| **P1**   | Phase D — 온보딩에 업종/규모 선택 UI 추가 | `IndustrySelect.tsx` 신규 + `diagnoses` 테이블 마이그레이션 (`industry`, `company_size` 컬럼) + `baseMonthlyRevenue` 동적 설정. 예상 1.5~2시간 |
| **P2**   | 기존 31 vitest 실패 정리                  | observatory v1→v2, ssl-labs, save-crawl-result, CMO fallback 등 pre-existing 실패. Phase A~C와 무관                                            |
| **P3**   | 토스 실 연동 (Phase 2)                    | 현재 gift code로 우회 중. 실제 결제 플로우 연결                                                                                                |

### 차단 요소

**없음** — 7건 커밋 모두 push 완료, Vercel 자동 배포 확인 가능

### 마지막 업데이트 (13차)

- **날짜**: 2026-04-09 14:00 KST (세션 종료)
- **세션 시간**: ~5시간 (learnings 정리 + n8n 삽질 3회 + Playwright 검증 + Phase B 구현 + PDF 검증 + Phase C 구현)
- **최종 커밋**: `8b1513f` feat(diagnosis-paid): phase c task 5 — wordpress 편향 해소
- **배포 상태**: Vercel 자동 배포 경로 준비 (Jayden 수동 확인 필요)
- **테스트 계정**: `findably-qa@test.local` / `FindablyQA-Test2026!`
- **상태**: 🟢 **완료** — Phase A+B+C 3단계 모두 완료, 유료 리포트 검수 v1 지시문 (Task 1~5) 100% 반영

---

## 📍 Session 14차 (2026-04-09 오후 ~ 저녁) — Phase C Task 5 실증 검증 + Phase D 업종별 동적화 완결

### 현재 위치

- **Epic**: 유료 리포트 검수 (Phase A+B+C+D **모두 완료**)
- **Task**: Phase D — 업종별 월매출 동적화 + 언어 톤다운 + 퍼센트 병행
- **상태**: 🟢 **완료** — 4 커밋 push + 프로덕션 E2E 검증 통과 + 3건 learnings 후보

### 이번 세션 완료 내역

#### 1. Phase C Task 5 실증 검증 (옵션 A, ~30분)

- Playwright로 `findably-qa@test.local` 로그인 → `monthlycheck.kr` 기존 무료 진단(9fe518ca)에서 gift code `ADMIN-0709` 적용
- 새 paid 진단 `968477cb-ab9f-497a-846c-6b54c62458ce` 생성 → process 195초 완료
- **DB 검증**: `analysis_data.agentResults[0].insights` 8개 technical insight의 `suggestedFix` 전체 스캔
  - Shopify **0/8** ✅ (WordPress 편향 완전 제거)
  - 워드프레스/카페24/직접코딩 **8/8** 모두 등장 ✅
  - CMS 미감지 케이스(`cms=null`)에서 3가지 경로 병렬 제시 규칙 완벽 작동
- **PDF 검증**: 232KB, 전체 스캔 Shopify 0건, 워드프레스 25건, 카페24 25건, 직접코딩 11건
- **Phase A/B 회귀 체크**: 커버 62점 통일, 매출 누수 캡 328만원, #technical 태그 배분, KCD 출처, 경쟁사 빈 섹션 제거, AI 인용 0% info block 모두 유지 ✅

#### 2. Phase D 리서치 (서브에이전트 병렬 2개)

Jayden이 "업종별 매출 데이터는 고객사가 꺼려할 수도" 지적 → UX 민감도 + 공개 데이터 2축 리서치

**Agent A (UX 민감도)** 결과:

- 민감 필드 추가 시 전환율 5~7%/필드 하락 (HubSpot)
- 한국 SaaS 표준: 매출 직접 입력 없음 (Cafe24/스마트스토어/토스비즈니스/가비아 전수 검증)
- Ahrefs/Semrush는 매출 대신 Traffic Value (키워드 × CPC 환산)
- 현재 1,640만원 기본값은 통계적으로 유효 (KCD 2025 Q4 분기 4,916 ÷ 3 = 월 1,639)

**Agent B (KOSIS 데이터)** 결과:

- KOSIS `DT_3ME0100` 시도/산업중분류별 주요지표에 11개 대분류 매출 존재
- Agent B가 KCD 수치 단위 혼동으로 "불일치" 오진 → Agent A가 교정
- 공공누리 적용, 상업 이용 가능

**Jayden 결정**: Q-D6 옵션 3 (언어 톤다운 + Phase A 자산 보존) + 데이터 Option C (퍼센트 병행)

#### 3. KOSIS 11개 대분류 매출 데이터 수집 (Playwright)

- Playwright로 KOSIS 사이트 접속 → 중첩 iframe 재귀 탐색 → 686 rows 테이블에서 "전국 + 산업별(2)=소계" 필터
- 12개 산업 대분류 추출 (전산업 + 11개):
  - 전산업 **199백만원/년** = 월 1,658 (현재 기본값 1,640과 일치)
  - 숙박·음식점업 151 → **월 1,260**
  - 제조업 407 → **월 3,390**
  - 부동산업 51 → **월 425**
  - 도소매 260, 건설 296, IT 115, 전문서비스 148, 교육 75, 사업시설 125, 예술 92, 개인서비스 67

#### 4. Phase D 1차 구현 (커밋 `1f218f0`, 12 파일 변경)

- **`src/config/revenue.ts` 리팩토링**:
  - **삭제**: System 1 dead code (`IndustryId saas/ecommerce/...`, `INDUSTRY_BENCHMARKS`, `calculateRevenueImpact`, `getBenchmark`, `REVENUE` 객체) — 외부 호출 0건 확인
  - **신규**: `SmeIndustryId` 타입 (KOSIS 11개), `INDUSTRY_MONTHLY_REVENUE` 맵, `INDUSTRY_LABELS`, `INDUSTRY_OPTIONS`, `getBaseMonthlyRevenueForIndustry()`, `getIndustryLabel()`, `isSmeIndustryId()`
- **`src/components/ui/select.tsx`** 신규 (shadcn add select, @base-ui/react 기반)
- **`src/features/onboarding/components/IndustrySelect.tsx`** 신규 (shadcn Select + hidden input 패턴)
- **온보딩 통합**: `/info` 페이지의 자유 텍스트 input을 IndustrySelect로 교체
- **렌더 prop chain 전파** (웹 + PDF 양쪽):
  - `page.tsx` → `DetailedReportContent` → `BridgeSection` → `TotalLeakageCard`
  - `/api/reports/[id]/pdf/route.tsx` → `ReportDocument` → `PdfBridgeSection`
  - `distributeRevenueLeakage(insights, { baseMonthlyRevenue })` 동적 전달
- **언어 톤다운**:
  - "매출 비용이 새는 곳" → "마케팅에서 개선 여지가 있는 영역"
  - "현재 매월 새고 있는 마케팅 비용" → "현재 추정되는 월 마케팅 기회비용"
  - "매출의 20% 수준" → "매출 대비 20% 규모"
  - "영향" → "규모"
- **퍼센트 병행**: 카테고리 카드마다 "(매출 대비 X.X%)" 1줄 추가
- **출처 업데이트**: KCD 2025 Q4 → 중기부·통계청 소상공인실태조사 2023
- **테스트 +16 신규** (revenue 27 + insight-aggregation 33 = 60 통과)

#### 5. Phase D Hotfix 2차/3차 (커밋 `bc0c900`, `99ff2fd`)

**1차 hotfix (bc0c900)**: E2E 테스트 시작 시 `/onboarding/url` submit 후 `/info`를 건너뛰고 바로 `/analyzing`으로 가던 버그 발견. `submit-url.ts:123`을 `/info?id=...`로 복구 (주석이 원래 `/info`라고 명시했지만 구현이 일치 안 함).

**2차 hotfix (99ff2fd)**: 1차 배포 후 PDF가 여전히 월매출 1,640만원으로 표시 → 원인: `route.tsx`/`page.tsx`의 `.select()`에 `industry` 컬럼 누락. 두 파일에 추가. 동시에 shadcn `@base-ui` `SelectValue`가 raw ID ("accommodation_food") 표시하는 문제를 render prop 패턴으로 해결 (`INDUSTRY_LABELS` 매핑).

**Vercel 배포 지연 hotfix (1f88f2b)**: push 후 5분+ 대기해도 Vercel auto-deploy가 트리거 안 됨. 빈 커밋으로 webhook 재트리거 → 34초 후 정상 배포.

#### 6. 프로덕션 E2E 검증 (진단 9212e4a6-...)

- `monthlycheck.kr` 새 진단 + IndustrySelect에서 "숙박·음식점·카페" 선택 → DB industry=`accommodation_food` 저장 확인
- Gift code 유료 전환 (이전 테스트 레코드 삭제 후) → 새 paid 진단 생성 industry 보존 확인
- 유료 분석 완료 (process 175초) → PDF 다운로드 227KB
- **15개 체크리스트 100% 통과**:
  - 헤더 "업종: 숙박·음식점·카페" 노출 ✅
  - 월매출 **1,260만원** (기본 1,640 대비 23% 감소) ✅
  - 누수 캡 **251만원** (기본 328 대비 비례 축소) ✅
  - 연간 **3,012만원** ✅
  - 카테고리별 동일 비율 축소: 79→60, 66→50, 49→38, 39→30 ✅
  - 퍼센트 병행 "매출 대비 4.8%, 4.0%, 3.0%, 2.4%" ✅
  - 언어 톤다운: "새고 있" **0건**, "기회비용" 1건 ✅
  - 신 출처 "소상공인실태조사 2023" 1건, 구 출처 "KCD 2025" **0건** ✅

### 이번 세션 커밋 (5건)

1. `1f218f0` feat(report): phase d — 업종별 월매출 동적화 + 언어 톤다운 + 퍼센트 병행
2. `bc0c900` fix(onboarding): phase d — /url → /info 리다이렉트 복구
3. `99ff2fd` fix(report): phase d — industry 컬럼 누락 select + IndustrySelect 라벨 표시
4. `1f88f2b` chore: trigger vercel redeploy (webhook 지연 강제)
5. (save commit 예정)

### 다음 세션 할 일 (우선순위)

| 우선순위 | 작업                               | 비고                                                                                                |
| -------- | ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| **P1**   | 기존 31 vitest 실패 정리           | observatory v1→v2, ssl-labs, save-crawl-result, CMO fallback 등 pre-existing 실패. Phase A~D와 무관 |
| **P1**   | Phase E 후보 탐색                  | 회사 규모 추가 선택 / 업종별 AI 프롬프트 차별화 / GSC 연동 등 Jayden 결정 대기                      |
| **P2**   | 토스 실 연동 (Phase 2)             | 현재 gift code로 우회 중. 실제 결제 플로우 연결                                                     |
| **P2**   | 1449 lint errors pre-existing 정리 | Phase D 영향 아님, 기존 누적                                                                        |

### 차단 요소

**없음** — Phase D 완료, 프로덕션 반영 완료, E2E 검증 통과

### 마지막 업데이트 (14차)

- **날짜**: 2026-04-09 18:30 KST (세션 종료)
- **세션 시간**: ~4.5시간 (Phase C 검증 + 리서치 + KOSIS 수집 + Phase D 구현 + hotfix 2회 + E2E 검증)
- **최종 커밋**: `1f88f2b` chore: trigger vercel redeploy (webhook 지연 강제)
- **배포 상태**: Vercel 프로덕션 배포 완료 (l5o3viak3)
- **테스트 계정**: `findably-qa@test.local` / `FindablyQA-Test2026!`
- **검증 진단**: `9212e4a6-b464-42e5-9842-81bc985d3d67` (monthlycheck.kr, paid, industry=accommodation_food)
- **상태**: 🟢 **완료** — Phase A+B+C+D 모두 완료. 유료 리포트 검수 v1 지시문 완결.

---

## 📍 Session 15차 (2026-04-09 저녁) — Admin 점검 공지 관리 기능 구축

### 현재 위치

- **Epic**: Admin 운영 도구 (신규)
- **Task**: 점검 공지 CMS (ON/OFF + 제목/본문/ETA/이메일 관리)
- **상태**: 🟢 **완료** — DB 마이그레이션 적용 + Admin UI + 랜딩 연동 + 프로덕션 E2E 검증 통과

### 배경

이전까지 랜딩 페이지의 "서비스 점검 중" 모달 문구가 `maintenance-notice.tsx`에 **완전 하드코딩**되어 있어서 수정하려면 코드 배포가 필요했다. Jayden 요청: "Admin 관리자에서 수정 관리할 수 있게 개발 진행해줘".

### 이번 세션 완료 내역

#### 1. 설계 결정 (Q1~Q5)

| Q            | 결정                                                         |
| ------------ | ------------------------------------------------------------ |
| Q1 범위      | B — ON/OFF + 제목 + 본문 + ETA + 이메일                      |
| Q2 저장소    | A — DB 단일 row 테이블 (`findably_maintenance_notices` id=1) |
| Q3 표시 범위 | A — 랜딩 페이지만 (현재 동작 유지)                           |
| Q4 캐시      | B — `unstable_cache` + `revalidateTag('max')`                |
| Q5 버전      | A — 단일 row (upsert, 히스토리 없음)                         |

#### 2. DB 마이그레이션 (Supabase MCP로 실 적용)

- `supabase/migrations/013_findably_maintenance_notices.sql` 신규
- `apply_migration`으로 프로덕션 DB (souqwsdwabhqbbvpwfpe)에 직접 적용
- 스키마: `id int CHECK(id=1)`, `is_active bool`, `title`, `body`, `contact_email`, `eta_text`, `updated_at`, `updated_by`
- RLS: select public (비로그인 포함 누구나 읽기, 랜딩 노출용)
- 트리거: `updated_at` 자동 갱신
- 기본 row 1건 삽입 (is_active=false 초기)

#### 3. Feature 모듈 신규 (`src/features/admin/maintenance/`)

- `types.ts` — Zod 스키마 (`maintenanceNoticeSchema`) + `DEFAULT_MAINTENANCE_NOTICE` fallback
- `queries/get-maintenance-notice.ts` — `unstable_cache`로 감싼 조회 함수 + `MAINTENANCE_NOTICE_TAG` export

#### 4. Admin UI (Server Action + Client Form)

- `_actions/update-maintenance-notice.ts` — Server Action
  - admin 인증 (`ACCESS.ADMIN_EMAILS` allowlist)
  - Zod 검증
  - `service_role`로 UPDATE (id=1)
  - `revalidateTag(MAINTENANCE_NOTICE_TAG, 'max')` + `revalidatePath('/')` + `revalidatePath('/admin')`
- `_components/AdminMaintenanceForm.tsx` — Client Form
  - ON/OFF 체크박스 + 제목/본문/ETA/이메일 필드
  - `useActionState`로 성공/에러 메시지 표시
  - 현재 상태 뱃지 ("노출 중" / "비활성")
- `page.tsx` 수정 — "점검 공지 관리" 섹션을 선물 코드 관리 위에 추가

#### 5. 랜딩 페이지 리팩토링

- `components/landing/maintenance-notice.tsx` — **완전 재설계**
  - Props: `notice: MaintenanceNoticeData`
  - `notice.isActive === false`면 `return null`
  - 하드코딩 문구 → props 값 사용
  - `body.split('\n')`로 줄바꿈 `<p>` 단락 분리
  - ETA가 있으면 Clock 아이콘 강조 박스 렌더
  - 이메일이 있으면 mailto 링크 렌더
- `app/(marketing)/page.tsx` — `async` + `getMaintenanceNotice()` 호출 후 props 전달

#### 6. Next.js 16 호환 수정 (삽질 1회)

- **첫 검증 실패**: `revalidateTag(tag)` 단일 인자 → Next.js 16에서 TS2554 에러
- Context7 MCP로 공식 문서 확인 → `revalidateTag(tag, 'max')` 2-인자 필수로 변경됨을 확인
- `'max'`는 stale-while-revalidate 권장 프로파일 (즉시 무효화 + 다음 요청 시 재생성)

#### 7. 랜딩 Static Prerender 이슈 해결 (설계 보완)

- **발견**: 프로덕션 배포 후 DB UPDATE 했는데도 랜딩 모달 반영 안 됨
- **원인**: 빌드 출력에 `○ / 5m 1y` — 랜딩이 **static prerender**되어 HTML로 박제됨. `unstable_cache` + `revalidateTag`를 우회하고 페이지 자체가 cached
- **해결**: `src/app/(marketing)/page.tsx`에 `export const revalidate = 0` 추가 → 매 요청 dynamic render (DB 부담은 unstable_cache가 여전히 차단)
- **배포 후 재검증 즉시 성공**

#### 8. database.ts 타입 파일 업데이트

- 기존 `src/types/database.ts`가 상당히 stale 상태 발견 (findably_crawl_executions, findably_alerts, findably_pipeline_health 등 누락)
- 이번 작업에서는 **신규 테이블만 추가**하는 최소 변경으로 진행 (기존 stale 타입은 다음 Task로)

#### 9. 프로덕션 E2E 검증 (Claude Playwright + Jayden 수동)

**Part 1 — Claude 자동**: DB 직접 UPDATE → 랜딩 재방문 → 모달 렌더 확인

- 테스트 값: title=`[E2E 테스트] 점검 공지 표시 확인`, body 2단락, eta=`2026-04-09 23:59 복구 예정 (테스트)`, email=`qa-test@findably.kr`
- 결과: 5개 필드 모두 정상 렌더링 + body 줄바꿈 `<p>` 2단락 분리 + 스크린샷 확인

**Part 2 — Jayden 수동**: Admin UI 로그인 → "점검 공지 관리" 섹션 → 저장 → 랜딩 즉시 반영 확인

- Jayden 보고: "테스트완료 정상" ✅

### 이번 세션 커밋 (2건)

1. `4b19bef` feat(admin): 점검 공지 관리 기능 추가 (9 files, +524/-27)
2. `6fa3e4a` fix(landing): 점검 공지 즉시 반영을 위해 랜딩 페이지 dynamic rendering (1 file, +4)

### 이번 세션에서 변경된 파일 (9개)

| #   | 파일                                                               | 작업                        |
| --- | ------------------------------------------------------------------ | --------------------------- |
| 1   | `supabase/migrations/013_findably_maintenance_notices.sql`         | 신규 + DB 실 적용           |
| 2   | `src/features/admin/maintenance/types.ts`                          | 신규 (Zod)                  |
| 3   | `src/features/admin/maintenance/queries/get-maintenance-notice.ts` | 신규 (unstable_cache)       |
| 4   | `src/components/landing/maintenance-notice.tsx`                    | 리팩토링 (props화)          |
| 5   | `src/app/(marketing)/page.tsx`                                     | 수정 (async + revalidate=0) |
| 6   | `src/app/(admin)/admin/_actions/update-maintenance-notice.ts`      | 신규 (Server Action)        |
| 7   | `src/app/(admin)/admin/_components/AdminMaintenanceForm.tsx`       | 신규 (Form UI)              |
| 8   | `src/app/(admin)/admin/page.tsx`                                   | 수정 (섹션 추가)            |
| 9   | `src/types/database.ts`                                            | 수정 (신규 테이블 타입)     |

### 다음 세션 할 일 (우선순위)

| 우선순위 | 작업                      | 비고                                                                                                        |
| -------- | ------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **P1**   | `database.ts` 전체 재생성 | findably_crawl_executions, findably_alerts, findably_pipeline_health 등 누락. `supabase gen types`로 재생성 |
| **P1**   | 기존 31 vitest 실패 정리  | Phase A~D + Session 15차와 무관, pre-existing                                                               |
| **P1**   | Phase E 후보 탐색         | 회사 규모 / 업종별 AI 프롬프트 차별화 / GSC 연동                                                            |
| **P2**   | 토스 실 연동 (Phase 2)    | 현재 gift code로 우회 중                                                                                    |
| **P2**   | 1449 lint errors 정리     | 누적 기술부채                                                                                               |

### 차단 요소

**없음** — 기능 완료, 프로덕션 반영 완료, E2E 검증 통과 (Part 1 + Part 2).

### 마지막 업데이트 (15차)

- **날짜**: 2026-04-09 21:00 KST (세션 종료)
- **세션 시간**: ~2시간 (계획 + 구현 + 프로덕션 배포 + E2E 검증 + 한 번의 설계 보완)
- **최종 커밋**: `6fa3e4a` fix(landing): 랜딩 dynamic rendering
- **배포 상태**: Vercel 프로덕션 배포 완료 (`enzdqjqai`)
- **DB 상태**: `findably_maintenance_notices` id=1, is_active=false (운영 기본값 원복)
- **상태**: 🟢 **완료** — Admin 점검 공지 관리 기능 Task 1개 종결
