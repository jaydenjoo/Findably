import { test, expect } from '@playwright/test'

/**
 * E2E: Task 1.5 — GNB + 라우팅 + 레이아웃 검증
 *
 * 테스트 범위:
 * - Public 레이아웃 (GNB 렌더링, 네비게이션)
 * - Dashboard 레이아웃 (비로그인 → 로그인 리다이렉트)
 * - 홈페이지 CTA 링크
 * - 반응형 (모바일 햄버거 메뉴)
 */

test.describe('Public 레이아웃 — GNB', () => {
  test('홈페이지에 GNB가 렌더링됨', async ({ page }) => {
    await page.goto('/')

    // GNB 존재
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()

    // 로고 (Findably 텍스트)
    await expect(nav.getByText('Findably').first()).toBeVisible()
  })

  test('GNB 데스크톱 메뉴 링크 표시', async ({ page }) => {
    // 데스크톱 뷰포트
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')

    const nav = page.locator('nav')

    // 메뉴 항목
    await expect(nav.getByRole('link', { name: '기능' })).toBeVisible()
    await expect(nav.getByRole('link', { name: '가격' })).toBeVisible()
    await expect(nav.getByRole('link', { name: '비교' })).toBeVisible()

    // CTA 버튼
    await expect(nav.getByRole('link', { name: '로그인' })).toBeVisible()
    await expect(
      nav.getByRole('link', { name: /무료 진단 시작/ })
    ).toBeVisible()
  })

  test('GNB 모바일: 햄버거 메뉴 동작', async ({ page }) => {
    // 모바일 뷰포트
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // 데스크톱 메뉴 숨겨짐
    const nav = page.locator('nav')
    await expect(nav.getByRole('link', { name: '기능' })).not.toBeVisible()

    // 햄버거 버튼 클릭
    const hamburger = page.getByRole('button', { name: '메뉴 열기/닫기' })
    await expect(hamburger).toBeVisible()
    await hamburger.click()

    // Sheet에서 메뉴 항목 표시 (footer에도 동일 링크 존재 → nav 스코프)
    await expect(nav.getByRole('link', { name: '기능' })).toBeVisible()
    await expect(nav.getByRole('link', { name: '가격' })).toBeVisible()
    await expect(nav.getByRole('link', { name: '비교' })).toBeVisible()
  })
})

test.describe('홈페이지 CTA', () => {
  test('메인 CTA 버튼 존재 확인', async ({ page }) => {
    await page.goto('/')

    // 히어로 CTA는 <button> (URL 입력 후 handleSubmit으로 /signup 이동)
    const mainCta = page
      .locator('section')
      .getByRole('button', { name: /무료 진단 시작/ })
      .first()
    await expect(mainCta).toBeVisible()
  })

  test('샘플 CTA → /reports/sample 링크', async ({ page }) => {
    await page.goto('/')

    const sampleLink = page
      .locator('footer')
      .getByRole('link', { name: /샘플 리포트/ })
    await expect(sampleLink).toHaveAttribute('href', '/reports/sample')
  })
})

test.describe('Dashboard 레이아웃 — 접근 제어', () => {
  test('비로그인 시 /dashboard → /login 리다이렉트', async ({ page }) => {
    await page.goto('/dashboard')

    // middleware가 /login으로 리다이렉트
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('Auth 레이아웃 — GNB 미표시', () => {
  test('/login에 GNB가 없음 (auth 레이아웃)', async ({ page }) => {
    await page.goto('/login')

    // auth 페이지에는 메인 내비게이션이 없어야 함
    // 로그인 페이지에 nav가 있으면 public GNB 메뉴 항목은 없어야 함
    const navLinks = page.locator('nav').getByRole('link', { name: '기능' })
    await expect(navLinks).not.toBeVisible()
  })
})
