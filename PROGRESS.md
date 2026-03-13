# Findably — 진행상황 문서

> **이 파일을 세션 시작 시 첫 번째로 읽으면 100% 이어서 작업 가능**
> 최종 업데이트: 2026-03-13

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

### Epic 1: 프로젝트 셋업

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

---

## 📦 Task 1.3 (Auth) 완료 내역

- `src/lib/supabase/server.ts` — 서버 클라이언트
- `src/lib/supabase/client.ts` — 브라우저 클라이언트
- `src/lib/supabase/middleware.ts` — 미들웨어 클라이언트
- `src/middleware.ts` — 라우트 보호 (PROTECTED_PATHS)
- `src/app/auth/callback/route.ts` — OAuth 콜백
- `src/app/(auth)/login/page.tsx` — 로그인 페이지
- `src/app/(auth)/signup/page.tsx` — 회원가입 페이지
- `src/features/auth/` — actions, hooks, components, types
- `supabase/migrations/001_findably_profiles.sql` — profiles 테이블
- `supabase/migrations/002_findably_profiles_rls_hardening.sql` — RLS 고도화

## 📦 Task 1.4 (DB 스키마) 완료 내역

원격 DB에 5개 테이블 모두 존재 + RLS 활성화 확인 (2026-03-13 Supabase MCP 검증):

| 테이블          | 마이그레이션 | RLS |
| --------------- | ------------ | --- |
| profiles        | 001 + 002    | ✅  |
| diagnoses       | 003 (101줄)  | ✅  |
| diagnosis_items | 003          | ✅  |
| payments (🔴)   | 004 (51줄)   | ✅  |
| reports         | 005 (45줄)   | ✅  |

- `src/types/database.ts` — 5개 테이블 타입 생성 완료

## 📦 Task 1.5 (GNB + 라우팅 + 레이아웃) 완료 내역

**레이아웃 4개:**

- `src/app/(public)/layout.tsx` — GNB + Footer
- `src/app/(dashboard)/layout.tsx` — Sidebar + Header
- `src/app/(auth)/layout.tsx` — 중앙 카드
- `src/app/(onboarding)/layout.tsx` — 로고 + 중앙 콘텐츠

**공유 컴포넌트:**

- `src/components/shared/GNB.tsx` — 데스크톱 + 모바일 Sheet
- `src/components/shared/Footer.tsx` — 저작권 + 약관 링크
- `src/components/dashboard/Sidebar.tsx` — 220px, locked 상태, Tooltip
- `src/components/dashboard/Header.tsx` — 페이지 타이틀 + 아바타
- `src/components/dashboard/MobileMenu.tsx` — Sheet 오버레이

**Placeholder 페이지 (~20개):**

- Public: pricing, reports/sample
- Dashboard: dashboard, diagnosis/(overview|seo|geo|content|competitors), reports/my, reports/my/[id], actions/(schema|meta-tags|roadmap), settings/(profile|billing)
- Onboarding: url, info, analyzing

**loading.tsx + error.tsx:** dashboard, diagnosis, onboarding 각각

**코드 리뷰:** ✅ PASS (4 Gate 통과, 🟡 Nit 2개만)

## 📦 Task 1.7 (공통 컴포넌트) 완료 내역

**신규 파일 (10개):**

- `src/types/ui.ts` — 공통 컴포넌트 Props 타입 (OST)
- `src/config/scoring.ts` — 점수 등급 기준 + 색상 매핑
- `src/components/ui/badge-variants.ts` — CVA 뱃지 변형 (score/status)
- `src/components/shared/ErrorBoundary.tsx` — React Error Boundary (class, 'use client')
- `src/components/shared/Skeleton.tsx` — 재사용 스켈레톤 4종 (card/text/gauge/table-row)
- `src/components/shared/EmptyState.tsx` — 빈 상태 (아이콘+제목+설명+CTA)
- `src/components/shared/ErrorCard.tsx` — 에러 표시 (retry+aria-live)
- `src/components/shared/OfflineBanner.tsx` — 오프라인 감지 배너 (useSyncExternalStore)
- `src/components/shared/BlurOverlay.tsx` — 유료 전환 블러 + CTA (CSS Variable 방식)
- `src/components/shared/ScoreGauge.tsx` — SVG 원형 게이지 + 카운트업 (rAF+easeOutCubic)

**수정 파일 (2개):**

- `src/app/(onboarding)/error.tsx` — ErrorCard 컴포넌트 사용으로 리팩토링
- `src/app/(dashboard)/diagnosis/error.tsx` — ErrorCard 컴포넌트 사용으로 리팩토링
- `src/app/globals.css` — `.blur-overlay-gradient` 유틸리티 클래스 추가

**코드 리뷰:** ✅ PASS (2회 리뷰 — 1차: 🔴3+🟡3 수정, 2차: 전건 해결 확인)

**설계 결정:**

- BlurOverlay 블러: 인라인 style 대신 CSS Variable + @layer utilities 조합
- OfflineBanner: useSyncExternalStore로 SSR 안전한 온라인 감지
- ScoreGauge: prefers-reduced-motion 대응 + rAF cleanup으로 메모리 누수 방지

---

## ✅ 인프라 강화 (STEP 6.5 — 2026-03-13)

### .claude/rules/ 프로젝트별 Globs 규칙 9개

| 파일                  | 트리거                                        | 핵심 내용                             |
| --------------------- | --------------------------------------------- | ------------------------------------- |
| `frontend.md`         | `src/app/**/*.tsx`, `src/components/**/*.tsx` | Server Component 기본, shadcn/ui 우선 |
| `api.md`              | `src/app/api/**/*`, `src/lib/api/*`           | Zod 검증, withAuth, 통일 응답         |
| `design-tokens.md`    | `src/components/**/*.tsx`, `globals.css`      | Brand #2b7cff, 2레이어 그림자         |
| `testing.md`          | `**/*.test.*`, `**/*.spec.*`                  | Vitest+Playwright, AAA, 70%           |
| `accessibility.md`    | `src/components/**/*`                         | WCAG AA, 4.5:1 대비                   |
| `seo.md`              | `src/app/**/page.tsx`, `**/layout.tsx`        | metadata 필수, JSON-LD                |
| `error-handling.md`   | `src/**/*.ts`, `src/**/*.tsx`                 | 5가지 상태, 한국어 메시지             |
| `module-structure.md` | `src/features/**/*`                           | 교차 import 금지, adapters            |
| `security.md`         | `src/features/auth/**/*`, `payment/**/*`      | 결제=🔴, Toss 9.9만원                 |

### .claude/settings.json — PostToolUse Hooks

- Write/Edit 후 `.ts/.tsx` 파일 자동 `tsc --noEmit` 실행

### 통합가이드 v7.0 재작성

- 위치: `/Users/jayden/project/coding/guide/바이브코딩_통합가이드_v7.0.md`
- commands→skills, full loading→globs, manual→hooks, cc-sdd→kiro 반영

## 📦 Task 1.8 (SEO 기반) 완료 내역

- `src/config/seo.ts` — URL, OG, JSON-LD Organization 데이터 확장
- `src/config/site.ts` → re-export 패턴으로 하위 호환
- `src/components/shared/JsonLd.tsx` — JSON-LD script 렌더링 컴포넌트
- `src/app/robots.ts` — 동적 robots.txt (AI봇 Allow + 인증 경로 Disallow)
- `src/app/sitemap.ts` — Public 5개 URL sitemap
- `public/llms.txt` — AI 크롤러용 사이트 설명
- `src/app/layout.tsx` — OG, Twitter, icons, canonical + Organization/WebSite JSON-LD
- `src/app/(public)/page.tsx` — metadata + SoftwareApplication JSON-LD
- `public/robots.txt` 삭제 → robots.ts로 대체

## 📦 Task 1.9 (Sentry + CI/CD) 완료 내역

- `@sentry/nextjs` v10.43.0 설치
- `sentry.client.config.ts` — 브라우저 Sentry 초기화 (DSN 없으면 비활성화)
- `sentry.server.config.ts` — 서버 Sentry 초기화
- `sentry.edge.config.ts` — Edge runtime 초기화
- `src/instrumentation.ts` — Next.js instrumentation hook + onRequestError
- `src/app/global-error.tsx` — 루트 에러 바운더리 + Sentry 보고
- `next.config.ts` — withSentryConfig 래핑 (sourcemap 업로드 비활성화)
- `.github/workflows/ci.yml` — SENTRY_DSN 환경변수 추가

**설정:** tracesSampleRate 10%, replaysOnError 100%, sourcemap 업로드 Phase 2

---

## ⏳ 진행 중

없음 — Epic 1 완료. Epic 2 진입 필요.

## 🔜 다음 할 일

**Epic 1 ✅ 완료** → Epic 2 (온보딩) 진입:

- 2.1: 랜딩 페이지 + SEO
- 2.2: 회원가입/로그인
- 2.3: URL 입력 + 선택 정보 폼
- 2.4: 분석 대기 화면

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

---

## 🔧 검증 명령어

```bash
pnpm tsc --noEmit && pnpm lint && pnpm build
```

최종 빌드: ✅ 통과 (27 pages, 2026-03-13)

## 📝 빌드 참고

- `pnpm lint` 경고 4개 (pre-existing, 블로킹 아님)
- 개발 서버: `pnpm dev` (포트 3600)
