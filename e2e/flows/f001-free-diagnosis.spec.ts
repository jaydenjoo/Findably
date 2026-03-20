import { test, expect } from '@playwright/test'

/**
 * E2E: F-001 무료 진단 Flow
 *
 * PRD 경로: / → /signup → /onboarding/url → /onboarding/analyzing → /dashboard
 *
 * 테스트 범위: CTA 링크 검증 + 폼 렌더링 + 비로그인 접근 제어
 * 실제 Supabase 인증 없이 UI 수준 검증에 집중합니다.
 */

test.describe('F-001: 무료 진단 Flow — CTA + 네비게이션', () => {
  test('랜딩 → "무료 진단 시작" CTA 버튼 존재 확인', async ({ page }) => {
    await page.goto('/')

    // 히어로 CTA는 <button> (URL 입력 후 handleSubmit으로 /signup 이동)
    const mainCta = page
      .locator('section')
      .getByRole('button', { name: /무료 진단 시작/ })
      .first()
    await expect(mainCta).toBeVisible()
  })

  test('/signup 폼 렌더링 (이메일 + 비밀번호 + Google)', async ({ page }) => {
    await page.goto('/signup')

    await expect(page.getByText('회원가입')).toBeVisible()
    await expect(page.getByLabel(/이메일/)).toBeVisible()
    await expect(page.getByLabel(/비밀번호/)).toBeVisible()
    await expect(page.getByText(/Google/)).toBeVisible()
  })
})

test.describe('F-001: 무료 진단 Flow — 비로그인 접근 제어', () => {
  const protectedRoutes = [
    '/onboarding/url',
    '/onboarding/info',
    '/onboarding/analyzing',
    '/dashboard',
  ]

  for (const route of protectedRoutes) {
    test(`${route} → 비로그인 시 /login 리다이렉트`, async ({ page }) => {
      await page.goto(route)

      // middleware가 /login으로 리다이렉트
      await expect(page).toHaveURL(/\/login/)
    })
  }
})
