# Findably — 진행상황 문서

> **이 파일을 세션 시작 시 첫 번째로 읽으면 100% 이어서 작업 가능**
> 최종 업데이트: 2026-03-14

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

### Epic 2: 온보딩 (진행 중 — 2.1 완료)

| Task | 설명                        | 상태                  |
| ---- | --------------------------- | --------------------- |
| 2.1  | 랜딩 페이지 7섹션 + SEO     | ✅ 완료               |
| 2.2  | 회원가입/로그인 디자인 보완 | ⏳ 미착수 (plan 존재) |
| 2.3  | URL 입력 + 선택 정보 폼     | ⏳ 미착수             |
| 2.4  | 분석 대기 화면              | ⏳ 미착수             |

### Epic 3: 4-Layer 크롤링 엔진 (진행 중 — 3.1~3.9 완료)

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

---

## ⏳ 진행 중

없음 — Epic 3 전체 완료 (Phase A 완성).

## 🔜 다음 할 일

**Epic 4 — 진단 엔진**

- 4.1: 룰 기반 SEO 점수 (50개+ 룰)
- 4.2: 룰 기반 GEO 점수 (15개+ 룰)
- 4.3: AI 인용 가능성 점수
- 4.4: Quick Win 자동 식별
- 4.5: 종합 점수 + 등급 산출

---

## 🔧 검증 명령어

```bash
pnpm tsc --noEmit && pnpm lint && pnpm build && pnpm test
```

최종 검증: ✅ 전체 통과 (250 tests, 2026-03-14)

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
