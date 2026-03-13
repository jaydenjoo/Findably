# PROGRESS.md — Findably

> 이 파일을 새 세션 시작 시 로드하면 100% 이어서 작업 가능
> 최종 업데이트: 2026-03-13

## 현재 상태

- 현재 Epic: Epic 1 — 프로젝트 셋업
- 현재 Task: 1.3 Supabase Auth (TASK-6부터 재개)
- 스펙 상태: approved-tasks (docs/specs/supabase-auth.md)
- 빌드 상태: tsc + eslint 통과 (2026-03-13)

## ✅ 완료된 작업

- [x] 2026-03-12: 프로젝트 초기화 (Next.js 15 + Tailwind v4 + shadcn/ui)
- [x] 2026-03-12: 기본 폴더 구조 (features/, shared/, lib/adapters/, config/)
- [x] 2026-03-12: shadcn/ui 컴포넌트 7개 (button, card, input, label, badge, skeleton, progress)
- [x] 2026-03-12: config/ 파일 (access-control, seo, features, scoring)
- [x] 2026-03-12: shared 컴포넌트 (ErrorBoundary, JsonLd, schema)
- [x] 2026-03-12~13: Supabase Auth 스펙 완료 (spec-init → spec-design → validate-design → spec-tasks)

## 🔄 진행 중

- [ ] Epic 1, Task 1.3: Supabase Auth 구현 (10개 태스크, ~10시간)
  - [x] TASK-1: Supabase 클라이언트 + 환경 변수 ✅ 2026-03-13
  - [x] TASK-2: Zod 검증 스키마 ✅ 2026-03-13
  - [x] TASK-3: DB 마이그레이션 — profiles + RLS + 보안 고도화 ✅ 2026-03-13
  - [x] TASK-4: Server Actions 5개 (login, signup, logout, reset-password, update-password) ✅ 2026-03-13
  - [x] TASK-5: Auth Callback Route Handler ✅ 2026-03-13
  - [ ] TASK-6: Middleware (세션 갱신 + 라우트 보호) ← **다음 작업**
  - [ ] TASK-7: Auth 폼 컴포넌트 5개
  - [ ] TASK-8: SessionExpiryWarning
  - [ ] TASK-9: Auth 페이지 + 레이아웃
  - [ ] TASK-10: 테스트 + 통합 검증

## ⏭️ 다음 할 일

- Epic 1, Task 1.4: DB 스키마 (diagnoses 등)
- Epic 1, Task 1.5: GNB + 라우팅 + 레이아웃

## 🔑 결정사항 기록

| 날짜       | 결정                                       | 이유                                                                   |
| ---------- | ------------------------------------------ | ---------------------------------------------------------------------- |
| 2026-03-12 | @supabase/ssr 사용 (auth-helpers 아닌)     | 공식 권장, cookie getAll/setAll 패턴                                   |
| 2026-03-12 | Server Actions 기반 auth (API Routes 아닌) | Next.js 15 권장 패턴, CSRF 자동 방어                                   |
| 2026-03-12 | PKCE flow 사용                             | 보안 강화, Supabase 기본 설정                                          |
| 2026-03-13 | chatsio-v1 Supabase 프로젝트 공유 사용     | 무료 티어 제한. 함수/트리거 `findably_` 접두사, 테이블 충돌 방지       |
| 2026-03-13 | RLS 보안 고도화 (migration 002)            | authenticated 제한, search_path 보안, 컬럼 변조 방지                   |
| 2026-03-13 | Apify는 Epic 3/6에서 검토                  | 현재 Epic 1이므로 PRD에 메모만. lib/adapters/apify.ts 어댑터 패턴 예정 |

## 📂 이번 세션에서 생성/수정된 파일

| 파일                                                        | 상태          | 설명                                  |
| ----------------------------------------------------------- | ------------- | ------------------------------------- |
| src/lib/supabase/server.ts                                  | 생성(TASK-1)  | 서버 Supabase 클라이언트 팩토리       |
| src/lib/supabase/client.ts                                  | 생성(TASK-1)  | 브라우저 Supabase 클라이언트          |
| src/features/auth/schemas.ts                                | 생성(TASK-2)  | Zod 검증 스키마 4개                   |
| src/features/auth/types.ts                                  | 생성(TASK-4)  | AuthActionState + AUTH_ERROR_GENERIC  |
| src/features/auth/actions/login.ts                          | 생성(TASK-4)  | 로그인 Server Action                  |
| src/features/auth/actions/signup.ts                         | 생성(TASK-4)  | 회원가입 Server Action                |
| src/features/auth/actions/logout.ts                         | 생성(TASK-4)  | 로그아웃 Server Action                |
| src/features/auth/actions/reset-password.ts                 | 생성(TASK-4)  | 비밀번호 재설정 요청                  |
| src/features/auth/actions/update-password.ts                | 생성(TASK-4)  | 새 비밀번호 설정                      |
| src/app/auth/callback/route.ts                              | 생성(TASK-5)  | OAuth/이메일인증/recovery 콜백 핸들러 |
| supabase/migrations/001_findably_profiles.sql               | 생성(TASK-3)  | profiles 테이블 + 트리거 + RLS        |
| supabase/migrations/002_findably_profiles_rls_hardening.sql | 생성(TASK-3+) | RLS 보안 고도화 3건                   |
| docs/PRD.md                                                 | 수정          | Apify 활용 메모 추가 (어댑터 목록)    |

## 🐛 알려진 이슈

| 이슈   | 심각도 | 상태 |
| ------ | ------ | ---- |
| (없음) | —      | —    |

## 💡 교훈

- Tailwind v4: bg-gradient-to-_ → bg-linear-to-_ 변경됨
- Zod v4: `.errors` 제거됨, `.issues`만 사용 (아래 learnings.md 참조)

## ⚠️ Jayden 행동 규칙 (세션 간 유지)

1. 다음 명령어 실행 전 "이게 뭐고 왜 필요한지" 먼저 설명할 것
2. learnings.md 기록: 제안 → Jayden 승인 → 기록 (승인 없이 기록 금지)
