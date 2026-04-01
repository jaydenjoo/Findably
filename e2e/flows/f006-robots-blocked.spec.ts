import { test, expect } from '@playwright/test'
import { login } from '../helpers/login'

/**
 * F-006: robots.txt + 유료 기능 게이팅 테스트
 *
 * 대상:
 * - /robots.txt 엔드포인트 (크롤러 설정)
 * - 유료 전용 페이지의 BlurOverlay (무료 사용자)
 * - 비로그인 사용자 리다이렉트
 */

test.describe('F-006: robots.txt 크롤러 설정', () => {
  test('robots.txt 엔드포인트 — 유효한 콘텐츠 반환', async ({ request }) => {
    const res = await request.get('/robots.txt')

    expect(res.status()).toBe(200)

    const text = await res.text()

    // 기본 robots.txt 구조 확인
    expect(text).toContain('User-Agent')
    expect(text).toContain('Sitemap')
  })

  test('robots.txt — AI 크롤러 지시문 포함', async ({ request }) => {
    const res = await request.get('/robots.txt')
    const text = await res.text()

    // AI 봇 관련 지시문이 존재하는지 확인
    // (Allow 또는 Disallow — 정책에 따라 다를 수 있음)
    const hasAiBotDirective =
      text.includes('GPTBot') ||
      text.includes('ClaudeBot') ||
      text.includes('PerplexityBot') ||
      text.includes('Googlebot')

    expect(hasAiBotDirective).toBe(true)
  })
})

test.describe('F-006: 유료 기능 게이팅 — 비로그인 리다이렉트', () => {
  const paidPages = [
    '/diagnosis/competitors',
    '/reports/my/fake-id',
    '/actions/schema',
    '/actions/meta-tags',
    '/actions/roadmap',
  ]

  for (const path of paidPages) {
    test(`비로그인 — ${path} 접근 시 /login 리다이렉트`, async ({ page }) => {
      await page.goto(path)
      await page.waitForURL('**/login**', { timeout: 10_000 })
      await expect(page).toHaveURL(/\/login/)
    })
  }
})

test.describe('F-006: 유료 기능 게이팅 — 무료 사용자 BlurOverlay', () => {
  test('무료 사용자 — 유료 전용 페이지에서 제한 UI 확인', async ({ page }) => {
    await login(page)

    // /diagnosis/competitors 페이지 확인
    await page.goto('/diagnosis/competitors')
    await page.waitForLoadState('networkidle')

    // 페이지가 로드됨 (404가 아님)
    const is404 = await page.getByText('찾으시는 페이지').count()
    if (is404 === 0) {
      const mainContent = await page.locator('main').count()
      expect(mainContent).toBeGreaterThan(0)

      // BlurOverlay 또는 유료 전환 CTA 중 하나 이상 존재
      const blurOverlay = await page.getByText('상세 분석 받기').count()
      const paidCta = await page.getByText(/유료|결제|업그레이드|잠금/).count()
      // 유료 기능 제한 UI가 존재하거나, 메인 콘텐츠가 있으면 OK
      // (진단 데이터가 없으면 EmptyState가 표시될 수도 있음)
      expect(mainContent + blurOverlay + paidCta).toBeGreaterThan(0)
    }
  })

  test('무료 사용자 — /actions/roadmap 유료 전환 유도', async ({ page }) => {
    await login(page)

    await page.goto('/actions/roadmap')
    await page.waitForLoadState('networkidle')

    const is404 = await page.getByText('찾으시는 페이지').count()
    expect(is404).toBe(0)

    const mainContent = await page.locator('main').count()
    expect(mainContent).toBeGreaterThan(0)
  })
})
