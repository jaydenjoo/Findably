---
globs:
  - src/app/api/webhooks/**/*
  - src/features/auth/**/*
  - src/features/payment/**/*
  - src/lib/supabase/**/*
  - src/lib/adapters/payment*
  - src/middleware.ts
---

# 보안 규칙 (이 파일이 활성화되면 보안 민감 영역)

- Findably 보안 분류: 결제=🔴, 인증/크롤링/고객데이터=🟡
- "돈/신원/법적" 판단 기준 적용 중
- n8n 등 자동화 도구로 이 영역 코드 생성 금지. 수동 검증 필수
- 모든 입력: Zod 검증 필수. 검증 없이 DB/API 호출 금지
- 인증 체크: `supabase.auth.getUser()` 서버에서 반드시 확인
- RLS 우회 금지: `service_role` 키 사용 최소화, 사유 기록
- 에러 메시지: 스택 트레이스, DB 스키마, 내부 경로 노출 금지
- 토큰/시크릿: 절대 클라이언트 코드에 포함 금지. `NEXT_PUBLIC_` 접두사 주의
- XSS: `dangerouslySetInnerHTML` 사용 시 보안 리뷰 필수
- CSRF: Server Actions 사용 (Next.js 기본 보호)

## 결제 (🔴 Toss Payments)

- 결제 금액 서버에서 검증 (클라이언트 금액 신뢰 금지)
- 건당 9.9만원 고정 — config/에서 관리
- 결제 성공/실패 웹훅 멱등성 보장
