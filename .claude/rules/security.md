---
paths:
  - src/app/api/webhooks/**/*
  - src/actions/auth*
  - src/actions/payment*
  - src/lib/supabase/**/*
  - src/db/**/*
  - middleware.ts
---

# 보안 규칙 (이 파일이 활성화되면 보안 민감 영역)

- 보안 분류 "돈/신원/법적" 적용 중
- n8n 등 자동화 도구로 이 영역 코드 생성 금지. 수동 검증 필수
- 모든 입력: Zod 검증 필수. 검증 없이 DB/API 호출 금지
- 인증 체크: `supabase.auth.getUser()` 서버에서 반드시 확인
- RLS 우회 금지: `service_role` 키 사용 최소화, 사유 기록
- 에러 메시지: 스택 트레이스, DB 스키마, 내부 경로 노출 금지
- 토큰/시크릿: 절대 클라이언트 코드에 포함 금지. `NEXT_PUBLIC_` 접두사 주의
- SQL 인젝션: Drizzle ORM 파라미터화 쿼리만 사용
- XSS: `dangerouslySetInnerHTML` 사용 시 보안 리뷰 필수
- CSRF: Server Actions 사용 (Next.js 기본 보호)

## AI 생성 코드 보안 원칙 (2026)

- AI 생성 코드 = 신뢰 불가 코드. 주니어 인턴이 작성한 것과 동일하게 취급
- 새 패키지 추가 시: "직접 구현 가능한가?" 먼저 판단. 불필요한 의존성 = 공격 표면
- `pnpm audit` 결과 critical 취약점 → 즉시 수정 또는 대체
- 하드코딩된 시크릿 패턴: sk-ant-, AKIA, ghp_, glpat-, xox, PRIVATE KEY
- Supabase 상세 규칙: `.claude/rules/supabase.md` 참조
