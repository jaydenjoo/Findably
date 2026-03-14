# Task 2.3 — URL 입력 + 선택 정보 폼

## 목표

온보딩 2페이지(`/onboarding/url`, `/onboarding/info`) 완성.
F-001 흐름 중 "URL 입력 → 선택 정보 → 분석 대기" 구간의 앞 2단계.

완료 시: URL 입력 → Zod 검증 → `diagnoses` 테이블 INSERT → `/onboarding/info`로 이동 → 선택 정보 UPDATE → `/onboarding/analyzing`으로 이동.

---

## 변경 파일 (4개 신규, 2개 수정)

| 파일                                             | 상태     | 설명                                       |
| ------------------------------------------------ | -------- | ------------------------------------------ |
| `src/features/onboarding/schemas.ts`             | **신규** | URL + 선택 정보 Zod 스키마                 |
| `src/features/onboarding/types.ts`               | **신규** | OnboardingActionState 타입                 |
| `src/features/onboarding/actions/submit-url.ts`  | **신규** | URL Server Action (diagnoses INSERT)       |
| `src/features/onboarding/actions/submit-info.ts` | **신규** | 선택 정보 Server Action (diagnoses UPDATE) |
| `src/app/(onboarding)/onboarding/url/page.tsx`   | **수정** | 스텁 → URL 입력 폼 페이지                  |
| `src/app/(onboarding)/onboarding/info/page.tsx`  | **수정** | 스텁 → 선택 정보 폼 페이지                 |

---

## 기술 접근법

### 1. `src/features/onboarding/schemas.ts` — Zod 스키마

```ts
// URL 입력 스키마 (필수)
urlSchema = z.object({
  url: z
    .string()
    .min(1, 'URL을 입력해주세요')
    .url('올바른 URL 형식이 아닙니다')
    .refine(
      (url) => url.startsWith('http'),
      'http:// 또는 https://로 시작해야 합니다'
    ),
})

// 선택 정보 스키마 (모두 optional)
infoSchema = z.object({
  targetKeywords: z.string().optional(), // 쉼표 구분 → 배열 변환은 Action에서
  competitorUrls: z.string().optional(), // 쉼표 구분 → 배열 변환은 Action에서
  industry: z.string().max(100).optional(), // 업종
})
```

auth 모듈의 `schemas.ts` 패턴 참고.

### 2. `src/features/onboarding/types.ts` — 타입

```ts
export type OnboardingActionState = {
  error?: string
  diagnosisId?: string // URL 제출 성공 시 생성된 diagnosis ID
}
```

auth의 `AuthActionState` 패턴 동일.

### 3. `src/features/onboarding/actions/submit-url.ts` — URL 제출 Action

```
'use server'
1. FormData에서 url 추출
2. urlSchema.safeParse() → 실패 시 { error } 반환
3. supabase.auth.getUser() → 인증 확인
4. supabase.from('diagnoses').insert({ user_id, url, status: 'pending', tier: 'free' })
5. 성공 → redirect('/onboarding/info?id={diagnosisId}')
```

- auth의 `signupAction` 패턴 참고 (safeParse → supabase → redirect)
- 에러 시 generic 메시지 반환 (내부 정보 노출 금지)

### 4. `src/features/onboarding/actions/submit-info.ts` — 선택 정보 Action

```
'use server'
1. FormData에서 targetKeywords, competitorUrls, industry, diagnosisId 추출
2. infoSchema.safeParse() → 실패 시 { error } 반환
3. supabase.auth.getUser() → 인증 확인
4. 쉼표 구분 문자열 → 배열 변환 (targetKeywords, competitorUrls)
5. supabase.from('diagnoses').update({ target_keywords, competitor_urls, industry })
   .eq('id', diagnosisId).eq('user_id', userId)   ← 본인 소유 확인
6. 성공 → redirect('/onboarding/analyzing')
```

- RLS + 쿼리 레벨 이중 보호
- 스킵 가능: "건너뛰기" 버튼 → 바로 `/onboarding/analyzing`으로 redirect

### 5. `/onboarding/url/page.tsx` — URL 입력 페이지

- 페이지는 **Server Component** (metadata export)
- 폼은 별도 `_components/UrlForm.tsx` ('use client')
- 구조: Card > CardHeader(제목 + 설명) > CardContent(폼)
- 폼 패턴: `useActionState` + `onSubmit`에서 `safeParse` 클라이언트 검증
- 입력: URL 1개 + 제출 버튼
- UX: placeholder에 "https://example.com" 예시
- 접근성: Label + Input 연결, aria-describedby 에러 연결

### 6. `/onboarding/info/page.tsx` — 선택 정보 페이지

- 페이지는 **Server Component** (metadata export)
- 폼은 별도 `_components/InfoForm.tsx` ('use client')
- URL param으로 `diagnosisId` 수신 (hidden input)
- 필드 3개: 타겟 키워드, 경쟁사 URL, 업종 (모두 선택)
- 하단: "분석 시작 →" (submit) + "건너뛰기 →" (Link to /onboarding/analyzing)
- "건너뛰기"는 선택 정보 없이 바로 분석 진행

---

## 구현 순서

1. `features/onboarding/schemas.ts` + `types.ts` (기반)
2. `features/onboarding/actions/submit-url.ts` (URL Action)
3. `features/onboarding/actions/submit-info.ts` (Info Action)
4. `onboarding/url/page.tsx` + `_components/UrlForm.tsx` (URL 페이지)
5. `onboarding/info/page.tsx` + `_components/InfoForm.tsx` (Info 페이지)
6. 검증: `pnpm tsc --noEmit && pnpm lint && pnpm build`

---

## 스코프 외 (하지 않을 것)

- 분석 대기 화면 (`/onboarding/analyzing`) — Task 2.4
- 실제 크롤링 트리거 — Epic 3
- 중복 URL 체크 — Phase 2 (현재는 같은 URL 재진단 허용)
- URL 접근 가능 여부 사전 체크 — Epic 3 크롤링에서 처리
- DB 마이그레이션 — 이미 `003_findably_diagnoses.sql`에 스키마 완성

---

## 리스크

| 리스크                          | 대응                                           |
| ------------------------------- | ---------------------------------------------- |
| URL 형식 다양성 (www만 입력 등) | Zod refine으로 http:// 필수 + placeholder 안내 |
| diagnosisId 탈취 시도           | RLS + Action에서 user_id 검증 이중 보호        |
| 선택 정보 스킵 시 데이터 누락   | DB 컬럼이 nullable이므로 정상 동작             |
| searchParams 타입 (Next.js 15)  | `searchParams`는 Promise — `await` 필수        |

---

## 검증 방법

1. `pnpm tsc --noEmit` — 타입 에러 0
2. `pnpm lint` — 에러 0
3. `pnpm build` — 성공
4. 브라우저: `/onboarding/url` 접근 → URL 입력 → 제출 → `/onboarding/info` 이동 확인
5. 브라우저: `/onboarding/info` 접근 → 정보 입력 or 건너뛰기 → `/onboarding/analyzing` 이동 확인
6. Supabase: `diagnoses` 테이블에 레코드 생성 확인
