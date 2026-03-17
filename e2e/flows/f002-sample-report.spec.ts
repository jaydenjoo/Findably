import { test, expect } from '@playwright/test'

/**
 * E2E: F-002 샘플 열람 Flow
 *
 * PRD 경로: 랜딩/대시보드 → /reports/sample → CTA
 *
 * 테스트 범위: 비로그인 접근 가능 + 콘텐츠 렌더링 + CTA 검증
 */

test.describe('F-002: 샘플 리포트 — 렌더링', () => {
  test('/reports/sample 비로그인 접근 가능', async ({ page }) => {
    await page.goto('/reports/sample')

    // 리다이렉트 없이 샘플 페이지에 머무름
    await expect(page).toHaveURL(/\/reports\/sample/)

    // 페이지 렌더링 확인
    await expect(page.getByText(/샘플 리포트/).first()).toBeVisible()
  })

  test('그린테크 브랜드명 표시', async ({ page }) => {
    await page.goto('/reports/sample')

    // "그린테크" 또는 "Green Tech" 텍스트 존재
    await expect(page.getByText(/그린테크|Green Tech/).first()).toBeVisible()
  })

  test('주요 섹션 렌더링: 점수, Quick Win, 개선 항목', async ({ page }) => {
    await page.goto('/reports/sample')

    // 종합 점수 섹션
    await expect(
      page.getByRole('heading', { name: /종합.*점수/ })
    ).toBeVisible()

    // Quick Win 섹션
    await expect(page.getByRole('heading', { name: /Quick Win/ })).toBeVisible()

    // 주요 개선 항목 섹션
    await expect(
      page.getByRole('heading', { name: /주요 개선 항목/ })
    ).toBeVisible()
  })

  test('CTA: "무료 진단 시작" 링크 존재', async ({ page }) => {
    await page.goto('/reports/sample')

    // CTA 버튼/링크가 /onboarding/url 또는 /signup으로 연결
    const cta = page.getByRole('link', { name: /무료 진단 시작/ }).first()
    await expect(cta).toBeVisible()
    await expect(cta).toHaveAttribute('href', /\/(onboarding\/url|signup)/)
  })
})

test.describe('F-002: 샘플 리포트 — 랜딩에서 진입', () => {
  test('랜딩 → 샘플 리포트 링크 → /reports/sample', async ({ page }) => {
    await page.goto('/')

    const sampleLink = page
      .locator('section')
      .getByRole('link', { name: /샘플 리포트/ })
    await expect(sampleLink).toHaveAttribute('href', '/reports/sample')
  })
})

test.describe('F-002: 샘플 리포트 — 모바일 반응형', () => {
  test('모바일 뷰포트(375px)에서 샘플 리포트 렌더링', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/reports/sample')

    // 핵심 콘텐츠가 모바일에서도 표시됨
    await expect(page.getByText(/그린테크|Green Tech/).first()).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /종합.*점수/ })
    ).toBeVisible()
  })
})
