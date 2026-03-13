---
globs:
  - src/app/api/**/*
  - src/features/*/api/*
  - src/lib/api/*
  - src/lib/adapters/*
---

# API / 백엔드 규칙

- Server Actions 우선 사용. API Routes는 웹훅/외부 연동에만 사용
- 모든 입력은 Zod 스키마로 검증 후 처리. 검증 전 DB 접근 금지
- 에러 처리: try/catch 필수. 사용자에게 내부 에러 노출 금지
- 에러 로깅: `console.error("[함수명]", error)` 형식
- Supabase 클라이언트: 서버에서는 `createClient()` from `@/lib/supabase/server`
- RLS: 새 테이블 생성 시 반드시 RLS 정책 함께 작성
- 환경변수: `process.env.XX` 직접 접근. 하드코딩 금지
- 통일 응답 포맷: `src/lib/api/response.ts` 의 successResponse/errorResponse 사용
- 인증 래퍼: `src/lib/api/with-auth.ts` 의 withAuth 사용 (보호 API Route)
- 외부 서비스 직접 호출 금지 → lib/adapters/ 통해서만 (ai, payment, email, crawler, pdf)
