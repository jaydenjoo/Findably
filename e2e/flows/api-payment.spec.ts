import { test, expect } from '@playwright/test'

/**
 * 결제 API 엔드포인트 테스트
 *
 * 대상 엔드포인트:
 * - POST /api/payment/checkout (결제 처리 — mock 어댑터)
 * - POST /api/payment/trigger-analysis (유료 분석 트리거 — 내부 API)
 *
 * 테스트 전략:
 * - 인증 실패 → request fixture (쿠키 없음)
 * - 페이로드 검증 + Rate limit + Happy path → 단일 로그인 세션에서 순차 실행
 *   (Rate limit: 3회/60초이므로 모든 checkout 호출을 1세션에서 관리)
 */

const FAKE_UUID = '00000000-0000-0000-0000-000000000000'
const TEST_EMAIL = 'e2etest-0316@findably.dev'
const TEST_PASSWORD = 'TestPass1234!'

test.describe('POST /api/payment/checkout — 결제 처리', () => {
  test('비로그인 → 401', async ({ request }) => {
    const res = await request.post('/api/payment/checkout', {
      data: { diagnosisId: FAKE_UUID },
    })

    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  test('로그인 후 검증 + Rate limit 통합 테스트', async ({ page }) => {
    // 단일 로그인 세션에서 모든 checkout 호출을 순차 실행
    // Rate limit: 3회/60초 (payment:${user.id} 키)
    await page.goto('/login')
    await page.getByLabel('이메일').fill(TEST_EMAIL)
    await page.getByLabel('비밀번호').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: '로그인 →' }).click()
    await page.waitForURL('**/dashboard**', { timeout: 15_000 })

    // ─── Call 1/3: diagnosisId 누락 → 400 ───
    const result1 = await page.evaluate(async () => {
      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      return { status: res.status, body: await res.json() }
    })
    expect(result1.status).toBe(400)
    expect(result1.body.success).toBe(false)

    // ─── Call 2/3: 잘못된 UUID 형식 → 400 ───
    const result2 = await page.evaluate(async () => {
      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnosisId: 'not-a-valid-uuid' }),
      })
      return { status: res.status, body: await res.json() }
    })
    expect(result2.status).toBe(400)
    expect(result2.body.success).toBe(false)

    // ─── Call 3/3: 유효한 UUID (mock 어댑터) → 200 또는 500 ───
    const result3 = await page.evaluate(async (uuid: string) => {
      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnosisId: uuid }),
      })
      return { status: res.status, body: await res.json() }
    }, FAKE_UUID)
    // mock 어댑터 결제 성공, DB에 진단 없으면 createPayment 실패 → 500
    expect([200, 500]).toContain(result3.status)

    // ─── Call 4: Rate limit 초과 → 429 ───
    const result4 = await page.evaluate(async (uuid: string) => {
      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnosisId: uuid }),
      })
      return res.status
    }, FAKE_UUID)
    expect(result4).toBe(429)
  })
})

test.describe('POST /api/payment/trigger-analysis — 유료 분석 트리거', () => {
  test('x-internal-secret 헤더 없음 → 401', async ({ request }) => {
    const res = await request.post('/api/payment/trigger-analysis', {
      data: { diagnosisId: FAKE_UUID },
    })

    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  test('잘못된 시크릿 → 401', async ({ request }) => {
    const res = await request.post('/api/payment/trigger-analysis', {
      headers: { 'x-internal-secret': 'wrong-secret-value' },
      data: { diagnosisId: FAKE_UUID },
    })

    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  test('유효한 시크릿 + 잘못된 UUID 형식 → 400', async ({ request }) => {
    const secret = process.env.CRAWL_EXECUTE_SECRET
    if (!secret) {
      test.skip()
      return
    }

    const res = await request.post('/api/payment/trigger-analysis', {
      headers: { 'x-internal-secret': secret },
      data: { diagnosisId: 'invalid-uuid-format' },
    })

    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  test('유효한 시크릿 + 존재하지 않는 진단 → 500 (runDiagnosisPaid 실패)', async ({
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

    // 존재하지 않는 진단 → runDiagnosisPaid 내부에서 실패 → 500
    expect(res.status()).toBe(500)
    const body = await res.json()
    expect(body.success).toBe(false)
  })
})
