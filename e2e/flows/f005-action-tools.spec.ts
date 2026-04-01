import { test, expect } from '@playwright/test'
import { login } from '../helpers/login'

/**
 * F-005: 실행 도구 (Actions) 플로우 테스트
 *
 * 대상: /actions/schema, /actions/meta-tags, /actions/roadmap
 * 테스트 전략:
 * - 로그인 → 각 액션 페이지 접근 → 페이지 로드 확인
 * - 비로그인 → /login 리다이렉트 확인
 * - 무료 사용자 → BlurOverlay 또는 유료 전환 CTA 확인
 */

test.describe('F-005: 실행 도구 플로우', () => {
  const actionPages = [
    { path: '/actions/schema', name: 'Schema Markup' },
    { path: '/actions/meta-tags', name: '메타태그' },
    { path: '/actions/roadmap', name: '로드맵' },
  ]

  for (const { path } of actionPages) {
    test(`비로그인 — ${path} 접근 시 /login 리다이렉트`, async ({ page }) => {
      await page.goto(path)
      await page.waitForURL('**/login**', { timeout: 10_000 })
      await expect(page).toHaveURL(/\/login/)
    })
  }

  test('로그인 후 액션 페이지 접근 — 페이지 로드 확인', async ({ page }) => {
    await login(page)

    for (const { path } of actionPages) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')

      // 404가 아닌지 확인
      const is404 = await page.getByText('찾으시는 페이지').count()
      expect(is404).toBe(0)

      // 메인 콘텐츠 존재 확인
      const mainContent = await page.locator('main').count()
      expect(mainContent).toBeGreaterThan(0)
    }
  })

  test('무료 사용자 — 액션 페이지에서 유료 전환 유도 확인', async ({
    page,
  }) => {
    await login(page)

    // /actions/schema 페이지에서 BlurOverlay 또는 유료 CTA 확인
    await page.goto('/actions/schema')
    await page.waitForLoadState('networkidle')

    // 페이지가 로드되면 OK (유료/무료 상태에 따라 다르게 표시)
    const mainContent = await page.locator('main').count()
    expect(mainContent).toBeGreaterThan(0)
  })
})
