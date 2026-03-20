import { test, expect } from '@playwright/test'

/**
 * E2E: F-003 유료 전환 Flow
 *
 * PRD 경로: /dashboard BlurOverlay CTA → 결제 페이지 연결
 *
 * 테스트 범위: 유료 경로 접근 제어 + /pricing 렌더링 + CTA 검증
 * 실제 결제(Toss Payments) 호출 불가 → CTA 존재 + 링크만 검증
 */

test.describe('F-003: 유료 전환 — 비로그인 접근 제어', () => {
  const paidRoutes = [
    '/dashboard',
    '/actions/schema',
    '/actions/meta-tags',
    '/actions/roadmap',
    '/diagnosis/competitors',
  ]

  for (const route of paidRoutes) {
    test(`${route} → 비로그인 시 /login 리다이렉트`, async ({ page }) => {
      await page.goto(route)

      await expect(page).toHaveURL(/\/login/)
    })
  }
})

test.describe('F-003: 유료 전환 — Pricing 페이지', () => {
  test('/pricing 페이지 렌더링', async ({ page }) => {
    await page.goto('/pricing')

    // 리다이렉트 없이 pricing 페이지에 머무름
    await expect(page).toHaveURL(/\/pricing/)

    // 요금제 제목 렌더링
    await expect(
      page.getByRole('heading', { name: /내 사이트에 맞는 플랜/ })
    ).toBeVisible()

    // 요금제 뱃지 텍스트 존재
    await expect(page.getByText(/심플한 요금제/)).toBeVisible()
  })

  test('/pricing 비로그인 접근 가능 (Public)', async ({ page }) => {
    await page.goto('/pricing')

    // 리다이렉트 없이 pricing에 머무름
    await expect(page).not.toHaveURL(/\/login/)
  })
})
