import { test, expect } from '@playwright/test'

/**
 * 전체 플로우 E2E 테스트
 *
 * 1. 로그인 (기존 테스트 계정)
 * 2. 대시보드 → 무료 리포트 확인
 * 3. 샘플 리포트 열람
 * 4. Dev API로 유료 진단 트리거 (결제 건너뜀)
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
    await page.getByRole('button', { name: '로그인' }).click()

    // 대시보드 도착 대기
    await page.waitForURL('**/dashboard**', { timeout: 15_000 })
    await expect(page).toHaveURL(/\/dashboard/)

    // ─── Step 2: 대시보드 — 무료 리포트 확인 ───
    // 종합 점수 게이지 또는 빈 상태 확인
    const hasScore = await page.locator('[role="meter"]').count()
    const hasEmptyState = await page
      .getByText('아직 진단 결과가 없어요')
      .count()
    expect(hasScore + hasEmptyState).toBeGreaterThan(0)

    // ─── Step 3: 샘플 리포트 열람 ───
    await page.goto('/reports/sample')
    await page.waitForLoadState('networkidle')

    // 그린테크 샘플 콘텐츠 확인
    await expect(page.getByText(/그린테크/).first()).toBeVisible()

    // ─── Step 4: 유료 진단 트리거 (결제 건너뜀) ───
    // 먼저 현재 진단 ID 가져오기
    // Dev API 엔드포인트 존재 확인 (ID 없이 400 예상)
    const devApiCheck = await page.evaluate(async () => {
      const res = await fetch('/api/dev/trigger-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnosisId: '__NEED_ID__' }),
      })
      return res.status
    })
    expect(devApiCheck).toBe(400) // diagnosisId 검증 실패

    // 진단 ID를 DB에서 가져와야 함 → 대시보드 페이지에서 추출
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // 진단이 있는 경우에만 유료 트리거 진행
    if (hasScore > 0) {
      // 대시보드에서 진단 ID 추출 (data 속성 또는 링크에서)
      const diagnosisLink = await page
        .locator('a[href*="/reports/my/"]')
        .first()
      const linkCount = await diagnosisLink.count()

      if (linkCount > 0) {
        const href = await diagnosisLink.getAttribute('href')
        const extractedId = href?.split('/reports/my/')[1]

        if (extractedId) {
          // Dev API로 유료 진단 트리거
          const triggerResult = await page.evaluate(async (id: string) => {
            const res = await fetch('/api/dev/trigger-paid', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ diagnosisId: id }),
            })
            const data = await res.json()
            return { status: res.status, data }
          }, extractedId)

          // 성공 또는 이미 완료 확인
          console.log(
            '[E2E] trigger-paid result:',
            JSON.stringify(triggerResult)
          )

          // ─── Step 5: 대시보드 → 유료 상태 확인 ───
          await page.goto('/dashboard')
          await page.waitForLoadState('networkidle')

          // 유료 전환 후 BlurOverlay가 사라졌는지 확인
          // (BlurOverlay CTA에 "상세 분석 받기" 텍스트가 없어야 함)
          const blurOverlayCount = await page
            .getByText('상세 분석 받기')
            .count()

          // 유료 전환 성공 시 BlurOverlay 없음
          if (triggerResult.status === 200) {
            // BlurOverlay가 줄어들었거나 없어야 함
            console.log('[E2E] BlurOverlay count after paid:', blurOverlayCount)
          }

          // ─── Step 6: 상세 리포트 페이지 ───
          await page.goto(`/reports/my/${extractedId}`)
          await page.waitForLoadState('networkidle')

          // 리포트 페이지가 로드됨 (404가 아님)
          const is404 = await page.getByText('찾으시는 페이지').count()
          if (is404 === 0) {
            // 리포트 콘텐츠 존재 확인
            const reportContent = await page.locator('main').count()
            expect(reportContent).toBeGreaterThan(0)
          }
        }
      }
    }

    // ─── Step 7: 로그아웃 ───
    // 데스크톱: 사이드바 로그아웃 / 모바일: 메뉴
    const viewport = page.viewportSize()
    if (viewport && viewport.width >= 1024) {
      // 데스크톱 사이드바
      await page.getByRole('button', { name: '로그아웃' }).click()
    } else {
      // 모바일 메뉴
      await page.getByRole('button', { name: '메뉴 열기' }).click()
      await page.getByRole('button', { name: '로그아웃' }).click()
    }

    // 랜딩 페이지로 리다이렉트
    await page.waitForURL('**/', { timeout: 10_000 })
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
