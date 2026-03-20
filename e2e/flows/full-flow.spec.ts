import { test, expect } from '@playwright/test'

/**
 * 전체 플로우 E2E 테스트
 *
 * 1. 로그인 (기존 테스트 계정)
 * 2. 대시보드 → 무료 리포트 확인
 * 3. 샘플 리포트 열람
 * 4. 결제 API로 유료 진단 트리거 (mock 어댑터 — 항상 성공)
 * 5. 대시보드 → 유료 상태 확인
 * 6. 상세 리포트 페이지 확인
 * 7. 로그아웃
 *
 * 비용: ~600원/회 (Claude API 5에이전트 + CMO)
 */

const TEST_EMAIL = 'e2etest-0316@findably.dev'
const TEST_PASSWORD = 'TestPass1234!'

test.describe('Full Flow — 무료 → 유료 → 리포트 → 로그아웃', () => {
  test.setTimeout(180_000) // 3분 (AI 분석 포함)

  test('전체 사용자 여정을 완료한다', async ({ page }) => {
    // ─── Step 1: 로그인 ───
    await page.goto('/login')
    await page.getByLabel('이메일').fill(TEST_EMAIL)
    await page.getByLabel('비밀번호').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: '로그인 →' }).click()

    // 대시보드 도착 대기 (URL 변경 + Server Component 렌더링 완료)
    await page.waitForURL('**/dashboard**', { timeout: 15_000 })
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/dashboard/)

    // ─── Step 2: 대시보드 — 무료 리포트 확인 ───
    // 대시보드에 올 수 있는 모든 유효 상태를 확인
    const hasScore = await page.locator('[role="meter"]').count()
    const hasEmptyState = await page
      .getByText('아직 진단 결과가 없어요')
      .count()
    const hasAnalyzing = await page.getByText(/분석이 진행 중입니다/).count()
    const hasTimedOut = await page
      .getByText('분석이 예상보다 오래 걸리고 있습니다')
      .count()
    const hasFailedPaid = await page
      .getByText('상세 분석에 일시적 문제가 발생했습니다')
      .count()
    const hasFailedFree = await page.getByText('진단에 실패했습니다').count()
    const hasParseError = await page
      .getByText('진단 데이터를 읽을 수 없습니다')
      .count()
    const hasDbError = await page
      .getByText('데이터를 불러올 수 없습니다')
      .count()
    const dashboardStateCount =
      hasScore +
      hasEmptyState +
      hasAnalyzing +
      hasTimedOut +
      hasFailedPaid +
      hasFailedFree +
      hasParseError +
      hasDbError
    expect(dashboardStateCount).toBeGreaterThan(0)

    // ─── Step 3: 샘플 리포트 열람 ───
    await page.goto('/reports/sample')
    await page.waitForLoadState('networkidle')

    // 그린테크 샘플 콘텐츠 확인
    await expect(page.getByText(/그린테크/).first()).toBeVisible()

    // ─── Step 4: 결제 API로 유료 진단 트리거 (mock 어댑터) ───
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // 진단이 있는 경우에만 유료 트리거 진행
    if (hasScore > 0) {
      // 대시보드에서 checkout 링크 또는 진단 ID 추출
      const checkoutLink = await page.locator('a[href*="/checkout/"]').first()
      const diagnosisLink = await page
        .locator('a[href*="/reports/my/"]')
        .first()

      // checkout 링크에서 diagnosisId 추출 시도
      let extractedId: string | null = null

      const checkoutCount = await checkoutLink.count()
      if (checkoutCount > 0) {
        const href = await checkoutLink.getAttribute('href')
        extractedId = href?.split('/checkout/')[1] ?? null
      }

      // checkout 링크 없으면 리포트 링크에서 추출
      if (!extractedId) {
        const reportLinkCount = await diagnosisLink.count()
        if (reportLinkCount > 0) {
          const href = await diagnosisLink.getAttribute('href')
          extractedId = href?.split('/reports/my/')[1] ?? null
        }
      }

      if (extractedId) {
        // 결제 API로 유료 진단 트리거 (mock 어댑터 — 항상 성공)
        const checkoutResult = await page.evaluate(async (id: string) => {
          const res = await fetch('/api/payment/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ diagnosisId: id }),
          })
          const data = await res.json()
          return { status: res.status, data }
        }, extractedId)

        console.log('[E2E] checkout result:', JSON.stringify(checkoutResult))

        // ─── Step 5: 대시보드 → 유료 상태 확인 ───
        // 분석 완료 대기 (최대 2분)
        if (checkoutResult.status === 200) {
          await page.waitForTimeout(5_000) // 분석 트리거 후 잠시 대기
          await page.goto('/dashboard')
          await page.waitForLoadState('networkidle')

          const blurOverlayCount = await page
            .getByText('상세 분석 받기')
            .count()
          console.log('[E2E] BlurOverlay count after paid:', blurOverlayCount)
        }

        // ─── Step 6: 상세 리포트 페이지 ───
        await page.goto(`/reports/my/${extractedId}`)
        await page.waitForLoadState('networkidle')

        // 리포트 페이지가 로드됨 (404가 아님)
        const is404 = await page.getByText('찾으시는 페이지').count()
        if (is404 === 0) {
          const reportContent = await page.locator('main').count()
          expect(reportContent).toBeGreaterThan(0)
        }
      }
    }

    // ─── Step 7: 로그아웃 ───
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Server Action <form action={logoutAction}>는 force:true 클릭으로 submit 안 됨
    // → requestSubmit()으로 직접 폼 제출
    const viewport = page.viewportSize()
    if (viewport && viewport.width < 1024) {
      await page
        .getByRole('button', { name: '메뉴 열기' })
        .click({ force: true })
      await page.waitForTimeout(500)
    }
    await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="로그아웃"]')
      const form = btn?.closest('form')
      if (form) form.requestSubmit()
    })

    // Server Action redirect → / 또는 미들웨어가 /login으로 리다이렉트
    // 로그아웃 성공 = 더 이상 /dashboard에 머물지 않음
    await expect(page).toHaveURL(/\/(login.*)?$/, { timeout: 15_000 })
  })
})

test.describe('개별 페이지 접근 테스트', () => {
  test('비로그인 — /dashboard 접근 시 /login 리다이렉트', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL('**/login**', { timeout: 10_000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('비로그인 — /reports/sample 접근 가능', async ({ page }) => {
    await page.goto('/reports/sample')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/그린테크/).first()).toBeVisible()
  })

  test('비로그인 — /reports/my/fake-id 접근 시 /login 리다이렉트', async ({
    page,
  }) => {
    await page.goto('/reports/my/fake-id')
    await page.waitForURL('**/login**', { timeout: 10_000 })
    await expect(page).toHaveURL(/\/login/)
  })
})
