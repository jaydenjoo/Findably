# Implementation Tasks — Findably MVP

## Overview

This document outlines all implementation tasks to deliver Findably MVP from requirements and design specifications. Tasks are organized into 8 major feature areas covering authentication, database setup, frontend UI, crawling infrastructure, diagnosis engine, asset generation, dashboard, and production deployment.

**Total: 8 major task groups, 43 sub-tasks**
**Estimated scope: 60-90 hours**
**Target completion: MVP within 4-6 weeks with continuous integration and testing at each stage**

---

## Task Execution

### 1. Project Setup & Database Infrastructure

- [x] 1.1 (P) Initialize Next.js 15 project with TypeScript, Tailwind CSS v4, and shadcn/ui v4 CLI
  - Create Next.js project structure using `create-next-app@latest` with App Router
  - Install Tailwind CSS v4 and configure `tailwind.config.ts` with Findably brand colors
  - Initialize shadcn/ui CLI and pull base components (Button, Card, Input, Dialog, Toast, Progress, Tabs)
  - Configure TypeScript strict mode, ESLint, and Prettier
  - Set up directory structure: `src/app/`, `src/components/`, `src/lib/`, `src/types/`, `src/constants/`, `src/actions/`, `src/db/`
  - _Requirements: 3.6_

- [x] 1.2 (P) Set up Supabase PostgreSQL project and Drizzle ORM integration
  - ✓ Install Drizzle ORM v0.45.1 and drizzle-kit v0.31.9
  - ✓ Create `src/db/schema.ts` with Drizzle table definitions for companies, crawl_results, diagnoses, action_items, generated_assets
  - ✓ Configure Drizzle config file (`drizzle.config.ts`) with migration output directory
  - ✓ Create `src/lib/db/client.ts` with service and authenticated Drizzle clients
  - ✓ Add database scripts to package.json: db:generate, db:push, db:studio
  - ✓ Create comprehensive test suite (5 tests passing)
  - ✓ All TypeScript, ESLint, and build checks passing
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - _Status: COMPLETE - Ready for manual Supabase setup and migrations_

- [x] 1.3 (P) Configure Supabase Auth and implement RLS (Row Level Security) policies
  - ✓ Created `src/lib/supabase/client.ts` — browser client with @supabase/ssr, env var validation
  - ✓ Created `src/lib/supabase/server.ts` — server client with cookie handling for Next.js 15
  - ✓ Created `src/middleware.ts` — protected route guard + session refresh
  - ✓ Created `src/app/auth/callback/route.ts` — OAuth/email verification callback handler
  - ✓ Created `drizzle/rls-policies.sql` — RLS enable + 12 policies for 5 tables (company-based multi-tenancy)
  - ✓ Created `src/lib/supabase/rls-policies.md` — comprehensive RLS architecture documentation
  - ✓ Test suite: 7 tests passing (client, server, middleware, RLS SQL validation)
  - ✓ All TypeScript, ESLint, and build checks passing (32 tests total)
  - _Requirements: 2.4, 2.6, 35.1, 35.2_
  - _Status: COMPLETE - Ready for Supabase project setup and manual RLS policy application_

- [x] 1.4 (P) Initialize Drizzle migrations and verify database schema
  - ✓ Run `drizzle-kit generate` to create initial migration SQL files
  - ✓ Create seed data script for local testing (sample companies, diagnoses)
  - ✓ Comprehensive test suite (28 migration + seed tests passing)
  - ✓ Document schema structure and field types in `docs/database-schema.md`
  - _Requirements: 2.1_
  - _Status: COMPLETE - Migration files generated, seed data exported, all checks passing_

- [x] 1.5 (P) Set up environment configuration and validate .env.local
  - ✓ Created `src/lib/env.ts` — Zod schema validation with runtime error handling
  - ✓ Created `src/lib/config.ts` — typed configuration interfaces (SupabaseConfig, DatabaseConfig, AnthropicConfig, PageSpeedConfig, N8nConfig, SentryConfig, AppConfig)
  - ✓ Created `src/lib/__tests__/env.test.ts` — comprehensive test suite (16 tests, all passing)
  - ✓ Updated `src/lib/db/client.ts` to use getDatabaseConfig() instead of raw process.env
  - ✓ Added clearEnvCache() function for test isolation
  - ✓ All TypeScript, ESLint, and build checks passing
  - _Requirements: 1.7, 7.6, 12.4, 16.5, 30.3, 33.5_
  - _Status: COMPLETE - Runtime env validation ready, tests passing, config module integrated_

---

### 2. Authentication & Authorization Layer

- [x] 2.1 Build Supabase Auth client and implement authentication service
  - ✓ Created `src/lib/auth/service.ts` — AuthService class with dependency-injected Supabase client
  - ✓ Implemented 6 public methods: signUp(), signIn(), signInWithOAuth(), signOut(), getCurrentUser(), getSession()
  - ✓ Result object pattern — all methods return success boolean + optional user/session/error fields
  - ✓ Comprehensive error handling — type-safe with no exceptions thrown to consumers
  - ✓ Type definitions: `src/types/auth.ts` with AuthUser, AuthSession, SignUpResult, SignInResult, etc.
  - ✓ Full test coverage: 24 tests passing (6 test suites covering all methods + edge cases)
  - ✓ Mock-based testing with Vitest — dependency injection enables testability without real Supabase
  - ✓ All quality checks passing: tsc, eslint, npm run build, vitest
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.7, 35.2, 35.6_
  - _Status: COMPLETE - Ready for integration with UI components (signup/login forms)_

- [x] 2.2 (P) Implement signup form page with email/password and OAuth buttons
  - ✓ Created `src/app/(auth)/signup/page.tsx` with form fields: email, password, confirm password, terms checkbox
  - ✓ Implemented Zod schema `SignUpSchema` in `src/lib/validations/auth.ts` for client-side + server-side validation
  - ✓ Added password strength validation: ≥8 chars, 1 special char, 1 number (PasswordStrengthIndicator component)
  - ✓ Implemented OAuth button for Google using Supabase provider integration
  - ✓ Added error messages for duplicate email, weak password, validation failures
  - ✓ Implemented success redirect to `/onboarding` after signup (Server Action)
  - ✓ Created LoginForm component and `/login` page for parallel auth flow
  - ✓ All tests passing (17 validation tests, 5 auth action tests, 134 total tests)
  - ✓ TypeScript strict mode, ESLint, build, and test checks all passing
  - _Requirements: 5.1, 5.2, 5.4, 5.7, 35.3_
  - _Status: COMPLETE - Ready for onboarding flow integration_

- [x] 2.3 (P) Implement login form page with email/password and OAuth
  - ✓ Created `src/app/(auth)/login/page.tsx` with form fields: email, password
  - ✓ Implemented Zod schema `LoginSchema` in `src/lib/validations/auth.ts`
  - ✓ Added OAuth button for Google with error handling
  - ✓ Implemented JWT token retrieval and session storage after successful login
  - ✓ Added error messages in Korean: "이메일 또는 비밀번호가 일치하지 않습니다", "이메일을 입력해주세요", "비밀번호를 입력해주세요"
  - ✓ Implemented smart redirect: checks if user has company → `/dashboard/[company_id]`, else → `/onboarding`
  - ✓ Created `src/lib/auth/user-company.ts` utility to check company existence
  - ✓ Enhanced signInAction with company lookup logic
  - ✓ Added comprehensive tests (12 new tests for LoginSchema validation)
  - ✓ All quality gates passing: TypeScript, ESLint, build, tests (146/146 pass)
  - _Requirements: 5.5, 5.6, 5.7, 35.3_
  - _Status: COMPLETE - Smart redirect + error messages + OAuth all implemented_

- [x] 2.4 (P) Create auth layout and header component with logout functionality
  - ✓ Created `src/app/(auth)/layout.tsx` for auth page wrapper with background styling and decorative blob
  - ✓ Created `src/components/ui/auth-layout.tsx` with minimal header, centered form container, and footer with terms/privacy links
  - ✓ Created `src/components/dashboard-header.tsx` with logo, user menu dropdown, logout button for authenticated pages
  - ✓ Implemented logout functionality that calls signOutAction() from auth actions
  - ✓ All 7 tests passing: logo rendering, email display, avatar, navigation links, header styling, structure, dropdown menu
  - ✓ All quality gates passing: TypeScript strict, ESLint, production build
  - ✓ Design system compliance: brand color (#2b7cff), 2-layer shadows, Tailwind CSS v4, Korean labels (대시보드, 설정, 도움말, 로그아웃, 내 계정)
  - _Requirements: 3.4, 3.5_
  - _Status: COMPLETE - Components tested and production-ready_

---

### 3. Landing Page & Marketing Site

- [x] 3.1 (P) Build landing page hero section with animations
  - ✓ Created `src/app/page.tsx` with Navbar and HeroSection components
  - ✓ Implemented `src/components/landing/hero-section.tsx` with h1 title, subtitle, 2 CTA buttons ("무료 진단 시작하기", "데모 보기")
  - ✓ Added background: dot pattern + brand color blob at 6% opacity using CSS radial-gradient
  - ✓ Implemented sequential fade-in animations (0.1s stagger: 0s→0.1s→0.2s→0.3s→0.4s→0.5s) with @keyframes and animation-delay
  - ✓ Created `src/components/landing/navbar.tsx` with sticky positioning, responsive mobile menu, brand logo
  - ✓ Updated `src/app/layout.tsx` with DM_Sans font, Korean metadata, proper OpenGraph tags
  - ✓ All 12 hero section tests passing + 8 navbar tests passing + 6 page tests passing (179 total tests)
  - ✓ Design system compliance: brand color (#2b7cff), 2-layer shadows, typography hierarchy, responsive layout
  - ✓ TypeScript strict, ESLint, build, and test checks all passing
  - _Requirements: 4.1, 4.2, 4.3, 4.6, 36.4_
  - _Status: COMPLETE - Landing page hero + navbar fully implemented with TDD methodology_

- [x] 3.2 (P) Build landing page features section and social proof
  - ✓ Created `src/components/landing/features-section.tsx` — asymmetric grid (1 large + 2 small cards), brand color (#2b7cff), white text on large card, icons in circular backgrounds
  - ✓ Created `src/components/landing/social-proof-section.tsx` — 4 trust metrics (500+, 92%, 32%, 3분) with responsive grid (grid-cols-1 sm:grid-cols-2 lg:grid-cols-4)
  - ✓ Implemented responsive grid: 1 col mobile → 2 col tablet → 3 col desktop (lg:grid-cols-3 + lg:col-span-2 for featured card)
  - ✓ Added sequential fade-in animations with 0.1s stagger intervals (0s, 0.1s, 0.2s, 0.3s) + inline animation-delay CSS
  - ✓ Design system compliance: 2-layer shadows (shadow-md + hover:shadow-xl), typography hierarchy, hover effects (translateY-1)
  - ✓ All 19 tests passing (10 FeaturesSection + 9 SocialProofSection) + 179 existing tests still passing
  - ✓ Quality gates: tsc, eslint, npm run build all passing
  - ✓ Integrated into landing page (src/app/page.tsx)
  - _Requirements: 4.1, 4.2_
  - _Status: COMPLETE - Features section with asymmetric layout + Social proof metrics fully implemented_

- [x] 3.3 (P) Build landing page "How It Works" section with steps and visual flow
  - ✓ Created `src/components/landing/how-it-works-section.tsx` with Step subcomponent
  - ✓ Implemented 3-step section: Step 1 (URL input, 30초), Step 2 (AI analysis, 2-3분), Step 3 (Review results, 바로 확인)
  - ✓ Added step icons (LinkIcon, Sparkles, BarChart3) and numbered badges (1/2/3) with brand color
  - ✓ Implemented desktop connecting line (SVG dashed) and mobile connecting line (CSS border dotted)
  - ✓ Added step descriptions in Korean with responsive sizing
  - ✓ Responsive design: 1 col mobile (grid-cols-1) → 3 cols desktop (md:grid-cols-3)
  - ✓ Sequential fade-in animations with 0.1s stagger (delays: 0.1s, 0.2s, 0.3s)
  - ✓ Comprehensive test suite: 19 tests all passing (217 total tests passing)
  - ✓ Design system compliance: brand colors, 2-layer shadows, typography hierarchy, icon backgrounds
  - ✓ Integrated into landing page (src/app/page.tsx)
  - ✓ All quality gates passing: tsc, eslint, npm run build
  - _Requirements: 4.1, 4.2_
  - _Status: COMPLETE - TDD methodology, tests first, all quality gates verified_

- [x] 3.4 (P) Build landing page FAQ and bottom CTA section
  - ✓ Created `src/components/landing/faq-section.tsx` with 6 FAQ items in Accordion component with sequential fade-in animations
  - ✓ Created `src/components/landing/cta-section.tsx` with dark gray-900 background, headline, subtitle, 2 buttons (primary white + secondary outline), brand blob decoration
  - ✓ Created `src/components/landing/footer.tsx` with semantic footer element, copyright text, 3 links with separators, gray-400 text color
  - ✓ Integrated all three components into `src/app/page.tsx` in correct sequence
  - ✓ TDD implementation: 25 tests written first (6 FAQSection + 10 CTASection + 9 Footer), all passing
  - ✓ Design system compliance: brand colors, 2-layer shadows, typography hierarchy, sequential animations (0.1s stagger)
  - ✓ All quality gates verified: TypeScript strict, ESLint (0 errors, 0 warnings), production build, 242/242 tests passing
  - ✓ Newsletter signup placeholder skipped (marked as future Phase 2 feature)
  - _Requirements: 4.1, 4.2_
  - _Status: COMPLETE - TDD methodology followed, all tests pass, design system compliant, production-ready_

- [x] 3.5 (P) Implement responsive design and mobile optimization for landing page
  - ✓ Created comprehensive test suite: 43 responsive design tests covering all landing sections
  - ✓ Verified responsive Tailwind breakpoints (sm:, md:, lg:) on all components
  - ✓ Hero title: text-3xl (30px mobile) → sm:text-4xl (36px) → lg:text-6xl (60px desktop) ≈ 85% mobile scale
  - ✓ Section padding: responsive py-\* classes (48px mobile → 80px desktop) on all 8 components
  - ✓ CTA buttons: min-h-[44px] with responsive padding (py-3 sm:py-3) for touch accessibility
  - ✓ Layout optimization: hidden lg:block on hero illustration to save mobile vertical space
  - ✓ All 285 tests passing: 43 responsive design + 242 existing tests
  - ✓ All quality gates passing: tsc, eslint, npm run build
  - ✓ Design system compliance: Tailwind CSS v4 responsive classes, 2-layer shadows preserved, typography hierarchy maintained
  - _Requirements: 4.5, 36.1, 36.4_
  - _Status: COMPLETE - TDD methodology followed, all responsive design tests pass, production-ready_

---

### 4. Onboarding Flow Implementation

- [x] 4.1 Create onboarding flow container and step progression UI
  - ✓ Created `src/app/onboarding/page.tsx` with authentication checks and company existence validation
  - ✓ Created `src/components/onboarding/progress-indicator.tsx` showing "Step X of 3" with visual progress bar (animated)
  - ✓ Implemented step transitions with smooth fade-in/out animations (150ms duration)
  - ✓ Created error boundary for onboarding page (`src/app/onboarding/error.tsx`)
  - ✓ Added guard: redirects to `/dashboard/[company_id]` if user already completed onboarding
  - ✓ Added loading skeleton (`src/app/onboarding/loading.tsx`) for page preload state
  - ✓ Created OnboardingForm component (`src/components/onboarding/onboarding-form.tsx`) with client-side state management
  - ✓ Full test coverage: 25 tests for progress indicator, form, and page (318 total tests passing)
  - ✓ All quality gates passing: TypeScript strict, ESLint, Vitest
  - _Requirements: 6.7_
  - _Status: COMPLETE - TDD methodology applied, all tests pass_

- [x] 4.2 (P) Build Step 1: URL input form with validation
  - ✓ Created `src/components/onboarding/step-url.tsx` with single input field for URL
  - ✓ Implemented Zod schema `URLValidationSchema` in `src/lib/validations/onboarding.ts` accepting `https://` and `http://` URLs
  - ✓ Added client-side validation with error message: "올바른 URL을 입력하세요 (예: https://example.com)"
  - ✓ Add "다음" (Next) button to advance to Step 2 (disabled until URL is valid)
  - ✓ Integrated StepUrl component into OnboardingForm (Step 1)
  - ✓ All 15 component tests passing + 13 validation tests passing
  - ✓ All quality gates passing: TypeScript strict, ESLint, production build
  - _Requirements: 6.1, 6.2, 6.3_
  - _Status: COMPLETE - TDD methodology applied, all tests pass_

- [x] 4.3 (P) Build Step 2: Industry/category selector
  - ✓ Created `src/components/onboarding/step-industry.tsx` with 5 industry options: 전자상거래, 블로그/미디어, SaaS/소프트웨어, 지역 비즈니스, 기타
  - ✓ Store selection in component state with icons (ShoppingCart, FileText, Monitor, MapPin, Settings)
  - ✓ Add "이전" (Previous) and "다음" (Next) buttons with proper styling
  - ✓ Integrated into OnboardingForm with handleIndustryChange handler
  - ✓ Added IndustryValidationSchema to `src/lib/validations/onboarding.ts`
  - ✓ Comprehensive test suite: 20 tests all passing (366 total tests)
  - ✓ Design system compliance: brand colors, rounded cards, hover effects, responsive grid (1 col mobile → 2 cols desktop)
  - ✓ All quality gates passing: TypeScript strict, ESLint, production build
  - _Requirements: 6.4_
  - _Status: COMPLETE - TDD methodology applied, component production-ready_

- [x] 4.4 (P) Build Step 3: Company size selector
  - ✓ Created `src/components/onboarding/step-company-size.tsx` with radio options: 1인, 소규모(2-10명), 중규모(11-50명)
  - ✓ Store selection in component state
  - ✓ Add "Previous" and "시작하기" (Start button) buttons
  - ✓ Show "Loading..." state once user clicks "시작하기"
  - ✓ Added CompanySizeValidationSchema to `src/lib/validations/onboarding.ts`
  - ✓ Integrated StepCompanySize into OnboardingForm component
  - ✓ 26 component tests passing, 20 validation tests passing
  - ✓ All quality gates verified: TypeScript strict, ESLint, production build
  - _Requirements: 6.5_
  - _Status: COMPLETE - TDD methodology applied, all tests pass, design system compliant_

- [x] 4.5 Integrate onboarding form state management and API submission
  - ✓ Created `src/lib/hooks/useOnboarding.ts` — custom React hook managing 3-step flow with state + validation
  - ✓ Implemented `nextStep()`, `prevStep()`, `updateFormData()`, `handleSubmit()`, `reset()`, `getStepError()`, `validateCurrentStep()` methods
  - ✓ Implemented Server Action `submitOnboarding()` in `src/actions/onboarding.ts` with:
    - Input validation using Zod schema (URL, industry, company_size)
    - Company record creation in Supabase via Drizzle ORM
    - Non-blocking n8n webhook trigger for crawling
    - Discriminated union return type: success boolean + companyId or error message
  - ✓ Integrated hook into `src/components/onboarding/onboarding-form.tsx` for seamless state management
  - ✓ Error handling: displayed in red box, user can retry submission
  - ✓ Comprehensive test coverage: 22 hook tests + 13 server action tests (434 total tests passing)
  - ✓ All quality gates passing: TypeScript strict, ESLint (0 warnings), production build, Vitest
  - _Requirements: 6.1, 6.6, 7.1, 7.2_
  - _Status: COMPLETE - TDD methodology applied, all tests pass, production-ready_

- [x] 4.6 Create diagnosis loading page with progress feedback
  - ✓ Created `src/app/onboarding/diagnosing/page.tsx` — Server Component with auth checks + RLS verification
  - ✓ Created `src/components/onboarding/diagnosing-client.tsx` — Client Component with 2s polling + step indicators
  - ✓ Created `src/app/api/diagnosis/status/route.ts` — GET endpoint returning diagnosis status based on crawl_results + diagnoses tables
  - ✓ Implemented polling interval: 2000ms with max 10 retries (20s timeout)
  - ✓ Progress messages: "진단 중... (크롤링 대기 중)" → "크롤링 완료, AI 분석 중..." → "AI 분석 완료!"
  - ✓ Step indicators with icons: ① 크롤링 → ② AI 분석 → ③ 결과 생성 (pending/active/completed states)
  - ✓ Error handling: timeout message "크롤링이 실패했습니다. 잠시 후 다시 시도하세요" with retry button
  - ✓ Auto-redirect: 1.5s delay after status='complete' → `/dashboard/[company_id]`
  - ✓ Created error.tsx + loading.tsx for page lifecycle
  - ✓ Created mocks/supabase.ts for test support
  - ✓ Comprehensive test suite: 22 tests passing (API endpoint + client component + page component)
  - ✓ All quality gates verified: tsc (0 errors), eslint (0 errors), npm run build (success), vitest (460/460 tests pass)
  - ✓ Design system compliance: brand color (#2b7cff), 2-layer shadows, Korean UI text, responsive layout
  - _Requirements: 6.5, 7.3, 7.5_
  - _Status: COMPLETE - TDD methodology applied, all quality gates passing, production-ready_

---

### 5. Crawling Integration & n8n Orchestration

- [x] 5.1 Design and implement n8n crawling workflow
  - Design n8n workflow in Railway/self-hosted instance with following steps:
    1. Webhook trigger: receive {company_id, url}
    2. Playwright node: open URL in headless browser, wait 3s, capture full HTML
    3. Error handler for network failures (timeout 300s, store status "failed_network")
    4. HTML parsing node: extract meta tags, h1-h3, images, links (using JS code node)
    5. Schema parsing node: parse JSON-LD, Microdata, store separately
    6. Fetch robots.txt and sitemap.xml
    7. Call Google PageSpeed Insights API (mobile + desktop)
    8. Insert crawl_results into Supabase with timestamp and status
  - Document workflow steps and error handling in `docs/n8n-workflow.md`
  - Configure n8n environment variables and basic auth
  - Test workflow locally with mock data
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 5.2 (P) Build Server Action for triggering n8n crawling webhook
  - ✓ Created `src/actions/crawl.ts` with `triggerCrawling()` Server Action
  - ✓ Implemented POST to n8n webhook URL: `${webhookBaseUrl}/webhook/findably-crawl`
  - ✓ Sends JSON body: { company_id, url, industry, company_size }
  - ✓ Added error handling: logs errors to console, returns failure result (Sentry integration noted as future enhancement)
  - ✓ Validates N8N_WEBHOOK_URL via getN8nConfig() at runtime
  - ✓ Comprehensive test suite: 15 tests covering success, validation errors, network failures, HTTP error responses
  - ✓ All 498 tests passing, no regressions
  - ✓ TypeScript strict mode, ESLint, build all passing
  - _Requirements: 7.1, 7.2, 7.6, 39.1_
  - _Status: COMPLETE - Server Action implemented with full TDD test coverage_

- [x] 5.3 (P) Create API endpoint for polling crawl status
  - ✓ Created `src/app/api/crawl/status/route.ts` with GET endpoint handler
  - ✓ Implemented `GET /api/crawl/status?company_id=` with strict integer validation
  - ✓ Query Supabase for latest `crawl_results` WHERE company_id, ordered by crawledAt DESC
  - ✓ Return discriminated union JSON: { status: "pending" | "in_progress" | "completed" | "failed", companyId, result_id?, error_message? }
  - ✓ Added RLS check: verifies user owns company_id via companiesTable.userId match
  - ✓ Returns 403 Forbidden if user doesn't own the company (data isolation)
  - ✓ Handles all crawl status codes: success→completed, failed\_\*→failed, no result→pending
  - ✓ Comprehensive test suite: 33 tests covering auth, validation, status responses, RLS, error handling
  - ✓ All quality gates passing: tsc, eslint, npm run build, 531/531 tests passing
  - ✓ TypeScript strict mode with discriminated union types for response accuracy
  - ✓ Korean error messages for user-facing errors
  - _Requirements: 7.3, 7.4, 35.2_
  - _Status: COMPLETE - TDD methodology, tests first, all quality gates verified_

- [x] 5.4 (P) Implement n8n error handling and retry logic
  - ✓ Created exponential backoff retry utility: `src/lib/crawl/retry.ts` with configurable 10s/30s/60s delays
  - ✓ Classified crawl errors: timeout (>300s), network (ECONNREFUSED/ENOTFOUND), invalid_url, quota
  - ✓ Implemented error handler utility: `src/lib/crawl/error-handler.ts` with recovery strategies
  - ✓ Network timeout handling: classifies Playwright timeout >300s as "failed_timeout" status
  - ✓ PageSpeed API quota handling: detects "quota exceeded" and recommends defer strategy
  - ✓ Comprehensive documentation: `docs/crawl-error-handling.md` with error codes, procedures, n8n integration
  - ✓ Full test coverage: 51 tests (14 retry + 37 error-handler) all passing
  - ✓ All quality gates passing: tsc, eslint, npm run build, 582/582 tests passing
  - _Requirements: 7.5, 8.3, 37.1, 37.2, 37.3_
  - _Status: COMPLETE - TDD methodology, tests first (51 tests), comprehensive error handling architecture_

---

### 6. HTML Parsing & Data Extraction Layer

- [x] 6.1 (P) Build HTML meta tag and heading parser
  - ✓ Create `src/lib/parsing/html-parser.ts` module for extracting SEO elements from raw HTML
  - ✓ Implement parsing for: title, meta description, charset, viewport, og:_, twitter:_ tags
  - ✓ Handle character encoding detection (UTF-8, EUC-KR, etc.)
  - ✓ Extract h1, h2, h3 tags with text content and hierarchy (document order preserved)
  - ✓ Extract all <a> tags: href, anchor text, classify as internal/external/broken (by domain)
  - ✓ Extract <img> tags: src, alt text, width/height attributes
  - ✓ Use Cheerio library for DOM parsing (lightweight, no JS execution)
  - ✓ Return standardized object: { meta, headings, links, images }
  - ✓ 65 comprehensive tests (100% pass rate)
  - ✓ Handles edge cases: malformed HTML, Korean text, special characters, very large documents
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 6.2 (P) Build Schema.org markup parser
  - ✓ Created `src/lib/parsing/schema-parser.ts` module
  - ✓ Parse JSON-LD script tags: extract @type, @context, properties (name, description, url, image, aggregateRating, etc.)
  - ✓ Parse Microdata (itemscope, itemtype, itemprop): convert to JSON structure
  - ✓ Recognize schema types: Product, LocalBusiness, Organization, BlogPosting, FAQPage, BreadcrumbList
  - ✓ Return standardized object: { schemas: [{ type, properties }], schemaFound: boolean, schemaTypes: [] }
  - ✓ If no schema found, return { schemas: [], schemaFound: false }
  - ✓ Test suite: 30 tests passing (JSON-LD parsing, Microdata parsing, mixed schemas, edge cases, real-world examples)
  - ✓ All quality checks passing: TypeScript strict, ESLint, npm run build, vitest
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  - _Status: COMPLETE - Parser tested and production-ready_

- [x] 6.3 (P) Build robots.txt and sitemap.xml parser
  - ✓ Created `src/lib/parsing/sitemap-parser.ts` module
  - ✓ Implemented robots.txt parser: extract Disallow, Allow, User-agent, Crawl-delay rules
  - ✓ Implemented sitemap.xml parser: extract <loc>, <lastmod>, <changefreq>, <priority>
  - ✓ Handle sitemap index files (sitemap_index.xml referencing multiple sitemaps)
  - ✓ Return: { robotsTxtFound, robotsRules, sitemapUrls: [], sitemapCount, lastModified }
  - ✓ Handle missing files: return { robotsTxtFound: false, sitemapUrls: [] }
  - ✓ Comprehensive test suite: 32 tests passing (parseRobotsTxt + parseSitemapXml + edge cases)
  - ✓ TypeScript strict mode, ESLint, and build checks all passing
  - ✓ CDATA section handling with HTML entity decoding
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  - _Status: COMPLETE - Pure functions with no side effects, ready for integration_

- [x] 6.4 Create CMS detection module
  - ✓ Created `src/lib/parsing/cms-detector.ts` module with pure function detectCms()
  - ✓ Implemented 5-tier detection strategy: meta generator tag (95 confidence), domain patterns (80-82), script/link paths (65), class/id patterns (62), Unknown (0)
  - ✓ Detects 8 CMS platforms: WordPress, Shopify, WIX, Cafe24, GodoMall, Imweb, Blogger, Medium, Unknown
  - ✓ Returns typed result: { cms: CmsType, confidence: 0-100 }
  - ✓ Comprehensive test suite: 43 tests passing (all CMS types, confidence scoring, edge cases, multiple signals, Korean CMS support)
  - ✓ Input validation: handles null, undefined, empty HTML gracefully
  - ✓ All quality gates passing: TypeScript strict, ESLint, npm run build, vitest
  - _Requirements: 23.1, 23.2_
  - _Status: COMPLETE - CMS detection module fully tested and production-ready_

---

### 7. Scoring & Diagnosis Engine

- [x] 7.1 (P) Implement SEO score calculation logic
  - ✓ Created `src/lib/scoring/seo-scorer.ts` module with pure functions
  - ✓ Implemented scoring rules (100 points total):
    - Title tag existence + length (50-60 chars): 20 pts (partial 10 pts for 20-49 or 61-100)
    - Meta description existence + length (120-160 chars): 20 pts (partial 10 pts for 60-119 or 161-250)
    - H1 tag (exactly 1): 15 pts
    - Mobile responsive (viewport meta tag): 15 pts
    - Internal link structure (depth ≤ 3): 15 pts
    - Sitemap existence (urlCount > 0): 10 pts
    - robots.txt existence: 5 pts
  - ✓ Interfaces: `SeoScoreDetail` (item, points, status) and `SeoScorerResult` (seoScore, details[])
  - ✓ Helper: `calculatePathDepth()` for link depth analysis (handles query strings, fragments)
  - ✓ Comprehensive test suite: 52 tests covering all scoring rules, edge cases, null safety
  - ✓ TypeScript strict mode, ESLint, all tests passing
  - _Requirements: 14.1, 14.2, 14.3_
  - _Status: COMPLETE - Ready for GEO scorer and performance integration_

- [x] 7.2 (P) Implement GEO (Generative Engine Optimization) score calculation logic
  - Create `src/lib/scoring/geo-scorer.ts` module
  - Implement scoring rules (100 points total):
    - Schema.org markup presence (≥1 type): 30 pts
    - Structured data (Product/Organization/LocalBusiness): 20 pts
    - FAQ page Schema: 15 pts
    - Content length (≥500 chars): 15 pts
    - Image optimization (alt text + format): 15 pts
    - E-E-A-T signals (author, publish date, author bio): 5 pts
  - Accept parsed crawl data + schema data, return { geoScore, details: [{ item, points, status }] }
  - _Requirements: 15.1, 15.2, 15.3_

- [x] 7.3 (P) Implement PageSpeed performance score normalization
  - ✓ Created `src/lib/scoring/performance-scorer.ts` module
  - ✓ Normalize Google PageSpeed scores (0-100) to internal performance scale (0-100)
  - ✓ Mobile 60% + Desktop 40% weighted average (Google's mobile-first approach)
  - ✓ If performance_metrics = null (API failure), assign 50 (neutral penalty)
  - ✓ Extract and return Core Web Vitals: LCP, FID, CLS values from both mobile + desktop
  - ✓ Return { performanceScore: 0-100, coreWebVitals: { mobile: {...}, desktop: {...} } }
  - ✓ Comprehensive test suite: 17 tests all passing (normal cases, exceptions, CWV thresholds, edge cases)
  - ✓ All TypeScript, ESLint, and build checks passing (857 tests total)
  - _Requirements: 12.1, 12.2, 12.3, 12.5_
  - _Status: COMPLETE - Ready for integration with diagnosis workflow_

- [x] 7.4 (P) Create Claude API content analyzer
  - Create `src/lib/ai/claude-analyzer.ts` module with `analyzeContent()` async function
  - Send to Claude (Sonnet) with system prompt: structured analysis of content quality, keyword density, originality
  - Input context: title, description, h1-h3, first 2000 chars of body, industry, company_size
  - Expected output JSON: { contentQuality: 0-100, keywordDensity: %, uniqueness: %, recommendations: [3 items], aiScore: 0-100 }
  - Add error handling: if API fails, log to Sentry, return { aiScore: 0, error: "Failed to analyze" }
  - Token budget: ~1000-2000 tokens per request
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [x] 7.5 Implement overall score aggregation and grading
  - ✓ Created `src/lib/scoring/score-aggregator.ts` with pure function `aggregateScores()`
  - ✓ Formula: overallScore = (SEO × 0.35) + (GEO × 0.35) + (Performance × 0.2) + (AI × 0.1)
  - ✓ Grading: A (85-100), B (70-84), C (55-69), D (40-54), F (0-39)
  - ✓ Return { overallScore, grade, breakdown: { seo, geo, performance, ai } }
  - ✓ Comprehensive test suite: 32 tests covering all scenarios (score calculation, grading, boundaries, real-world cases)
  - ✓ All tests passing (908 total), no regressions
  - ✓ TypeScript strict mode, ESLint, and build checks passing
  - _Requirements: 17.1, 17.2, 17.3, 17.4_
  - _Status: COMPLETE - Ready for integration with diagnosis workflow_

- [x] 7.6 Implement Quick Win identification logic
  - ✓ Created `src/lib/diagnosis/quick-win-engine.ts` module with `identifyQuickWins()` function
  - ✓ Detect Quick Wins:
    - Title tag missing → provide recommended title
    - Meta description missing → provide recommended description
    - H1 tag missing (or duplicate) → provide H1 creation guide
    - No Schema.org → provide basic Organization schema
    - Missing image alt text → list images needing alt text
  - ✓ Each Quick Win: { title, description, effort: "1시간 이내", expectedImpact: "+5-10점 또는 +10-15점", priority: "high" | "medium" }
  - ✓ Return array of Quick Wins sorted by priority (high first), then by expectedImpact
  - ✓ Comprehensive test suite: 30 tests passing (all edge cases covered)
  - ✓ All quality gates passing: TypeScript strict, ESLint, build, tests (938 total)
  - _Requirements: 18.1, 18.2, 18.3, 18.4_
  - _Status: COMPLETE - Pure function implementation with full TDD coverage_

- [x] 7.7 Create comprehensive diagnosis result generation
  - ✓ Created `src/actions/diagnosis.ts` Server Action with `runDiagnosis()` function
  - ✓ Implemented full orchestration: SEO scorer → GEO scorer → Performance scorer → AI analyzer → Score aggregator → Quick Win engine
  - ✓ Created `src/lib/diagnosis/orchestrator.ts` to coordinate all scoring steps in parallel
  - ✓ Handled partial failures: if AI analyzer fails, continues with other scores and marks AI as "unavailable"
  - ✓ Stores result in `diagnoses` table: all required fields including ai_insights, is_latest flag
  - ✓ Updates previous diagnoses: sets is_latest = false for older records before inserting new
  - ✓ Inserts Quick Wins into `action_items` table with proper effort/priority mapping
  - ✓ Returns diagnosis record to client with success discriminated union pattern
  - ✓ Comprehensive test suite: 10 tests for Server Action + 7 tests for Orchestrator (17 total, all passing)
  - ✓ All quality gates passing: tsc (0 errors), eslint (0 warnings in modified files), pnpm build (success), vitest (955/955 tests pass)
  - ✓ Type-safe implementation with Zod validation, proper error handling, and type conversions
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_
  - _Status: COMPLETE - TDD methodology applied, comprehensive test coverage, all quality gates verified_

---

### 8. Asset Generation & Dashboard Components

- [x] 8.1 (P) Implement Schema Markup (JSON-LD) generation logic
  - Create `src/lib/generation/schema-generator.ts` module with `generateSchema()` async function
  - Generate schema based on industry + crawled data mapping:
    - Organization: { name, url, logo, description, contactPoint }
    - Product (e-commerce): { name, price, description, image, aggregateRating }
    - BlogPosting (blog): { headline, author, datePublished, image }
    - LocalBusiness: { name, address, telephone, openingHours }
  - Auto-map crawled fields: og:image → logo, meta description → description, title → name
  - Prompt user for missing required fields (company name, etc.)
  - Return valid JSON-LD string with comments
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [x] 8.2 (P) Implement meta tag optimization generation
  - ✓ Created `src/lib/generation/meta-optimizer.ts` module with `optimizeMeta()` async function
  - ✓ Claude Sonnet 4.6 API integration for SEO-optimized title/description generation
  - ✓ Title constraint: 50-60 chars, Description constraint: 120-160 chars
  - ✓ Full result structure: currentMeta, recommendations (title, description, og:tags, twitter:tags), reasons (Korean), improvements (flags)
  - ✓ Before/after comparison with improvement flags (titleImproved, descriptionImproved, titleLengthOptimal, descriptionLengthOptimal)
  - ✓ Comprehensive test suite: 62 tests covering all requirements, edge cases, error handling, industry types, character length validation
  - ✓ Full TypeScript strict mode compliance, ESLint passing, all quality gates verified
  - ✓ Discriminated union Result pattern with typed error handling (success: true | false)
  - ✓ Support for multiple industries: ecommerce, blog, saas, local_business, other
  - ✓ Optional headings input for keyword context extraction
  - ✓ All tests passing (62/62), TypeScript strict, ESLint 0 warnings, production-ready
  - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5_
  - _Status: COMPLETE - TDD methodology, all 62 tests passing, ready for dashboard integration_

- [x] 8.3 (P) Create action items prioritization matrix
  - ✓ Created `src/lib/diagnosis/action-prioritizer.ts` module with `prioritizeActions()` async function
  - ✓ Implemented priority score calculation: priorityScore = impact / (1 + effort)
  - ✓ Implemented category classification: Quick Win (≤1hr), Standard (1-8hr), Long-term (>8hr)
  - ✓ Implemented priority level assignment: 높음/중간/낮음 based on category and priority score
  - ✓ Returns array of PrioritizedActionItem sorted by priority score (highest first)
  - ✓ Comprehensive test suite: 39 tests covering all scenarios (calculation, classification, sorting, edge cases)
  - ✓ Type-safe exports: ActionItemWithMetrics, CategoryType, PriorityLevel, PrioritizedActionItem interfaces
  - ✓ All tests passing (39/39), ESLint 0 warnings, production-ready
  - _Requirements: 22.1, 22.2, 22.3, 22.4_
  - _Status: COMPLETE - TDD methodology, all 39 tests passing, ready for dashboard integration_

- [x] 8.4 (P) Build dashboard layout and score visualization
  - Create `src/app/dashboard/[company_id]/page.tsx` with:
    - Header: company name, URL, "재진단" button
    - Circular progress chart (0-100) showing overall score + grade (A-F) + color coding
    - Animated count-up: 0 → score over 1 second
    - Subtitle: "귀사 마케팅 건강도: A등급 (87점) 🎉"
    - Diagnostic timestamp: "2026-03-11 11:30 기준"
  - Add shadcn/ui Tabs for switching between Score, Action Items, Schema, Meta tags, AI Insights
  - Use Next.js Image for any visual assets
  - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5_

- [x] 8.5 (P) Build category score cards (SEO/GEO/Performance/AI)
  - Create `src/components/dashboard/score-cards.tsx` component
  - Display 4 cards in grid: SEO (35%), GEO (35%), Performance (20%), AI (10%)
  - Each card: score/100, progress bar, weight percentage
  - Add expandable detail: click to show sub-items (e.g., Title ✓, Description ✓, H1 ✗)
  - Color coding: green (pass), red (fail)
  - _Requirements: 24.3, 24.4_
  - _Status: COMPLETE - 33 tests passing, TDD implementation with expandable details, ARIA accessibility, responsive grid, color-coded progress bars, status icons for pass/partial/fail_

- [x] 8.6 (P) Build action items list with prioritization and filtering
  - Create `src/components/dashboard/action-items-list.tsx` component
  - Display tabs: All, Quick Win, Standard, Long-term
  - Each item: priority badge (높음/중간/낮음), title, description, expected impact ("+10점"), effort ("1시간"), expandable details
  - Sort by priority score within each tab
  - Add expandable row with full description, implementation steps, CMS guide
  - Optional: add checkbox to mark completed (stores in action_items.status = "completed")
  - _Requirements: 25.1, 25.2, 25.3, 25.4_

- [x] 8.7 (P) Build Schema Markup code view with copy functionality
  - ✓ Created `src/components/dashboard/schema-view.tsx` component with full React hooks implementation
  - ✓ Display generated Schema Markup in dark code block (bg-gray-900) with JSON formatting and monospace font
  - ✓ Add selector buttons: Organization, Product, BlogPosting, LocalBusiness with active state styling (brand color)
  - ✓ Implemented copy to clipboard functionality with error handling and toast notifications ("복사되었습니다!" / "복사 실패")
  - ✓ Added collapsible "HTML 추가 방법" accordion with 3-step Korean guide + Google Rich Results Test link
  - ✓ Implemented missing fields form with input fields and "다시 생성" button + onRegenerateWithOverrides callback
  - ✓ Empty state message when no schemas provided
  - ✓ Comprehensive test suite: 34 tests covering rendering, interactions, accessibility, styling
  - ✓ All tests passing (34/34) + ESLint checks + build successful
  - _Requirements: 26.1, 26.2, 26.3, 26.4, 26.5_
  - _Status: COMPLETE_

- [x] 8.8 (P) Build meta tag optimization comparison view
  - ✓ Created `src/components/dashboard/meta-tag-view.tsx` — Client Component with full meta tag comparison UI
  - ✓ Implemented two-column layout: Current (gray bg) | Recommended (blue bg) with side-by-side comparison
  - ✓ Displays all 8 meta tags: title, description, og:title, og:description, og:image, twitter:title, twitter:description, twitter:image
  - ✓ Character count indicators with color coding: green (50-60 for title, 120-160 for description), orange (too short), red (too long)
  - ✓ Improvement reason display under each meta tag section
  - ✓ Copy functionality: individual copy buttons for single tags + "Copy All" button generating complete HTML snippet with all meta tags
  - ✓ Length guidance: "Title: 50-60자 권장", "Description: 120-160자 권장"
  - ✓ Tab navigation: Title, Description, OG Tags, Twitter Tabs with TabsContent
  - ✓ Toast notifications on copy success/failure
  - ✓ Null image handling for og:image and twitter:image
  - ✓ Extracted MetaTagComparison as separate reusable component (outside render function)
  - ✓ All Korean UI text throughout component
  - ✓ Test coverage: 26 comprehensive tests covering rendering, tabs, copy functionality, improvement indicators, reason display, image handling, comparison layout
  - ✓ All quality gates passing: ESLint (0 warnings), npm run build succeeds, all 1226 tests pass (including new 26 tests)
  - ✓ Fixed pre-existing Accordion issue in schema-view.tsx (removed invalid `type` and `collapsible` props)
  - _Requirements: 27.1, 27.2, 27.3, 27.4_
  - _Status: COMPLETE - TDD methodology applied, all tests pass, production-ready, ready for dashboard integration_

- [x] 8.9 (P) Build AI insights card display
  - ✓ Created `src/components/dashboard/ai-insights.tsx` component
  - ✓ Display 3 insight cards (top 3 issues from Claude analysis):
    - Card 1 (Red): Problem + icon (⚠️), background color red-light (bg-red-50)
    - Card 2 (Yellow): Tip + icon (💡), background color yellow-light (bg-yellow-50)
    - Card 3 (Blue): Action + icon (🎯), background color blue-light (bg-blue-50)
  - ✓ Each card: problem title, recommended action, expected benefit ("검색 노출도 +35%")
  - ✓ Clickable: expand to modal with detailed explanation + related action items + reference links
  - ✓ Content in Korean, practical and specific
  - ✓ TDD methodology: 30 tests passing, 100% coverage of component functionality
  - ✓ Sequential fade-in animation with staggered delays (0.1s, 0.2s, 0.3s)
  - ✓ Responsive grid: 1 column mobile, 3 columns desktop (md:grid-cols-3 lg:grid-cols-3)
  - ✓ All TypeScript, ESLint checks passing
  - ✓ Production build successful
  - _Requirements: 28.1, 28.2, 28.3, 28.4, 28.5_
  - _Status: COMPLETE - TDD methodology applied, 30 tests all pass, production-ready, ready for dashboard integration_

- [x] 8.10 Implement re-diagnosis trigger and polling
  - Add "재진단" button in dashboard header
  - On click: show confirmation ("진단이 최근 이루어졌습니다. 1시간 후에 다시 시도하세요" if <1 hour)
  - Trigger new crawl via `triggerCrawling()` Server Action
  - Show loading state with progress text
  - Poll for new diagnosis results (same as onboarding flow)
  - Auto-refresh dashboard on completion
  - Show toast: "✓ 재진단 완료! 점수가 업데이트되었습니다"
  - _Requirements: 29.1, 29.2, 29.3, 29.4_
  - _Status: COMPLETE - TDD methodology applied, 13 tests all pass (Server Actions + Hook + Component), state machine (idle → confirming → loading → complete/error), 1-hour cooldown enforced, auto-refresh integrated_

---

### 9. Error Handling, Monitoring & Observability

- [x] 9.1 (P) Set up Sentry error tracking for frontend and backend
  - Install `@sentry/nextjs` package
  - Initialize Sentry in `src/instrumentation.ts` (Next.js instrumentation hook)
  - Configure environment: `process.env.SENTRY_DSN`
  - Capture unhandled exceptions in Server Components and API Routes
  - Add breadcrumb logging for key actions (onboarding submit, diagnosis start, etc.)
  - _Requirements: 33.1, 33.2, 33.3, 33.4, 33.5_

- [x] 9.2 (P) Set up PostHog analytics for user behavior tracking
  - ✓ Installed `posthog-js` v1.360.1
  - ✓ Created `src/components/posthog-provider.tsx` — Client component with conditional initialization
  - ✓ Created `src/lib/analytics/posthog.ts` — Typed tracking functions with no-op fallback
  - ✓ Created `src/constants/analytics-events.ts` — Event name constants preventing magic strings
  - ✓ Integrated tracking in `schema-view.tsx` — trackSchemaCopied on copy button click
  - ✓ Integrated tracking in `meta-tag-view.tsx` — trackMetaTagCopied on copy button clicks (single and all)
  - ✓ Integrated tracking in `dashboard-header.tsx` — trackReDiagnose on re-diagnosis button click
  - ✓ Updated `src/app/layout.tsx` — Added PostHogProviderComponent to root layout
  - ✓ Created comprehensive test suite: 16 tests covering all tracking functions
  - ✓ All tests passing (1312 total, 16 PostHog tests)
  - ✓ All TypeScript and ESLint checks passing
  - ✓ Build successful
  - _Requirements: 34.1, 34.2, 34.3, 34.4_
  - _Status: COMPLETE - Ready for environment variable configuration and dashboard setup_

- [x] 9.3 (P) Create health check endpoint
  - Create `src/app/api/health/route.ts` endpoint
  - Implement GET /api/health that checks:
    - Supabase connectivity: attempt simple query
    - Claude API availability: check rate limits
    - PageSpeed Insights API: check quota
    - n8n availability: ping webhook URL
  - Return JSON: { status: "healthy"|"degraded"|"unhealthy", timestamp, services: { database, claude, pagespeed, n8n } }
  - Alert if any service unhealthy: send email/Slack
  - _Requirements: 40.1, 40.2, 40.3, 40.4_

- [ ] 9.4 (P) Implement request/response logging
  - Create `src/lib/logging/request-logger.ts` middleware
  - Log all API requests: timestamp, user_id, path, method, response status, response time
  - Store logs in Supabase `api_logs` table or Sentry
  - Implement 30-day retention policy for logs
  - _Requirements: 39.1, 39.2, 39.3, 39.4_

---

### 10. Accessibility, Performance & Testing

- [ ] 10.1 (P) Implement WCAG 2.1 AA accessibility standards
  - Add semantic HTML: <nav>, <main>, <section>, <article> tags
  - Add ARIA labels to interactive elements (buttons, inputs, modals)
  - Ensure color contrast ratio ≥4.5:1 (WCAG AA)
  - Enable keyboard navigation: Tab/Enter for all buttons and forms
  - Test with screen reader (NVDA, JAWS, or VoiceOver)
  - Ensure error messages are text-based + colored (not color-only)
  - Add alt text to all images
  - _Requirements: 38.1, 38.2, 38.3, 38.4, 38.5_

- [ ] 10.2 (P) Optimize images and verify performance targets
  - Use Next.js Image component for all product images
  - Configure image optimization: auto webp, lazy loading, responsive srcSet
  - Verify Lighthouse metrics:
    - Landing page: FCP ≤1.5s, Performance score ≥80
    - Dashboard: TTI ≤3s, Performance score ≥80
  - Minify CSS/JS, enable gzip compression (Vercel default)
  - _Requirements: 36.1, 36.2, 36.3, 36.4, 36.5_

- [ ] 10.3 \* Unit tests for scoring logic
  - Write tests for `seo-scorer.ts`: mock crawl data, verify score calculation
  - Write tests for `geo-scorer.ts`: schema detection, score assignment
  - Write tests for `score-aggregator.ts`: formula, grading logic
  - Write tests for `quick-win-engine.ts`: detection rules
  - Use Vitest framework, ≥80% line coverage
  - _Requirements: 14.1, 15.1, 17.1, 18.1_

- [ ] 10.4 \* Integration tests for diagnosis flow
  - Test full diagnosis pipeline: crawl → parse → score → aggregate → diagnose
  - Mock n8n webhook responses, Claude API responses
  - Verify database inserts (diagnoses, action_items, generated_assets)
  - Test RLS isolation: user can only access own data
  - Use integration test harness with test database
  - _Requirements: 19.1, 35.1, 35.2_

- [ ] 10.5 \* E2E tests for critical user flows
  - E2E: signup → onboarding (URL + industry + company size) → diagnosis → dashboard view
  - E2E: view schema markup → copy code
  - E2E: re-diagnosis trigger
  - Use Playwright or Cypress, run against staging environment
  - _Requirements: 6.1, 24.1, 29.1_

---

### 11. Deployment & Infrastructure Configuration

- [ ] 11.1 (P) Configure Vercel deployment for Next.js frontend
  - Connect GitHub repository to Vercel project
  - Set build command: `pnpm build`
  - Set start command: `pnpm start`
  - Configure environment variables in Vercel dashboard: all .env.local vars
  - Enable automatic deployments on main branch push
  - Configure preview deployments for feature branches
  - _Requirements: 30.1, 30.2, 30.3, 30.4_

- [ ] 11.2 (P) Deploy n8n server to Railway or Fly.io
  - Create Railway/Fly.io account and project
  - Deploy n8n Docker image with PostgreSQL backend
  - Configure n8n environment variables: N8N_BASIC_AUTH_ACTIVE, N8N_BASIC_AUTH_USER, N8N_BASIC_AUTH_PASSWORD
  - Set DB_CONNECTION_URL to Supabase PostgreSQL (or separate managed DB)
  - Configure n8n webhook URL accessible from Next.js: `https://n8n-prod.railway.app/webhook/findably-crawl`
  - Test webhook connectivity
  - _Requirements: 31.1, 31.2, 31.3, 31.4, 31.5_

- [ ] 11.3 (P) Set up custom domain and SSL certificate
  - Register domain (findably.com or similar) via registrar
  - Configure Vercel custom domain: add CNAME record to DNS
  - Enable automatic SSL certificate via Let's Encrypt (Vercel auto-handles)
  - Test HTTPS access to custom domain
  - _Requirements: 32.1, 32.2, 32.3, 32.4, 32.5_

- [ ] 11.4 Configure production environment variables and secrets
  - Set all secrets in Vercel environment (not in git)
  - Set all secrets in Railway n8n environment
  - Verify no hardcoded secrets in source code (use gitleaks)
  - Document required env vars in `.env.example`
  - _Requirements: 30.3, 31.2_

---

### 12. Pre-Launch Validation & Documentation

- [ ] 12.1 (P) Run security and build verification pipeline
  - Run `npx tsc --noEmit` to check TypeScript
  - Run `pnpm lint` (ESLint)
  - Run `pnpm build` to verify production build succeeds
  - Run security check: `pnpm gitleaks` (or `npm audit`)
  - Verify Sentry integration is working in staging
  - Test health check endpoint: `/api/health`
  - _Requirements: 35.1, 35.3, 35.5, 35.6, 40.1_

- [ ] 12.2 (P) End-to-end testing of critical flows
  - Test signup → onboarding → diagnosis → dashboard → copy schema/meta tags
  - Test re-diagnosis trigger and polling
  - Test error scenarios: invalid URL, API failures, timeouts
  - Verify all error messages are user-friendly and in Korean
  - Test on mobile (iOS Safari, Android Chrome)
  - Verify accessibility with screen reader
  - _Requirements: 1.1, 6.1, 19.1, 24.1, 28.1, 36.1, 38.1_

- [ ] 12.3 Document architecture and deployment procedures
  - Create `docs/architecture.md` describing domain layers, data flow, external integrations
  - Create `docs/deployment.md` with Vercel and Railway setup instructions
  - Create `docs/api-contracts.md` documenting Server Actions and API route interfaces
  - Create `docs/n8n-setup.md` with workflow export and environment configuration
  - Create `docs/troubleshooting.md` with common errors and solutions
  - _Requirements: 30.1, 31.1, 32.1, 33.1, 34.1_

---

## Requirement Coverage Summary

**All 40 requirements mapped to implementation tasks**:

- **Req 1 (Auth)**: Tasks 2.1, 2.2, 2.3
- **Req 2 (Database)**: Tasks 1.2, 1.3, 1.4
- **Req 3 (Layout/Routing)**: Tasks 1.1, 2.4, 3.1
- **Req 4 (Landing)**: Tasks 3.1, 3.2, 3.3, 3.4, 3.5
- **Req 5 (Signup/Login)**: Tasks 2.2, 2.3, 2.4
- **Req 6 (Onboarding)**: Tasks 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
- **Req 7 (Crawl API)**: Tasks 5.2, 5.3
- **Req 8 (n8n Workflow)**: Task 5.1
- **Req 9 (HTML Parser)**: Task 6.1
- **Req 10 (Schema Parser)**: Task 6.2
- **Req 11 (Sitemap Parser)**: Task 6.3
- **Req 12 (PageSpeed)**: Task 7.3
- **Req 13 (Crawl Storage)**: Tasks 5.1, 5.2
- **Req 14 (SEO Scoring)**: Task 7.1
- **Req 15 (GEO Scoring)**: Task 7.2
- **Req 16 (Claude Analysis)**: Task 7.4
- **Req 17 (Score Aggregation)**: Task 7.5
- **Req 18 (Quick Win)**: Task 7.6
- **Req 19 (Diagnosis)**: Task 7.7
- **Req 20 (Schema Gen)**: Task 8.1
- **Req 21 (Meta Optimizer)**: Task 8.2
- **Req 22 (Prioritization)**: Task 8.3
- **Req 23 (CMS Detection)**: Task 6.4
- **Req 24 (Dashboard Score)**: Task 8.4
- **Req 25 (Action Items)**: Task 8.6
- **Req 26 (Schema View)**: Task 8.7
- **Req 27 (Meta View)**: Task 8.8
- **Req 28 (AI Insights)**: Task 8.9
- **Req 29 (Re-diagnosis)**: Task 8.10
- **Req 30 (Vercel)**: Task 11.1
- **Req 31 (n8n Deploy)**: Task 11.2
- **Req 32 (Domain/SSL)**: Task 11.3
- **Req 33 (Sentry)**: Task 9.1
- **Req 34 (PostHog)**: Task 9.2
- **Req 35 (Security)**: Tasks 1.3, 2.1, 5.3, 10.1, 12.1
- **Req 36 (Performance)**: Task 10.2
- **Req 37 (Crawl Timeout)**: Task 5.4
- **Req 38 (WCAG)**: Task 10.1
- **Req 39 (Logging)**: Task 9.4
- **Req 40 (Health Check)**: Task 9.3

---

## Notes for Implementation

1. **Parallel Execution**: Tasks marked `(P)` can be executed in parallel within logical groups. For example, all auth tasks (2.x) can run in parallel after database setup (1.x).

2. **Sequential Dependencies**:
   - Database setup (1.x) must complete before auth (2.x) and onboarding (4.x)
   - Onboarding (4.x) depends on crawl integration (5.x) and n8n workflow (5.1)
   - Dashboard (8.x) depends on scoring (7.x) and diagnosis (7.7)
   - Deployment (11.x) can begin after core functionality (7.x, 8.x) is complete

3. **Testing**: Unit tests (10.3-10.5) are marked optional with `*` checkbox. They are deferrable post-MVP, though recommended for production readiness.

4. **Document References**: Refer to `design.md` for component interfaces, architecture patterns, and data contracts. All task implementations should align with the Hexagonal Architecture and domain boundaries defined in design.md.

---

## Completion Criteria

MVP is complete when:

- All code tasks (1.1-12.2) are implemented and tested
- TypeScript/ESLint/build verification passes
- Sentry error tracking is active and functioning
- Health check endpoint returns healthy status
- E2E critical flows (signup → diagnosis → dashboard → copy assets) complete successfully
- Vercel and Railway deployments are live and accessible
- Documentation is complete and accurate
