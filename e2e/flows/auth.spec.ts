import { test, expect } from '@playwright/test'

/**
 * E2E: Auth Flow 테스트
 *
 * 테스트 범위: 페이지 렌더링 + 폼 검증 + 네비게이션
 *
 * 참고: 실제 Supabase 인증 (이메일 전송, OAuth)은
 *       로컬 Supabase가 실행 중이어야 하므로 CI 환경에서 별도 구성 필요.
 *       여기서는 UI 수준 검증에 집중합니다.
 */

test.describe('Auth Pages — 렌더링 + 네비게이션', () => {
  test('로그인 페이지 렌더링', async ({ page }) => {
    await page.goto('/login')

    // 제목 확인
    await expect(page.getByText('로그인').first()).toBeVisible()

    // 이메일/비밀번호 입력 필드 존재
    await expect(page.getByLabel(/이메일/)).toBeVisible()
    await expect(page.getByLabel(/비밀번호/)).toBeVisible()

    // Google 로그인 버튼 존재
    await expect(page.getByText(/Google/)).toBeVisible()

    // 가입 링크 존재
    await expect(page.getByRole('link', { name: '가입하기' })).toBeVisible()
  })

  test('회원가입 페이지 렌더링', async ({ page }) => {
    await page.goto('/signup')

    await expect(page.getByText('회원가입').first()).toBeVisible()

    await expect(page.getByLabel(/이메일/)).toBeVisible()
    await expect(page.getByLabel(/비밀번호/)).toBeVisible()
    await expect(page.getByText(/Google/)).toBeVisible()

    // 로그인 링크 존재
    await expect(page.getByRole('link', { name: '로그인' })).toBeVisible()
  })

  test('비밀번호 재설정 페이지 렌더링', async ({ page }) => {
    await page.goto('/reset-password')

    await expect(page.getByText('비밀번호 재설정').first()).toBeVisible()

    await expect(page.getByLabel(/이메일/)).toBeVisible()
    await expect(
      page.getByRole('link', { name: '로그인으로 돌아가기' })
    ).toBeVisible()
  })

  test('이메일 확인 페이지 렌더링', async ({ page }) => {
    await page.goto('/signup/confirm')

    await expect(page.getByText('이메일을 확인해주세요').first()).toBeVisible()

    await expect(page.getByText(/인증 링크/).first()).toBeVisible()
  })

  test('로그인 → 가입 → 로그인 네비게이션', async ({ page }) => {
    await page.goto('/login')

    // "가입하기" 클릭 → 회원가입 페이지
    await page.getByRole('link', { name: '가입하기' }).click()
    await expect(page).toHaveURL(/\/signup/)

    // "로그인" 클릭 → 로그인 페이지
    await page.getByRole('link', { name: '로그인' }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('로그인 → 비밀번호 재설정 네비게이션', async ({ page }) => {
    await page.goto('/login')

    await page.getByRole('link', { name: '비밀번호를 잊으셨나요?' }).click()
    await expect(page).toHaveURL(/\/reset-password/)

    // "로그인으로 돌아가기" 클릭
    await page.getByRole('link', { name: '로그인으로 돌아가기' }).click()
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('Auth Forms — 클라이언트 검증', () => {
  test('로그인: 빈 폼 제출 시 에러 표시', async ({ page }) => {
    await page.goto('/login')

    // 빈 상태에서 제출
    await page.getByRole('button', { name: '로그인 →' }).click()

    // Zod 클라이언트 검증 → role="alert" 에러 메시지 표시
    await expect(page.getByRole('alert').first()).toBeVisible()
  })

  test('회원가입: 빈 폼 제출 시 에러 표시', async ({ page }) => {
    await page.goto('/signup')

    await page.getByRole('button', { name: '가입하기 →' }).click()

    // Zod 클라이언트 검증 → role="alert" 에러 메시지 표시
    await expect(page.getByRole('alert').first()).toBeVisible()
  })
})
