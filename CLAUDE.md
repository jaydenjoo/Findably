# Findably

> URL만 넣으면 AI가 마케팅을 진단하고 실행까지 자동화하는 올인원 SaaS

## 프로젝트 시작 프로토콜

- 최초 1회: PRD를 docs/PRD.md에 저장 → `/init-prd` → 전체 초기 설정
- 매 세션: `/start` → PROGRESS.md + plan.md + learnings.md 로드 → 승인 → 작업

## 기술 스택

| 카테고리 | 스택 |
|---------|------|
| 프레임워크 | Next.js 15 (App Router, Server Components 기본) |
| 스타일링 | Tailwind CSS v4 + shadcn/ui CLI v4 |
| DB | Supabase PostgreSQL + Drizzle ORM |
| 인증 | Supabase Auth (이메일 + Google OAuth) |
| AI | Claude API (Sonnet) — 콘텐츠 분석, 인사이트 |
| 자동화 | n8n (self-hosted) — 크롤링, 모니터링 |
| 크롤링 | Playwright (Headless) |
| 배포 | Vercel (프론트) + Railway (n8n) |
| 보안 분류 | 🟡 보통 (외부 연동, 비공개 데이터) |

## 아키텍처 규칙

- `src/app/` — 라우팅만. 비즈니스 로직 금지
- `src/actions/` — Server Actions (데이터 변경)
- `src/lib/` — 유틸리티, 설정, 공유 로직
- `src/components/ui/` — shadcn 컴포넌트 (CLI로만 수정)
- `src/db/schema.ts` — Drizzle 스키마 (DB 진실의 원천)
- 상세: @docs/architecture.md

## 코딩 규칙

- TypeScript `strict: true`, `any` 금지 → `unknown` + 타입 가드
- Server Component 기본, `"use client"` 최소화
- 입력 검증: Zod (프론트+백 공유: `src/lib/validations/`)
- 에러 처리: 모든 async에 try/catch, 사용자 친절 메시지
- 환경변수: `.env.local`만, 하드코딩 절대 금지

## 엔터프라이즈 가드

- **스코프 크리프 금지**: 요청 외 기능 → "다음 Task로 제안합니다"
- **1 Task 1 Focus**: 30분~2시간 단위, 동시 진행 금지
- **검증 게이트**: tsc → eslint → build → test 통과 전 다음 Task 금지
- **보안 분류**: "돈, 신원, 법적" 해당 시 자동화 도구 금지, 수동 검증

## 컨텍스트 관리 (Context Engineering)

- 컨텍스트 50% 이상 → `/compact` 실행 (plan.md에 핵심 먼저 기록)
- 완전히 다른 작업 → `/clear` 후 새 시작 (plan.md가 맥락 유지)
- 긴 작업(2시간+) → plan.md에 진행상황 기록 후 새 세션 권장
- 코드 리뷰 → 새 세션에서 (신선한 시각 = Writer/Reviewer 패턴)

## 외부 메모리 (/compact 후에도 살아남는 파일)

- plan.md — 현재 계획, 아키텍처 결정, 진행 상태
- PROGRESS.md — 전체 프로젝트 진행 현황
- docs/learnings.md — 복리 지식 (교훈)

## 주요 명령어

```bash
pnpm dev                    # 개발 서버
pnpm build                  # 프로덕션 빌드
pnpm lint                   # ESLint
pnpm dlx shadcn@latest add  # shadcn 컴포넌트 추가
pnpm drizzle-kit generate   # DB 마이그레이션 생성
pnpm drizzle-kit push       # DB 마이그레이션 적용
vitest run                  # 테스트 실행
```

## Git 워크플로우

- main 직접 수정 금지 (Hook이 차단)
- 작업 시작: `git checkout -b feature/[작업명]`
- Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- Task 완료: `/done` → 자동 커밋 + Push
- git commit 직접 하지 말 것 — `/done`이 처리

## 참조 문서

- @docs/PRD.md — 제품 요구사항
- @docs/learnings.md — 복리 지식
- @docs/architecture.md — 아키텍처 결정


# AI-DLC and Spec-Driven Development

Kiro-style Spec Driven Development implementation on AI-DLC (AI Development Life Cycle)

## Project Context

### Paths
- Steering: `.kiro/steering/`
- Specs: `.kiro/specs/`

### Steering vs Specification

**Steering** (`.kiro/steering/`) - Guide AI with project-wide rules and context
**Specs** (`.kiro/specs/`) - Formalize development process for individual features

### Active Specifications
- Check `.kiro/specs/` for active specifications
- Use `/kiro:spec-status [feature-name]` to check progress

## Development Guidelines
- Think in English, generate responses in Korean. All Markdown content written to project files (e.g., requirements.md, design.md, tasks.md, research.md, validation reports) MUST be written in the target language configured for this specification (see spec.json.language).

## Minimal Workflow
- Phase 0 (optional): `/kiro:steering`, `/kiro:steering-custom`
- Phase 1 (Specification):
  - `/kiro:spec-init "description"`
  - `/kiro:spec-requirements {feature}`
  - `/kiro:validate-gap {feature}` (optional: for existing codebase)
  - `/kiro:spec-design {feature} [-y]`
  - `/kiro:validate-design {feature}` (optional: design review)
  - `/kiro:spec-tasks {feature} [-y]`
- Phase 2 (Implementation): `/kiro:spec-impl {feature} [tasks]`
  - `/kiro:validate-impl {feature}` (optional: after implementation)
- Progress check: `/kiro:spec-status {feature}` (use anytime)

## Development Rules
- 3-phase approval workflow: Requirements → Design → Tasks → Implementation
- Human review required each phase; use `-y` only for intentional fast-track
- Keep steering current and verify alignment with `/kiro:spec-status`
- Follow the user's instructions precisely, and within that scope act autonomously: gather the necessary context and complete the requested work end-to-end in this run, asking questions only when essential information is missing or the instructions are critically ambiguous.

## Steering Configuration
- Load entire `.kiro/steering/` as project memory
- Default files: `product.md`, `tech.md`, `structure.md`
- Custom files are supported (managed via `/kiro:steering-custom`)
