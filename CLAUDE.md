# Findably

> URL 하나로 SEO + GEO 통합 진단. AI가 마케팅 점수를 매기고 실행 계획까지 제시하는 SaaS.

## 시작

- 최초: docs/PRD.md 저장 → `/init-prd`
- 매일: `/start` → 승인 → 작업
- 디자인: ~/project/coding/design-references/ 참조

## 기술 스택

| 카테고리   | 스택                            |
| ---------- | ------------------------------- |
| 프레임워크 | Next.js 15 (App Router, SSR)    |
| 스타일링   | Tailwind CSS v4 + shadcn/ui     |
| DB         | Supabase PostgreSQL + RLS       |
| 인증       | Supabase Auth (이메일 + Google) |
| AI         | Claude API (Sonnet 4.6)         |
| 크롤링     | Playwright + n8n                |
| 결제       | Toss Payments (건당 9.9만원)    |
| 배포       | Vercel                          |
| 에러       | Sentry                          |

## 보안 분류

- 결제 (billing): 🔴 — 직접 코드 + 수동 검증
- 인증/크롤링/고객데이터: 🟡 — Supabase Auth + RLS

## 폴더 구조 (v6.4)

- `src/app/` — 라우트만 (얇게)
- `src/features/` — 기능별 독립 모듈 (★핵심)
  - onboarding, crawling, diagnosis-free, diagnosis-paid
  - geo-engine, competitors, report, actions, payment, sample
- `src/shared/` — 공통 컴포넌트/유틸
- `src/lib/adapters/` — 외부 서비스 어댑터 (ai, payment, email, crawler, pdf)
- `src/config/` — 설정 외부화 (scoring, access-control, features, seo)
- `e2e/` — E2E 테스트

## 핵심 규칙

- TypeScript strict, any 금지
- features/A → features/B 직접 import 금지
- 외부 서비스 → lib/adapters/ 통해서만
- 매직 넘버 금지 → config/에서 import
- 5가지 상태 필수 (로딩/정상/빈/에러/오프라인)
- 스코프 크리프 금지 → "다음 Task로 제안"
- main 직접 수정 금지

## 디자인 규칙

- 색상: @theme inline의 시맨틱 토큰 사용 (bg-primary-500, text-success-600 등)
- 점수 색상: config/scoring.ts의 SCORING.getScoreColor() 사용, 직접 색상 판단 금지
- 타이포: font-sans(Pretendard) 본문, font-display(DM Sans) 점수/숫자, font-mono 코드
- 접근성: 게이지=role="meter"+aria-valuenow/min/max, 접기=aria-expanded, 섹션=aria-labelledby
- 모션: prefers-reduced-motion 반드시 존중, globals.css의 landing-stagger 사용
- 5가지 상태: 로딩/정상/빈(EmptyState)/에러(ErrorCard)/오프라인(OfflineBanner) 필수
- 상세: @docs/design-system.md 참조

## 검증 게이트

tsc → eslint → build → test 통과 전 다음 Task 금지

## 참조 (필요 시 읽기)

- @docs/PRD.md
- @docs/ia-sitemap.md
- @docs/design-system.md
- @docs/ia-userflows.md
- @docs/module-boundary.md
- @docs/learnings.md

## 명령어

pnpm dev / pnpm build / pnpm lint / pnpm test / pnpm test:e2e
