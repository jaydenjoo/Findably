# 📚 Learnings — 복리 지식 저장소

> 같은 실수를 반복하지 않기 위한 교훈 기록
> **형식**: 증상 → 원인 → 해결 → **규칙** (규칙이 핵심!)

---

<!-- 예시 (실제 기록 시 이 예시는 삭제) -->

### 2026-03-10 [예시] Tailwind v4 그라데이션 클래스 변경

- **증상**: `bg-gradient-to-r` 클래스가 작동하지 않음
- **원인**: Tailwind v4에서 `bg-gradient-to-*` → `bg-linear-to-*`로 변경됨
- **해결**: 모든 그라데이션 클래스를 `bg-linear-to-*`로 교체
- **규칙**: Tailwind v4에서는 항상 `bg-linear-to-*` 사용. `npx @tailwindcss/upgrade` 실행으로 자동 변환 가능

---

<!-- 여기부터 실제 기록 -->

### 2026-03-12 createServiceDb()는 RLS를 우회한다 — API 라우트에서 반드시 ownership 검증 필수

- **증상**: API 라우트에서 companyId만 받으면 다른 사용자의 데이터도 조회 가능
- **원인**: `createServiceDb()`가 service_role 키를 사용해 RLS를 우회. API 라우트에서 별도 소유권 검증이 없었음
- **해결**: 모든 API 라우트에서 `companiesTable.userId === user.id` 검증 추가
- **규칙**: createServiceDb() 사용 시 반드시 수동 ownership 검증 코드 추가. 장기적으로 createAuthenticatedDb(jwt) 패턴 도입 필요

### 2026-03-12 auth callback의 `next` 파라미터 = Open Redirect 벡터

- **증상**: `/auth/callback?next=https://evil.com` 으로 리디렉트 공격 가능
- **원인**: 쿼리 파라미터를 검증 없이 `redirect()`에 전달
- **해결**: `isSafeRedirectPath()` — `/`로 시작하는 상대 경로만 허용, `://`와 `//` 차단
- **규칙**: redirect 대상은 반드시 상대 경로만 허용. URL-encoded 우회(`%2F%2F`)도 검증할 것

### 2026-03-12 Claude API 응답은 항상 Zod로 검증해야 한다

- **증상**: LLM 응답이 예상 형식과 다를 때 런타임 에러 또는 잘못된 데이터 저장
- **원인**: `as Record<string, unknown>` 타입 단언으로 실제 검증 없이 사용
- **해결**: `analysisResponseSchema.safeParse()`로 응답 구조+타입 검증
- **규칙**: LLM/외부 API 응답은 절대 타입 단언하지 말고 Zod safeParse() 사용. 입력도 길이 제한(프롬프트 인젝션 방어)
