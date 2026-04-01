import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { login } from '../helpers/login'

/**
 * WCAG AA 접근성 자동 테스트 (axe-core)
 *
 * 주요 페이지별 WCAG 2.2 AA 위반 사항 검출
 * - Critical/Serious 위반만 실패 처리
 * - Minor/Moderate는 로그로 보고
 */

const AXE_OPTIONS = {
  runOnly: {
    type: 'tag' as const,
    values: ['wcag2a', 'wcag2aa', 'wcag22aa'],
  },
}

test.describe('접근성 (WCAG AA) — axe-core 자동 검사', () => {
  test('랜딩 페이지 — WCAG AA 위반 없음', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .options(AXE_OPTIONS)
      .analyze()

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )

    if (results.violations.length > 0) {
      console.log(
        `[a11y] 랜딩 — 전체 위반 ${results.violations.length}건:`,
        results.violations.map(
          (v) => `${v.impact}: ${v.id} (${v.nodes.length}개)`
        )
      )
    }

    expect(
      critical,
      `Critical/Serious 위반 ${critical.length}건: ${critical.map((v) => v.id).join(', ')}`
    ).toHaveLength(0)
  })

  test('로그인 페이지 — WCAG AA 위반 없음', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .options(AXE_OPTIONS)
      .analyze()

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )

    if (results.violations.length > 0) {
      console.log(
        `[a11y] 로그인 — 전체 위반 ${results.violations.length}건:`,
        results.violations.map(
          (v) => `${v.impact}: ${v.id} (${v.nodes.length}개)`
        )
      )
    }

    expect(
      critical,
      `Critical/Serious 위반 ${critical.length}건: ${critical.map((v) => v.id).join(', ')}`
    ).toHaveLength(0)
  })

  test('회원가입 페이지 — WCAG AA 위반 없음', async ({ page }) => {
    await page.goto('/signup')
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .options(AXE_OPTIONS)
      .analyze()

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )

    if (results.violations.length > 0) {
      console.log(
        `[a11y] 회원가입 — 전체 위반 ${results.violations.length}건:`,
        results.violations.map(
          (v) => `${v.impact}: ${v.id} (${v.nodes.length}개)`
        )
      )
    }

    expect(
      critical,
      `Critical/Serious 위반 ${critical.length}건: ${critical.map((v) => v.id).join(', ')}`
    ).toHaveLength(0)
  })

  test('샘플 리포트 — WCAG AA 위반 없음', async ({ page }) => {
    await page.goto('/reports/sample')
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .options(AXE_OPTIONS)
      .analyze()

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )

    if (results.violations.length > 0) {
      console.log(
        `[a11y] 샘플 리포트 — 전체 위반 ${results.violations.length}건:`,
        results.violations.map(
          (v) => `${v.impact}: ${v.id} (${v.nodes.length}개)`
        )
      )
    }

    expect(
      critical,
      `Critical/Serious 위반 ${critical.length}건: ${critical.map((v) => v.id).join(', ')}`
    ).toHaveLength(0)
  })

  test('대시보드 (로그인 후) — WCAG AA 위반 없음', async ({ page }) => {
    await login(page)

    const results = await new AxeBuilder({ page })
      .options(AXE_OPTIONS)
      .analyze()

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )

    if (results.violations.length > 0) {
      console.log(
        `[a11y] 대시보드 — 전체 위반 ${results.violations.length}건:`,
        results.violations.map(
          (v) => `${v.impact}: ${v.id} (${v.nodes.length}개)`
        )
      )
    }

    expect(
      critical,
      `Critical/Serious 위반 ${critical.length}건: ${critical.map((v) => v.id).join(', ')}`
    ).toHaveLength(0)
  })

  test('진단 개요 (로그인 후) — WCAG AA 위반 없음', async ({ page }) => {
    await login(page)

    await page.goto('/diagnosis/overview')
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .options(AXE_OPTIONS)
      .analyze()

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )

    if (results.violations.length > 0) {
      console.log(
        `[a11y] 진단 개요 — 전체 위반 ${results.violations.length}건:`,
        results.violations.map(
          (v) => `${v.impact}: ${v.id} (${v.nodes.length}개)`
        )
      )
    }

    expect(
      critical,
      `Critical/Serious 위반 ${critical.length}건: ${critical.map((v) => v.id).join(', ')}`
    ).toHaveLength(0)
  })
})
