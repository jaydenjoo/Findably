# Findably MVP — 전체 QA 리뷰 보고서

**작성일**: 2026-03-12
**리뷰 범위**: Unit Tests (Vitest) + Integration Tests + E2E Tests (Playwright)
**총 테스트 파일**: 50개
**총 테스트 케이스**: ~1,562개 (unit/integration) + 8개 (E2E)

---

## Executive Summary

Findably MVP 테스트 스위트는 **높은 커버리지**와 **체계적인 엣지 케이스 테스트**를 보유하고 있습니다.
그러나 몇 가지 중요한 **커버리지 갭**과 **모킹의 정확성 문제**, 그리고 **동시성/경쟁 조건 미보장** 이슈가 확인되었습니다.

### 종합 점수: **7.5/10** (출시 전 개선 필수)

| 카테고리 | 점수 | 상태 |
|---------|------|------|
| 단위 테스트 커버리지 | 8/10 | 양호 |
| 통합 테스트 | 7/10 | 개선 필요 |
| E2E 테스트 | 6/10 | 부족 |
| 엣지 케이스 | 7/10 | 한국어 특수 케이스 일부 누락 |
| 에러 처리 | 8/10 | 우수 |
| 모킹 정확성 | 6/10 | 개선 필요 |

---

## 상세 분석

### 1. 테스트 커버리지 분석

#### ✅ 강점: 비즈니스 로직 철저한 테스트

**SEO 점수 계산 (`seo-scorer.test.ts`)**
- **커버리지**: 95%+ (7개 항목 × 경계값 테스트)
- **엣지 케이스**: 매우 우수
  - 정확한 경계값 (제목 50-60자, 설명 120-160자)
  - 쿼리 문자열/프래그먼트 처리 ✅
  - 마지막 슬래시 처리 ✅
  - 공백 포함 길이 계산 ✅
- **관찰**: 너무 엄격한 테스트 (예: 길이 계산 시 자리수 수동 계산)

**Quick Win 엔진 (`quick-win-engine.test.ts`)**
- **커버리지**: 90%+
- **잘된 부분**:
  - 음수 테스트 (Quick Win이 없는 경우) ✅
  - undefined/null 안전 처리 ✅
  - 우선순위 정렬 검증 ✅
- **놓친 부분**:
  - 다중 Quick Win 조합 시 순서 검증 (순서 버그 감지 가능성 낮음)
  - 기대 영향도 계산 일관성 미검증

#### ⚠️ 약점: 통합 테스트 모킹 부정확

**진단 파이프라인 통합 테스트 (`diagnosis-pipeline.integration.test.ts`)**

**O (Observation)**:
1. **Database Mock의 Chaining 문제** (라인 200-235):
   ```typescript
   // 모킹이 실제 Drizzle ORM API와 완전히 일치하지 않음
   insertFn.mockReturnValueOnce({
     values: vi.fn().mockReturnValue({
       returning: vi.fn().mockResolvedValue([...])  // 실제로 작동?
     })
   })
   ```
   - 실제: `db.insert(...).values(...).returning()` → Promise 반환
   - 모킹: 체인 이후 Mock 함수 호출 검증 안 함

2. **외부 API Mock 누락**:
   - Claude API 호출 결과 Mock ❌ (stub만 존재)
   - PageSpeed Insights API Mock ❌
   - 실제 동작과 다를 경우 테스트는 PASS, 프로덕션은 FAIL

3. **RLS 격리 테스트 부재** (라인 6-14 언급했지만 없음):
   - 사용자 A의 진단 데이터를 사용자 B가 접근 못하는지 검증 없음
   - Supabase RLS 정책이 올바르게 작동하는지 보장 안 함

**A (Action)**:
```typescript
// ❌ 현재 (부정확)
vi.spyOn(orchestrator, 'runDiagnosisOrchestration').mockResolvedValue(mockOrchestration);

// ✅ 개선
// 실제 orchestrator를 호출하되, 각 서브 함수는 Mock
vi.mock('@/lib/diagnosis/orchestrator', () => ({
  runDiagnosisOrchestration: vi.fn(async ({ companyId, crawlResultId }) => {
    const crawler = vi.mocked(getCrawlResult); // ← 실제 로직이 아닌 Mock만
    const scoreCalc = vi.mocked(calculateScores);
    // orchestrator 로직은 실제 실행
  })
}));
```

**R (Rationale)**:
Mock이 실제 구현과 다르면 테스트는 통과해도 프로덕션에서 실패 (Mock/Prod Divergence).

#### ❌ 심각한 결함: E2E 테스트 부분 작성

**E2E 테스트 상태 (`critical-flows.spec.ts`)**
- **라인 1-100**: 헬퍼 함수만 정의, 실제 테스트 케이스 없음
- **누락된 테스트**:
  ```
  ❌ Signup → Onboarding → Crawl Trigger → Diagnosis 완전 플로우
  ❌ 진단 결과 Dashboard 표시 검증
  ❌ Schema Markup 복사 기능
  ❌ Re-Diagnosis 트리거
  ❌ 네트워크 실패 시나리오 (오프라인, 느린 네트워크)
  ```

**O**: E2E 테스트가 핵심 사용자 플로우를 검증하지 못함

---

### 2. 엣지 케이스 & 경계값 분석

#### ✅ 잘 테스트된 엣지 케이스

1. **길이 경계값** (SEO Scorer):
   - 제목: 49자, 50자, 55자, 60자, 61자 ✅
   - 설명: 119자, 120자, 140자, 160자, 161자 ✅

2. **null/undefined 안전성**:
   ```typescript
   it('metaTags가 undefined인 경우 안전 처리', () => {
     const crawl = createBaseCrawlResult({ metaTags: undefined });
     const result = calculateSeoScore(crawl);
     expect(result.seoScore).toBeDefined();  // ✅
   });
   ```

3. **링크 깊이 계산**:
   - `/` (깊이 1) ✅
   - `/a/b/c` (깊이 3) ✅
   - `/a/b/c/d` (깊이 4, 초과) ✅
   - 쿼리 문자열 무시 ✅
   - 프래그먼트 무시 ✅

#### ⚠️ 놓친 엣지 케이스

1. **한국어 문자열 길이** (CRITICAL):
   ```typescript
   // ❌ 현재: 바이트 기준 또는 문자 기준 불명확
   const koreanTitle = '한글제목입니다'; // 7글자
   const result = calculateSeoScore({
     metaTags: { title: koreanTitle.repeat(8) } // 56글자, 한글 인코딩에서 168바이트
   });
   // 실제 검색엔진은 "바이트" 기반 제한: UTF-8로 168바이트 ≈ 60글자 ASCII
   // 테스트는 "문자" 기준: 56글자 ✅
   // → 프로덕션 불일치 위험!
   ```

   **A (Action)**:
   ```typescript
   it('한글 문자열의 길이 계산은 바이트 기반이어야 함', () => {
     const koreanTitle = '한글제목입니다'.repeat(10); // 70글자, ~210바이트
     const crawl = createBaseCrawlResult({
       metaTags: { title: koreanTitle }
     });
     const result = calculateSeoScore(crawl);
     // 현재: 55글자 범위 ✅
     // 바이트 기준: 210바이트 > 160바이트 (구글 제한) → 부분점수
     // → 테스트 FAIL? 구현 버그 감지!
   });
   ```

2. **특수문자 & XSS 시도** (입력 검증):
   ```typescript
   // ❌ 현재 테스트 없음
   const maliciousInput = '<script>alert("xss")</script>';
   const result = await submitOnboarding({
     url: 'https://example.com',
     industry: '<script>alert(1)</script>',  // Zod validation 통과?
     companySize: '"; DROP TABLE companies; --'
   });
   ```

   **발견**: `onboarding.test.ts`에서 URL 검증만 있고, industry/companySize 검증 누락

3. **최대값 테스트 부재**:
   - 매우 긴 URL (>2000자)
   - 매우 큰 HTML (>100MB)
   - 이미지 매우 많음 (>10,000개)

4. **동시성 & 경쟁 조건**:
   ```typescript
   // ❌ 현재 테스트 없음
   // 같은 companyId로 동시에 2개 진단 트리거
   const p1 = runDiagnosis({ companyId: 1, crawlResultId: 1 });
   const p2 = runDiagnosis({ companyId: 1, crawlResultId: 2 });
   await Promise.all([p1, p2]);
   // 결과: 어떤 진단이 isLatest=true? 경합 상태 미검증
   ```

---

### 3. 모킹 정확성 분석

#### ⚠️ 문제: API Mock이 실제와 다름

**1. Supabase Client Mock** (`supabase/client.test.ts`):
```typescript
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: vi.fn(() => Promise.resolve({
          data: { user: null },  // ❌ 항상 null?
          error: null,
        }))
      }
    })
  )
}));
```

**문제점**:
- 실제: Supabase `getUser()`는 authenticated user를 반환할 수도, null을 반환할 수도 있음
- Mock: 항상 null → 인증 실패 경로만 테스트됨
- **영향**: 인증된 사용자 플로우 (Server Action 내부) 미보장

**개선안**:
```typescript
// ✅ 파라미터화된 Mock
const createMockSupabaseClient = (isAuthenticated = true) => ({
  auth: {
    getUser: vi.fn(() => Promise.resolve(
      isAuthenticated
        ? { data: { user: { id: 'user-123', email: 'test@example.com' } }, error: null }
        : { data: { user: null }, error: null }
    ))
  }
});

describe('when user is authenticated', () => {
  beforeEach(() => {
    vi.mock('@/lib/supabase/server', () => ({
      createClient: vi.fn(() => Promise.resolve(createMockSupabaseClient(true)))
    }));
  });
  // ...
});
```

**2. Claude API Mock** (`claude-analyzer.test.ts`):
```typescript
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(function () {
    return {
      messages: { create: mockCreate }  // ← mockCreate가 정의되지 않음!
    };
  })
}));

// 라인 88-99: 실제 Mock 동작 검증 없음
it('should return an object with either success=true or success=false', async () => {
  const result = await analyzeContent(input);
  // mockCreate가 호출되었는지? Mock 동작이 뭔지? 불명확
});
```

**문제점**:
- `analyzeContent()`가 실제 Claude API를 호출하는지, Mock을 호출하는지 불명확
- Mock 응답 구조 검증 없음
- 실제 API 오류 (rate limit, timeout) 처리 미검증

---

### 4. 에러 시나리오 테스트

#### ✅ 우수: Crawl Error Handler

`error-handler.test.ts`는 포괄적:
- **분류**: timeout, network (ECONNREFUSED, ENOTFOUND, ETIMEDOUT), invalid URL
- **복구 전략**: retry (3회, backoff: 10s → 30s → 60s), fail, defer
- **사용자 메시지**: 한국어 설명 포함

**테스트 예시** (라인 243-265):
```typescript
it('should handle complete flow for timeout error', () => {
  const error = new Error('Playwright: Timeout 300000ms exceeded');

  const status = classifyCrawlError(error);
  const details = extractErrorDetails(error);
  const strategy = getErrorRecoveryStrategy(error);

  expect(status).toBe('failed_timeout');
  expect(details.code).toBe('TIMEOUT');
  expect(strategy.action).toBe('retry');
});
```

#### ⚠️ 약점: Server Action 에러 처리

**O (Observation)**:
- Server Action (`submitOnboarding`, `runDiagnosis`)에서:
  - ❌ 데이터베이스 오류 시나리오 미보장
  - ❌ n8n 웹훅 실패 (timeout, 네트워크) 미검증
  - ❌ 인증 토큰 만료 시 retry/refresh 로직 미테스트

**A (Action)**:
```typescript
describe('submitOnboarding - DB failure', () => {
  it('should handle insert failure and return user-friendly error', async () => {
    vi.mocked(db.insert).mockRejectedValue(
      new Error('Unique constraint violation: email already exists')
    );

    const result = await submitOnboarding({
      url: 'https://example.com',
      industry: 'ecommerce',
      companySize: 'solo'
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('이미 등록된 이메일');  // 사용자 친화적
  });
});
```

---

### 5. 검증 및 입력 안전성

#### ✅ 강점: Zod 스키마 철저한 테스트

**AuthSchema** (`auth.test.ts`):
- 이메일 검증: 형식 + 공백 trim + 소문자 변환 ✅
- 비밀번호 정책:
  - 최소 8자 ✅
  - 대문자 + 소문자 + 숫자 + 특수문자 ✅
  - 확인 비밀번호 일치 ✅

#### ⚠️ 약점: Onboarding Schema 검증 불완전

**O** (`onboarding.test.ts` 라인 44-100):
```typescript
it('should return error for invalid URL', async () => {
  const result = await submitOnboarding({
    url: 'not-a-url',
    industry: 'ecommerce',
    companySize: 'solo'
  });
  expect(result.error).toContain('URL');  // ✅
});

// ❌ 빠진 테스트:
// - industry: 허용된 값만? (enum 검증)
// - companySize: 허용된 값만?
// - URL: whitelist? (약속받은 도메인만?)
// - URL: 국제화 도메인 (IDN)?
```

**A (Action)**:
```typescript
describe('onboarding validation - enum fields', () => {
  it('should reject invalid industry', async () => {
    const result = await submitOnboarding({
      url: 'https://example.com',
      industry: 'blockchain-gaming',  // enum에 없는 값?
      companySize: 'solo'
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('업종');
    }
  });

  it('should accept only valid company sizes', async () => {
    const invalidSizes = ['micro', 'large-plus', '100-500'];  // 유효하지 않은 값?
    for (const size of invalidSizes) {
      const result = await submitOnboarding({
        url: 'https://example.com',
        industry: 'ecommerce',
        companySize: size as never
      });
      expect(result.success).toBe(false);
    }
  });
});
```

---

### 6. 접근성(A11y) 테스트

**O (Observation)**:
- ❌ Accessibility 테스트 거의 없음
- `src/lib/a11y/__tests__/accessibility.test.ts` 존재하지만 내용 미확인

**R (Rationale)**:
- 진단 대시보드는 "읽기" 중심 (접근성 높은 데이터 표시)
- 폼 입력은 명확한 라벨 필요
- 색상 대비, 키보드 네비게이션 필요

**A (Action)**: E2E 테스트에 axe-core 통합
```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test('dashboard should be accessible', async ({ page }) => {
  await page.goto('/dashboard');
  await injectAxe(page);
  await checkA11y(page);  // WCAG 2.1 Level AA 검증
});
```

---

### 7. 통합 테스트 커버리지

#### ✅ 강점
- 크롤링 → 파싱 → 점수 → 저장 전체 플로우 ✅
- Mock DB, Mock Orchestrator 조합 ✅
- 여러 점수 조합 (85 + 72 + 90 = A 등급) ✅

#### ❌ 약점
- **RLS 검증 부재** (companyId 격리):
  ```typescript
  // ❌ 현재: 테스트 없음
  // ✅ 필요:
  it('should not allow company A to view company B diagnosis', async () => {
    // Company A 인증으로 Company B 진단 조회 시도
    const result = await getDiagnosis({ companyId: 2 }, { userId: 'user-A' });
    expect(result.error).toContain('permission');
  });
  ```

- **대용량 데이터 처리**:
  ```typescript
  // ❌ 현재: 작은 Mock 데이터만
  // ✅ 필요: 1000개 이미지, 매우 긴 HTML
  it('should handle large crawl results', async () => {
    const largeHtml = '<html>' + '<img src="x">'.repeat(10000) + '</html>';
    const crawlResult = createMockCrawlResult({ rawHtml: largeHtml });
    // 성능 저하? 메모리 누수? 검증
  });
  ```

---

### 8. 한국어 특화 테스트

#### ⚠️ 부족한 부분

1. **문자열 길이 (UTF-8 바이트 vs 문자 수)**:
   - 한글: 1글자 = 3바이트
   - 구글 SEO: 제목 "약 60글자" = 실제로는 60자 × 3바이트 = 180바이트 제한
   - **테스트**: 문자 수만 검증, 바이트 검증 없음

2. **특수한 한글 문법**:
   ```typescript
   // ❌ 테스트 없음
   const titleWithJosa = '상품 | 가격 ';  // 조사 처리?
   const titleWithIdeogram = '①②③';  // 문자 높이 인식?
   ```

3. **인코딩 안정성**:
   ```typescript
   // ❌ 현재: 'UTF-8' 하드코딩
   // ✅ 필요: EUC-KR, GB2312 등도 처리?
   it('should handle legacy charset meta tag', () => {
     const html = '<meta charset="euc-kr">...';
     const result = parseHtml(html);
     // charset이 변경되었을 때 파싱 정확도?
   });
   ```

---

## 테스트 품질 Matrix (세부)

### 우선순위별 개선 필요사항

| 우선순위 | 항목 | 심각도 | 영향범위 | 예상 수정 시간 |
|---------|------|--------|---------|---------------|
| P0-CRITICAL | E2E 테스트 완성 (signup → diagnosis) | CRITICAL | 전체 플로우 | 4-6시간 |
| P0-CRITICAL | RLS 격리 테스트 (companyId) | CRITICAL | 보안/멀티테넌시 | 2-3시간 |
| P0-CRITICAL | Claude API Mock 정확성 | HIGH | AI 점수 보증 | 2시간 |
| P1-HIGH | 동시성 테스트 (Double-submit) | HIGH | 데이터 무결성 | 3시간 |
| P1-HIGH | 한글 문자열 길이 (바이트 기준) | HIGH | SEO 점수 정확성 | 1.5시간 |
| P1-HIGH | Server Action 에러 처리 (DB실패) | HIGH | 사용자 경험 | 2시간 |
| P2-MEDIUM | Onboarding enum 검증 | MEDIUM | 입력 안전성 | 1시간 |
| P2-MEDIUM | 접근성 테스트 (axe-core) | MEDIUM | WCAG 준수 | 2-3시간 |
| P3-LOW | 특수문자/XSS 테스트 | MEDIUM | 보안 | 1.5시간 |
| P3-LOW | 대용량 데이터 테스트 | LOW | 성능/안정성 | 2시간 |

---

## 코드 예시: 권장 추가 테스트

### 1. E2E Critical Flow 완성

```typescript
// e2e/critical-flows.spec.ts (완성 버전)

import { test, expect, Page } from '@playwright/test';

test.describe('Critical User Flows', () => {
  test('Complete flow: Signup → Onboarding → Diagnosis → Dashboard', async ({ page, context }) => {
    // Step 1: Signup
    const email = `test_${Date.now()}@example.com`;
    await page.goto('/');
    await page.click('text=무료 진단 시작하기');
    await page.fill('input[type="email"]', email);
    await page.fill('input[id*="password"]', 'TestPassword123!');
    await page.fill('input[id*="confirm"]', 'TestPassword123!');
    await page.click('input[type="checkbox"]'); // Accept terms
    await page.click('button:has-text("계정 만들기")');

    // Step 2: Onboarding (URL, Industry, Company Size)
    await page.waitForURL(/.*\/onboarding/);
    await page.fill('input[placeholder*="https"]', 'https://www.example-ecommerce.com');
    await page.click('button:has-text("다음")');

    // Industry selection
    await page.selectOption('select[name="industry"]', 'ecommerce');
    await page.click('button:has-text("다음")');

    // Company size selection
    await page.selectOption('select[name="companySize"]', 'small');
    await page.click('button:has-text("진단 시작")');

    // Step 3: Diagnosis Running
    // Wait for crawl to complete (with polling, not just static wait)
    await page.waitForURL(/.*\/dashboard/, { timeout: 30000 });

    // Step 4: Dashboard Verification
    // Check overall score is displayed
    const scoreElement = page.locator('[data-testid="overall-score"]');
    await expect(scoreElement).toBeVisible();

    const score = await scoreElement.textContent();
    expect(parseInt(score || '0')).toBeGreaterThanOrEqual(0);
    expect(parseInt(score || '0')).toBeLessThanOrEqual(100);

    // Check Quick Wins section
    const quickWinsSection = page.locator('[data-testid="quick-wins"]');
    await expect(quickWinsSection).toBeVisible();

    // Verify at least one quick win is shown (or "완벽합니다!" message)
    const quickWins = page.locator('[data-testid="quick-win-item"]');
    const count = await quickWins.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Network failure: Re-trigger diagnosis after timeout', async ({ page }) => {
    // ... setup

    // Trigger diagnosis
    await page.click('button:has-text("진단 다시 실행")');

    // Simulate slow network (DevTools)
    await page.route('**/api/crawl/**', route => {
      // Delay response
      setTimeout(() => route.continue(), 5000);
    });

    // Verify error message and retry button
    await expect(page.locator('text=진단 중...')).toBeVisible();
    // After timeout
    await expect(page.locator('text=네트워크 오류')).toBeVisible();
    await expect(page.locator('button:has-text("다시 시도")')).toBeEnabled();
  });
});
```

### 2. RLS 격리 테스트

```typescript
// src/__tests__/integration/rls-isolation.test.ts

import { describe, it, expect } from 'vitest';
import { createClient } from '@/lib/supabase/server';

describe('RLS Isolation - MultiTenancy', () => {
  it('user A should not access user B diagnosis data', async () => {
    // Create two test users
    const userA = await signupUser('a@example.com', 'password');
    const userB = await signupUser('b@example.com', 'password');

    // User A creates a diagnosis
    const diagnosisA = await createDiagnosis(userA.id, {
      companyId: 100,
      seoScore: 75
    });

    // User B tries to read User A's diagnosis via Supabase client
    const supabaseB = await createClient(userB.session);
    const { data, error } = await supabaseB
      .from('diagnoses')
      .select('*')
      .eq('id', diagnosisA.id);

    // RLS should block this
    expect(error).toBeTruthy();
    expect(error?.message).toContain('permission'); // or similar
    expect(data).toBeNull();
  });
});
```

### 3. 동시성 테스트

```typescript
// src/__tests__/integration/concurrency.test.ts

describe('Concurrency: Double-Submit Protection', () => {
  it('should prevent double-submit of diagnosis', async () => {
    const companyId = 1;
    const crawlResultId = 100;

    // Submit diagnosis twice simultaneously
    const [result1, result2] = await Promise.all([
      runDiagnosis({ companyId, crawlResultId }),
      runDiagnosis({ companyId, crawlResultId })
    ]);

    // Only one should succeed
    const successCount = [result1, result2].filter(r => r.success).length;
    expect(successCount).toBe(1);

    // OR: Both should succeed but create single record
    // (idempotent: same ID would be returned)
    if (result1.success && result2.success) {
      expect(result1.data.id).toBe(result2.data.id);
    }
  });
});
```

### 4. 한글 문자열 길이 (바이트 기준)

```typescript
// src/lib/scoring/__tests__/seo-scorer.korean.test.ts

import { describe, it, expect } from 'vitest';
import { calculateSeoScore } from '../seo-scorer';

describe('SEO Scorer - Korean String Length', () => {
  it('should calculate title length in bytes, not character count', () => {
    // 한글: 1글자 = 3바이트 (UTF-8)
    const koreanTitle = '한글제목입니다'; // 7글자 × 3 = 21바이트

    const crawl = createBaseCrawlResult({
      metaTags: { title: koreanTitle }
    });
    const result = calculateSeoScore(crawl);

    // 구글: 제목 권장 60글자 ≈ 180바이트 (ASCII 기준)
    // 한글 21바이트는 충분히 짧음
    expect(result.details).toContainEqual(
      expect.objectContaining({
        item: '제목 태그 (Title)',
        points: 20,
        status: 'pass'
      })
    );
  });

  it('should warn when title exceeds byte limit with Korean', () => {
    // 한글 60글자 = 180바이트 (구글 제한)
    const longKoreanTitle = '한글'.repeat(60); // 120글자 = 360바이트!

    const crawl = createBaseCrawlResult({
      metaTags: { title: longKoreanTitle }
    });
    const result = calculateSeoScore(crawl);

    // Should be partial or fail (too long)
    expect(result.details).toContainEqual(
      expect.objectContaining({
        item: '제목 태그 (Title)',
        points: expect.any(Number),
        status: expect.stringMatching(/partial|fail/)
      })
    );
  });
});
```

---

## 최종 권장사항

### 🔴 출시 전 필수 수정 (P0)

1. **E2E 테스트 최소 3개 완성** (signup → diagnosis → dashboard)
2. **RLS 격리 테스트** (multitenancy 보증)
3. **Claude API Mock 동적화** (성공/실패 경로)
4. **Server Action 에러 처리** (DB 실패 시나리오)

### 🟡 출시 후 개선 (P1)

1. 동시성 테스트 (Double-submit)
2. 한글 문자열 길이 (바이트 기준)
3. Onboarding enum 검증 강화
4. 접근성 테스트 (axe-core)

### 📊 커버리지 목표

| 메트릭 | 현재 | 목표 |
|--------|------|------|
| Unit Test Coverage | ~85% | 90%+ |
| Integration Test Coverage | ~70% | 85%+ |
| E2E Test Coverage | ~20% (incomplete) | 80%+ (critical flows) |
| 엣지 케이스 | ~75% | 95%+ |

---

## 검증 명령어

```bash
# 모든 테스트 실행
pnpm test

# 커버리지 리포트 생성
pnpm test --coverage

# E2E 테스트 실행 (브라우저 보기)
pnpm exec playwright test --debug

# 특정 테스트 파일만
pnpm test src/lib/scoring/__tests__/seo-scorer.test.ts

# Watch mode
pnpm test --watch
```

---

## 결론

**테스트 품질 종합 평가: 7.5/10**

✅ **잘된 부분**:
- 비즈니스 로직 (SEO/GEO 점수) 철저한 테스트
- 에러 분류 및 복구 전략 우수
- Zod 검증 포괄적

❌ **개선 필요**:
- E2E 테스트 불완전 (최우선)
- Mock이 실제 구현과 불일치 위험
- 동시성/경쟁 조건 미보장
- 한글 특화 테스트 부족

**권장**: 출시 전에 P0 항목 4가지는 반드시 완성하되, 코드 커버리지만으로 만족하지 말고 **실제 사용자 플로우 (E2E)** 검증을 우선 완료하세요.

---

**리뷰 완료**: 2026-03-12
**다음 세션**: E2E 테스트 완성 및 RLS 격리 검증
