# [프로젝트명]

> 한줄 설명

## 시작

- 최초: docs/PRD.md 저장 → `/init-prd`
- 매일: `/start` → 승인 → 작업
- 디자인: ~/project/coding/design-references/ 참조

## 기술 스택

| 카테고리 | 스택 |
|---------|------|
| 프레임워크 | Next.js 15 (App Router, SSR) |
| 스타일링 | Tailwind CSS + shadcn/ui |
| DB | Supabase PostgreSQL |
| 인증 | Supabase Auth |
| AI | Claude API |
| 배포 | Vercel |

## 폴더 구조 (v6.4)

- `src/app/` — 라우트만 (얇게)
- `src/features/` — 기능별 독립 모듈 (★핵심)
- `src/shared/` — 공통 컴포넌트/유틸
- `src/lib/adapters/` — 외부 서비스 어댑터 (교체 가능)
- `src/config/` — 설정 외부화 (하드코딩 금지)
- `e2e/` — E2E 테스트

## 핵심 규칙

- TypeScript strict, any 금지
- features/A → features/B 직접 import 금지
- 외부 서비스 → lib/adapters/ 통해서만
- 매직 넘버 금지 → config/에서 import
- 5가지 상태 필수 (로딩/정상/빈/에러/오프라인)
- 스코프 크리프 금지 → "다음 Task로 제안"
- main 직접 수정 금지

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
