# E2E 테스트 — Task 10.5

## 개요

Findably MVP의 핵심 사용자 플로우를 검증하는 End-to-End (E2E) 테스트입니다.

**프레임워크**: Playwright (Chrome + Firefox)
**테스트 대상**:
1. Signup → Onboarding → Diagnosis → Dashboard 전체 플로우
2. Schema Markup 보기 및 코드 복사
3. 재진단(Re-Diagnosis) 트리거

## 사전 요구사항

### 1. 환경 변수 설정
Supabase 프로젝트를 생성하고 `.env.local` 파일에 설정해야 합니다:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_ANTHROPIC_API_KEY=your-anthropic-key
```

### 2. Supabase 프로젝트 초기화
```bash
# 마이그레이션 적용
pnpm db:push

# RLS 정책 적용 (수동)
# - Supabase 대시보드 → SQL Editor
# - drizzle/rls-policies.sql 실행
```

### 3. 개발 서버 실행
```bash
pnpm dev
```

## 테스트 실행

### 모든 E2E 테스트 실행
```bash
pnpm test:e2e
```

### 특정 테스트 파일만 실행
```bash
pnpm exec playwright test e2e/critical-flows.spec.ts
```

### UI 모드로 실행 (권장 — 로컬 개발)
```bash
pnpm test:e2e:ui
```

이 모드에서는 브라우저에서 테스트를 진행하고, 각 단계에서 멈춰서 확인할 수 있습니다.

### 디버그 모드
```bash
pnpm test:e2e:debug
```

## 테스트 명세

### Test 1: Signup → Onboarding → Diagnosis → Dashboard
**시나리오**:
- 회원가입 (이메일 + 비밀번호)
- 온보딩 3단계 완료:
  1. URL 입력: `https://example.com`
  2. 산업 선택: `기술`
  3. 회사 규모: `1-10명`
- 진단 완료 대기
- 대시보드 데이터 표시 확인

**검증 항목**:
- ✓ Signup 페이지 로드
- ✓ 회원가입 성공 → `/onboarding` 리디렉트
- ✓ 온보딩 폼 표시 및 단계 진행
- ✓ 진단 시작 → 완료 대기
- ✓ 대시보드 로드 (`/dashboard/[company_id]`)
- ✓ 진단 결과 표시 (점수, 카테고리별 점수)
- ✓ 탭 표시 (종합 점수, 개선 항목, Schema, 메타 태그, AI 인사이트)

**예상 결과**: PASS

---

### Test 2: Schema Markup 보기 및 코드 복사
**시나리오**:
- 대시보드에서 "Schema Markup" 탭 클릭
- "복사" 버튼 클릭
- 클립보드 복사 확인

**검증 항목**:
- ✓ Schema Markup 탭 표시
- ✓ JSON-LD 코드 블록 표시
- ✓ "복사" 버튼 동작
- ✓ 복사 액션 완료

**예상 결과**: PASS

---

### Test 3: 재진단(Re-Diagnosis) 트리거
**시나리오**:
- 대시보드에서 "재진단" 버튼 클릭
- 진단 재실행 시작 또는 완료 대기
- 대시보드 새로고침 또는 결과 업데이트 확인

**검증 항목**:
- ✓ "재진단" 버튼 표시 및 클릭 가능
- ✓ 버튼 클릭 후 로딩 상태 표시 또는 진단 페이지 리디렉트
- ✓ 진단 완료 후 대시보드로 복귀
- ✓ 결과 업데이트 또는 새로고침 완료

**예상 결과**: PASS (구현 후)

---

## 추가 테스트 (Edge Cases)

### Test 4: 유효하지 않은 URL 입력
- 유효하지 않은 URL 입력 시 에러 메시지 표시

### Test 5: 잘못된 로그인 자격증명
- 잘못된 이메일/비밀번호로 로그인 시도 → 에러 메시지

### Test 6: 인증 없이 보호된 라우트 접근
- `/dashboard/1` 직접 접근 → `/login` 리디렉트
- `/onboarding` 직접 접근 → `/login` 리디렉트

## 주요 컴포넌트의 data-testid

E2E 테스트가 안정적으로 요소를 찾을 수 있도록 다음 `data-testid` 속성을 사용합니다:

| 컴포넌트 | data-testid | 용도 |
|---------|-------------|------|
| Dashboard 탭 | `dashboard-tabs` | 탭 컨테이너 |
| Schema 탭 | `tab-schema` | Schema Markup 탭 |
| Schema View | `schema-view` | Schema Markup 섹션 |
| 코드 블록 | `schema-code-block` | JSON-LD 코드 표시 영역 |
| 복사 버튼 | `copy-button` | 클립보드 복사 버튼 |
| 점수 제목 | `score-heading` | 종합 점수 제목 |

## 문제 해결

### 에러: "Supabase 프로젝트 URL 필요"
→ `.env.local` 파일 확인. `NEXT_PUBLIC_SUPABASE_URL` 설정 필수.

### 에러: "개발 서버 연결 불가"
→ `pnpm dev` 실행 중인지 확인. 포트 3000이 사용 중인지 확인.

### 테스트 타임아웃
→ `playwright.config.ts`에서 `timeout` 값 증가
→ 느린 네트워크 환경에서는 `waitForURL()` 타임아웃도 조정

### 클립보드 복사 확인 안 됨
→ Playwright는 보안상 실제 클립보드 접근이 제한되어 있음
→ 대신 복사 버튼 동작 확인 및 클릭 완료로 검증

## CI 통합

GitHub Actions에서 E2E 테스트를 자동 실행하려면:

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
      - run: pnpm test:e2e
```

## 요구사항 매핑 (Task 10.5)

- **6.1**: "사용자는 대시보드에서 진단 결과를 명확하게 이해할 수 있어야 한다"
  → Test 1에서 검증: 점수, 등급, 카테고리별 점수 표시

- **24.1**: "사용자는 Schema Markup 코드를 쉽게 복사할 수 있어야 한다"
  → Test 2에서 검증: 복사 버튼 동작

- **29.1**: "사용자는 필요 시 재진단을 트리거할 수 있어야 한다"
  → Test 3에서 검증: 재진단 버튼 및 프로세스

## 다음 단계

1. **Task 10.5 구현 완료 후**:
   - 개발 서버 실행: `pnpm dev`
   - UI 모드로 테스트: `pnpm test:e2e:ui`
   - 모든 테스트 확인: `pnpm test:e2e`

2. **실패 테스트 디버깅**:
   - 각 단계에서 스크린샷/비디오 확인
   - 실제 사용 흐름과 비교
   - 필요시 선택자(`data-testid`) 조정

3. **프로덕션 배포 전**:
   - 스테이징 환경에서 전체 E2E 테스트 실행
   - 실제 Supabase 프로젝트로 테스트
   - 성능 및 타임아웃 검증
