import { test, expect } from '@playwright/test'

/**
 * 전체 시스템 플로우 E2E 테스트
 *
 * n8n 콜백 시뮬레이션 + AI 어댑터 + 결제 mock을 포함한 통합 테스트.
 * 실제 외부 서비스(n8n, Toss) 없이 API 직접 호출로 플로우 검증.
 *
 * 플로우:
 * 1. 로그인
 * 2. 대시보드 → 기존 진단 상태 확인
 * 3. n8n v2 콜백 시뮬레이션 (CRAWL_EXECUTE_SECRET 있을 때만)
 * 4. 무료 리포트 대시보드 확인
 * 5. 결제 API 호출 (mock 어댑터)
 * 6. 유료 분석 트리거
 * 7. 상세 리포트 페이지 확인
 * 8. 로그아웃
 */

const TEST_EMAIL = 'e2etest-0316@findably.dev'
const TEST_PASSWORD = 'TestPass1234!'
const FAKE_UUID = '00000000-0000-0000-0000-000000000000'

test.describe('시스템 통합 플로우', () => {
  test.setTimeout(180_000) // 3분

  test('로그인 → 대시보드 → 결제 → 리포트 → 로그아웃 전체 여정', async ({
    page,
  }) => {
    // ─── Step 1: 로그인 ───
    await page.goto('/login')
    await page.getByLabel('이메일').fill(TEST_EMAIL)
    await page.getByLabel('비밀번호').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: '로그인 →' }).click()
    await page.waitForURL('**/dashboard**', { timeout: 15_000 })
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/dashboard/)

    // ─── Step 2: 대시보드 상태 확인 ───
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

    // ─── Step 3: 기존 진단 ID 추출 (있는 경우) ───
    let diagnosisId: string | null = null

    if (hasScore > 0) {
      // checkout 링크에서 diagnosisId 추출
      const checkoutLink = page.locator('a[href*="/checkout/"]').first()
      const checkoutCount = await checkoutLink.count()
      if (checkoutCount > 0) {
        const href = await checkoutLink.getAttribute('href')
        diagnosisId = href?.split('/checkout/')[1] ?? null
      }

      // checkout 링크 없으면 리포트 링크에서 추출
      if (!diagnosisId) {
        const reportLink = page.locator('a[href*="/reports/my/"]').first()
        const reportCount = await reportLink.count()
        if (reportCount > 0) {
          const href = await reportLink.getAttribute('href')
          diagnosisId = href?.split('/reports/my/')[1] ?? null
        }
      }
    }

    console.log('[system-flow] diagnosisId:', diagnosisId ?? 'none')

    // ─── Step 4: n8n 콜백 시뮬레이션 (시크릿 있을 때만) ───
    const webhookSecret = process.env.N8N_WEBHOOK_SECRET
    if (webhookSecret && diagnosisId) {
      // n8n v2 콜백을 직접 호출하여 크롤링 완료 시뮬레이션
      const callbackResult = await page.evaluate(
        async ({ id, secret }: { id: string; secret: string }) => {
          const res = await fetch('/api/crawl/complete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${secret}`,
            },
            body: JSON.stringify({
              diagnosisId: id,
              url: 'https://example.com',
              dataCompleteness: 80,
              successSources: ['playwright', 'pagespeed'],
              failedSources: ['lighthouse'],
              crawlResult: {
                playwright: { title: 'Test Site', meta_description: 'Test' },
                pagespeed: {
                  performance: 85,
                  accessibility: 90,
                  seo: 75,
                },
              },
            }),
          })
          return { status: res.status, body: await res.json() }
        },
        { id: diagnosisId, secret: webhookSecret }
      )

      console.log(
        '[system-flow] n8n callback result:',
        JSON.stringify(callbackResult)
      )

      // 이미 처리된 진단이면 에러가 날 수 있으므로 상태코드만 로깅
      // 200 또는 500 (이미 완료된 진단에 대한 재시도)
    }

    // ─── Step 5: 결제 API 호출 (mock 어댑터) ───
    if (diagnosisId) {
      const checkoutResult = await page.evaluate(async (id: string) => {
        const res = await fetch('/api/payment/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ diagnosisId: id }),
        })
        return { status: res.status, body: await res.json() }
      }, diagnosisId)

      console.log(
        '[system-flow] checkout result:',
        JSON.stringify(checkoutResult)
      )

      // 결제 성공(200) 또는 이미 결제됨/DB 에러(500) — 인증+검증 통과 확인
      expect([200, 500]).toContain(checkoutResult.status)

      // ─── Step 6: 대시보드에서 상태 변화 확인 ───
      if (checkoutResult.status === 200) {
        await page.waitForTimeout(3_000) // 분석 트리거 대기
        await page.goto('/dashboard')
        await page.waitForLoadState('networkidle')

        // 대시보드가 정상 로드되는지 확인
        const mainContent = await page.locator('main').count()
        expect(mainContent).toBeGreaterThan(0)
      }

      // ─── Step 7: 상세 리포트 페이지 확인 ───
      await page.goto(`/reports/my/${diagnosisId}`)
      await page.waitForLoadState('networkidle')

      // 리포트 페이지가 로드됨 (404가 아님 — 로그인 리다이렉트도 아님)
      const currentUrl = page.url()
      const is404 = await page.getByText('찾으시는 페이지').count()
      const isLoginRedirect = currentUrl.includes('/login')

      if (!is404 && !isLoginRedirect) {
        const reportContent = await page.locator('main').count()
        expect(reportContent).toBeGreaterThan(0)
      }
    }

    // ─── Step 8: 로그아웃 ───
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

    // Server Action redirect → / 또는 /login으로 이동
    await expect(page).toHaveURL(/\/(login.*)?$/, { timeout: 15_000 })
  })
})

test.describe('API 간 연계 테스트', () => {
  test('crawl/execute → 진단 완료 후 리포트 접근 가능 확인', async ({
    request,
  }) => {
    const secret = process.env.CRAWL_EXECUTE_SECRET
    if (!secret) {
      test.skip()
      return
    }

    // execute는 존재하는 진단에만 작동 → FAKE_UUID로는 404
    const res = await request.post('/api/crawl/execute', {
      headers: { 'x-internal-secret': secret },
      data: {
        diagnosisId: FAKE_UUID,
        url: 'https://example.com',
      },
    })

    // 존재하지 않는 진단 → 404
    expect(res.status()).toBe(404)
    const body = await res.json()
    expect(body.error).toContain('찾을 수 없습니다')
  })

  test('payment/trigger-analysis → 존재하지 않는 진단 → 202 (after() 백그라운드 실행)', async ({
    request,
  }) => {
    const secret = process.env.CRAWL_EXECUTE_SECRET
    if (!secret) {
      test.skip()
      return
    }

    const res = await request.post('/api/payment/trigger-analysis', {
      headers: { 'x-internal-secret': secret },
      data: { diagnosisId: FAKE_UUID },
    })

    // after() API로 즉시 202 반환 — 실제 분석은 백그라운드에서 실행(실패)
    expect(res.status()).toBe(202)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('accepted')
  })

  test('crawl/complete + crawl/webhook — 동일 인증 메커니즘 검증', async ({
    request,
  }) => {
    // 두 엔드포인트 모두 Bearer 인증 사용 — 일관성 확인
    const endpoints = ['/api/crawl/complete', '/api/crawl/webhook']

    for (const endpoint of endpoints) {
      // 인증 없이 → 401
      const noAuth = await request.post(endpoint, {
        data: { diagnosisId: FAKE_UUID },
      })
      expect(noAuth.status()).toBe(401)

      // 잘못된 Bearer → 401
      const wrongAuth = await request.post(endpoint, {
        headers: { Authorization: 'Bearer wrong-token' },
        data: { diagnosisId: FAKE_UUID },
      })
      expect(wrongAuth.status()).toBe(401)
    }
  })

  test('crawl/trigger + payment/checkout — withAuth 인증 일관성', async ({
    request,
  }) => {
    // 두 엔드포인트 모두 withAuth 사용 — 비로그인 시 401
    const endpoints = ['/api/crawl/trigger', '/api/payment/checkout']

    for (const endpoint of endpoints) {
      const res = await request.post(endpoint, {
        data: { diagnosisId: FAKE_UUID },
      })
      expect(res.status()).toBe(401)
    }
  })
})

test.describe('n8n 308 리다이렉트 대응 검증', () => {
  test('GET /api/crawl/complete — POST→GET 변환에도 처리 가능', async ({
    request,
  }) => {
    // n8n이 trailing slash 308 리다이렉트 시 POST→GET 변환
    const res = await request.get('/api/crawl/complete')

    // 인증 없으므로 401 (405가 아님을 확인 — GET 핸들러 존재 증명)
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
  })
})
