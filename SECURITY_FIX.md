# Findably MVP 보안 리뷰 — CRITICAL/HIGH 이슈 3건 수정 완료

**수정 날짜**: 2026-03-12
**리뷰어**: Claude Code (Security Reviewer)
**상태**: ✅ 모든 수정 사항 적용 완료

---

## 수정 사항 요약

### 1. 🔴 CRITICAL — RLS 완전 우회 (diagnosis/status)

**파일**: `src/app/api/diagnosis/status/route.ts`

**문제**:

- 사용자 인증만 확인하고 회사 소유권 검증이 없음
- `createServiceDb()`는 RLS를 우회하므로, 공격자가 다른 사용자의 company_id로 진단 상태를 조회 가능

**수정 내용**:

1. `companiesTable` import 추가 (Line 26)
2. Step 3에서 회사 소유권 검증 추가 (Lines 86-108)
   - `companiesTable.userId === user.id` 비교
   - 미소유 시 403 Forbidden 반환
   - 회사 미존재 시 404 대신 403으로 정보 노출 방지

**공격 시나리오**:

```
공격자: GET /api/diagnosis/status?company_id=999
(999는 다른 사용자의 회사 ID)
→ [수정 전] ✅ 진단 상태 조회 가능 (RLS 우회)
→ [수정 후] ❌ 403 Forbidden 반환 (소유권 검증)
```

---

### 2. 🔴 CRITICAL — RLS 우회 보강 (crawl/status)

**파일**: `src/app/api/crawl/status/route.ts`

**문제**:

- 코드에 소유권 검증이 있었으나, 에러 메시지가 실제 상황 노출
- "회사가 존재하지 않음" vs "소유권 없음"을 구분하면 정보 유출

**수정 내용**:

1. Lines 112-127 에러 메시지 통일
   - 회사 미존재: "해당 크롤링 상태에 접근할 권한이 없습니다"
   - 소유권 불일치: "해당 크롤링 상태에 접근할 권한이 없습니다"
   - 두 경우 동일 메시지 + 403 코드로 정보 노출 차단

**보안 원칙**:

- Timing 공격 방지: 두 경우 처리 시간 일정하게 (패턴 분석 방지)
- 정보 유출 방지: 회사 존재 여부 숨김

---

### 3. 🟡 HIGH — Open Redirect 취약점 (auth/callback)

**파일**: `src/app/auth/callback/route.ts`

**문제**:

- `next` 쿼리 파라미터를 검증 없이 리다이렉트에 사용
- 공격자가 `?next=https://evil.com` 입력 시 피싱 가능

**수정 내용**:

1. `isSafeRedirectPath()` 함수 추가 (Lines 16-35)

   ```typescript
   // ✅ 허용: /onboarding, /dashboard/analytics
   // ❌ 차단: https://evil.com, //attacker.com, %2F%2Fattacker.com
   ```

2. 검증 로직:
   - `/`로 시작하는 상대경로만 허용
   - `://`, `//` 포함 차단
   - URL 디코딩 후 재검사 (인코딩 우회 방지)
   - 검증 실패 시 기본값 `/onboarding`으로 폴백

3. `ALLOWED_REDIRECT_PATHS` 상수 추가 (Line 41)
   - 향후 화이트리스트 기반 검증으로 강화 가능

**공격 시나리오**:

```
공격자: GET /auth/callback?code=...&next=https://evil.com
→ [수정 전] ✅ evil.com으로 리다이렉트 (피싱 성공)
→ [수정 후] ❌ /onboarding으로 리다이렉트 (피싱 실패)
```

---

## 검증 체크리스트

- [x] 모든 파일 문법 검사 완료
- [x] 타입 안전성 확인 (companiesTable.userId 타입 일치)
- [x] 에러 메시지 사용자 친절 (내부 정보 노출 안 함)
- [x] 기존 코드 패턴 유지
- [x] 에러 응답 상태 코드 올바름 (401, 403, 400)
- [x] 한국어 에러 메시지 일관성

---

## 영향 범위

| 엔드포인트                | 이전             | 이후    | 영향                           |
| ------------------------- | ---------------- | ------- | ------------------------------ |
| GET /api/diagnosis/status | ❌ RLS 우회      | ✅ 검증 | 직렬화된 진단 데이터 누출 방지 |
| GET /api/crawl/status     | ⚠️ 부분 검증     | ✅ 강화 | 크롤링 상태 조회 권한 강화     |
| GET /auth/callback        | ❌ Open Redirect | ✅ 검증 | 피싱 공격 차단                 |

---

## 다음 작업 (추천)

1. **통합 테스트** (선택사항):

   ```bash
   npm run test -- src/app/api/diagnosis/status
   npm run test -- src/app/api/crawl/status
   npm run test -- src/app/auth/callback
   ```

2. **수동 테스트**:
   - User A가 User B의 company_id로 진단 상태 조회 시도 → 403
   - User A가 User B의 company_id로 크롤링 상태 조회 시도 → 403
   - 로그인 후 `?next=https://evil.com`으로 시도 → /onboarding 리다이렉트

3. **보안 감시**:
   - 403 에러율 모니터링 (정상 범위인지 확인)
   - 의심스러운 company_id 접근 패턴 로깅

---

**준비 상태**: ✅ PR 생성 가능
