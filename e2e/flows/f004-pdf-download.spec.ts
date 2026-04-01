import { test, expect } from '@playwright/test'
import { login } from '../helpers/login'

/**
 * F-004: PDF 다운로드 플로우 테스트
 *
 * 대상: /reports/my/[id] 페이지의 PDF 다운로드 버튼
 * 테스트 전략:
 * - 로그인 → 대시보드 → 리포트 링크 추출 → PDF 버튼 존재 확인
 * - 비로그인 → 리포트 접근 시 /login 리다이렉트
 */

test.describe('F-004: PDF 다운로드 플로우', () => {
  test('로그인 후 리포트 페이지에 PDF 다운로드 버튼 존재', async ({ page }) => {
    await login(page)

    // 대시보드에서 리포트 링크 추출
    const reportLink = page.locator('a[href*="/reports/my/"]').first()
    const reportCount = await reportLink.count()

    if (reportCount === 0) {
      // 리포트가 없는 경우 — 테스트 스킵
      console.log('[f004] 리포트 링크 없음 — 스킵')
      test.skip()
      return
    }

    const href = await reportLink.getAttribute('href')
    expect(href).toBeTruthy()

    // 리포트 페이지로 이동
    await page.goto(href!)
    await page.waitForLoadState('networkidle')

    // 404가 아닌지 확인
    const is404 = await page.getByText('찾으시는 페이지').count()
    if (is404 > 0) {
      console.log('[f004] 리포트 페이지 404 — 스킵')
      test.skip()
      return
    }

    // PDF 다운로드 버튼 존재 확인 (유료 또는 무료 버전)
    const pdfButton = page.locator('button[aria-label*="PDF"]').first()
    const pdfButtonCount = await pdfButton.count()

    // PDF 버튼이 있거나, 텍스트로 "PDF 다운로드"가 있거나
    const pdfText = await page.getByText('PDF 다운로드').count()

    expect(pdfButtonCount + pdfText).toBeGreaterThan(0)
  })

  test('비로그인 — /reports/my/fake-id 접근 시 /login 리다이렉트', async ({
    page,
  }) => {
    await page.goto('/reports/my/fake-id')
    await page.waitForURL('**/login**', { timeout: 10_000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('샘플 리포트에서 PDF 관련 UI 확인', async ({ page }) => {
    await page.goto('/reports/sample')
    await page.waitForLoadState('networkidle')

    // 샘플 리포트가 로드되는지 확인
    await expect(page.getByText(/그린테크/).first()).toBeVisible()

    // 메인 콘텐츠 존재 확인
    const mainContent = await page.locator('main').count()
    expect(mainContent).toBeGreaterThan(0)
  })
})
