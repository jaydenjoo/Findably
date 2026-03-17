# Task 10.3: E2E 테스트 (핵심 3 Flow) — 구현 계획

## 목표

PRD F-001/F-002/F-003 핵심 유저 플로우를 Playwright E2E 테스트로 커버한다.

완료 조건:

- F-001 (무료 진단 Flow): 랜딩 → 가입 → URL 입력 → 분석 대기 → 대시보드
- F-002 (샘플 열람 Flow): 랜딩/대시보드 → 샘플 리포트 → CTA 확인
- F-003 (유료 전환 Flow): 대시보드 BlurOverlay CTA → 결제 페이지 연결 확인
- 기존 auth.spec.ts + layout.spec.ts 깨지지 않음
- `pnpm test:e2e` 전체 통과

---

## 현재 상태

### 이미 존재

- **Playwright 설정**: `e2e/playwright.config.ts` (baseURL: localhost:3600)
- **auth.spec.ts**: 로그인/회원가입/비밀번호재설정 페이지 렌더링 + 네비게이션 (7 tests)
- **layout.spec.ts**: GNB + CTA + 접근제어 + 반응형 (4 describe blocks)
- **테스트 패턴**: 접근성 셀렉터 (`getByRole`, `getByLabel`, `getByText`)
- **모든 라우트 구현 완료**: 25개 page.tsx 파일

### 없는 것

- F-001 무료 진단 플로우 테스트
- F-002 샘플 열람 플로우 테스트
- F-003 유료 전환 플로우 테스트

---

## 기술 접근법

### 핵심 결정

1. **UI 수준 테스트**: 실제 Supabase 인증/DB 없이 UI 렌더링 + 네비게이션 + 폼 검증에 집중 (기존 패턴 유지)
2. **비로그인 접근 가능 경로만 실제 네비게이션 테스트**: `/`, `/signup`, `/login`, `/pricing`, `/reports/sample`
3. **인증 필요 경로는 리다이렉트 검증**: `/dashboard`, `/onboarding/*`, `/actions/*` → `/login` 리다이렉트 확인
4. **결제 플로우는 CTA 존재 + 링크 검증**: Toss Payments 실제 호출 불가 → BlurOverlay CTA 렌더링 + href 확인

### 왜 UI 수준인가?

실제 인증 테스트는 로컬 Supabase 인스턴스가 필요하며 CI 환경 설정이 별도 Task. 기존 auth.spec.ts도 동일한 접근법 사용 중. UI 수준 검증만으로도 라우팅/렌더링/접근제어 회귀를 충분히 방지.

---

### 파일 구조

```
e2e/flows/
├── auth.spec.ts         ← 기존 (수정 없음)
├── layout.spec.ts       ← 기존 (수정 없음)
├── f001-free-diagnosis.spec.ts   ← 신규
├── f002-sample-report.spec.ts    ← 신규
└── f003-paid-upgrade.spec.ts     ← 신규
```

**총 파일**: 신규 3개 (기존 수정 0개)

---

## 신규 파일 상세 (3개)

### 1. `f001-free-diagnosis.spec.ts` — 무료 진단 Flow

PRD F-001 경로: `/` → `/signup` → `/onboarding/url` → `/onboarding/analyzing` → `/dashboard`

```
테스트 케이스:
1. 랜딩 → "무료 진단 시작" CTA → /signup 이동 확인
2. /signup 폼 렌더링 (이메일 + 비밀번호 + Google)
3. /signup → 가입 후 → /onboarding/url 경로 존재 확인 (비로그인 시 /login 리다이렉트)
4. /onboarding/url → /login 리다이렉트 (비로그인 접근 제어)
5. /onboarding/info → /login 리다이렉트 (비로그인 접근 제어)
6. /onboarding/analyzing → /login 리다이렉트 (비로그인 접근 제어)
7. /dashboard → /login 리다이렉트 (비로그인 접근 제어)
```

### 2. `f002-sample-report.spec.ts` — 샘플 열람 Flow

PRD F-002 경로: 랜딩 → `/reports/sample` → CTA

```
테스트 케이스:
1. /reports/sample 페이지 렌더링 (비로그인 접근 가능)
2. 샘플 리포트에 "그린테크" 브랜드명 표시 확인
3. 샘플 리포트에 주요 섹션 렌더링: 점수, SWOT, 로드맵, 인사이트 등
4. "내 사이트도 분석하기" CTA 존재 + /signup 또는 /onboarding 링크 확인
5. 랜딩 페이지에서 "샘플 리포트 보기" 링크 → /reports/sample 확인
6. 모바일 뷰포트 (375px) 에서 샘플 리포트 렌더링 확인
```

### 3. `f003-paid-upgrade.spec.ts` — 유료 전환 Flow

PRD F-003 경로: /dashboard BlurOverlay CTA → 결제

```
테스트 케이스:
1. /dashboard → 비로그인 시 /login 리다이렉트 (이미 layout.spec.ts에 있지만 flow 맥락 재검증)
2. /reports/my/[id] → 비로그인 시 /login 리다이렉트
3. /actions/schema → 비로그인 시 /login 리다이렉트
4. /actions/meta-tags → 비로그인 시 /login 리다이렉트
5. /actions/roadmap → 비로그인 시 /login 리다이렉트
6. /diagnosis/competitors → 비로그인 시 /login 리다이렉트
7. /pricing 페이지 렌더링 + 가격 정보("9.9만원" 또는 "99,000") 표시 확인
8. /pricing → CTA 링크 존재 확인
```

---

## 리스크

| 리스크                                  | 심각도 | 대응                                                    |
| --------------------------------------- | ------ | ------------------------------------------------------- |
| 개발 서버 미실행 시 테스트 실패         | 🟢     | playwright.config.ts의 webServer가 자동 실행            |
| Supabase 미연결 시 특정 페이지 500 에러 | 🟡     | error.tsx 존재 확인, 비로그인 경로만 실제 렌더링 테스트 |
| 샘플 리포트 데이터 구조 변경 시 깨짐    | 🟢     | 텍스트 매칭 느슨하게 (정규식 사용)                      |
| layout.spec.ts 중복 테스트              | 🟢     | 의도적 — flow 맥락에서 재검증, 기존 것 수정 안 함       |

---

## 스코프 가드

- ❌ 실제 Supabase 인증 테스트 → 로컬 Supabase 인스턴스 설정 필요 (별도 Task)
- ❌ 실제 결제 테스트 → Toss Payments 테스트 모드 설정 필요 (Epic 9)
- ❌ E2E 테스트 CI 파이프라인 → GitHub Actions 설정 (Task 10.9 등)
- ❌ 스크린샷 비교 (Visual Regression) → Phase 2
- ❌ playwright.config.ts 수정 → 기존 설정 그대로 사용

---

## 구현 순서

| 단계 | 파일                        | 설명                                  |
| ---- | --------------------------- | ------------------------------------- |
| 1    | f001-free-diagnosis.spec.ts | 무료 진단 Flow (CTA 링크 + 접근 제어) |
| 2    | f002-sample-report.spec.ts  | 샘플 열람 Flow (렌더링 + CTA)         |
| 3    | f003-paid-upgrade.spec.ts   | 유료 전환 Flow (접근 제어 + pricing)  |

---

## 검증 방법

```bash
# 1. 기존 테스트 회귀 확인
pnpm test:e2e -- e2e/flows/auth.spec.ts
pnpm test:e2e -- e2e/flows/layout.spec.ts

# 2. 신규 테스트 실행
pnpm test:e2e -- e2e/flows/f001-free-diagnosis.spec.ts
pnpm test:e2e -- e2e/flows/f002-sample-report.spec.ts
pnpm test:e2e -- e2e/flows/f003-paid-upgrade.spec.ts

# 3. 전체 E2E 스위트
pnpm test:e2e
```
