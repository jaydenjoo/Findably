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
