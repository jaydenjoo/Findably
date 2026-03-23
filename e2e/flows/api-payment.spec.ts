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
    // 주의: in-memory rate limit은 dev 서버 프로세스 단위 → 이전 테스트 실행 잔여 quota 영향
    await page.goto('/login')
    await page.getByLabel('이메일').fill(TEST_EMAIL)
    await page.getByLabel('비밀번호').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: '로그인 →' }).click()
    await page.waitForURL('**/dashboard**', { timeout: 15_000 })

    // ─── Call 1: diagnosisId 누락 → 400 또는 429 (잔여 rate limit) ───
    const result1 = await page.evaluate(async () => {
      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      return { status: res.status, body: await res.json() }
    })
    // rate limit이 이미 소진된 경우 429가 반환될 수 있음
    expect([400, 429]).toContain(result1.status)
    expect(result1.body.success).toBe(false)

    // ─── Call 2: 잘못된 UUID 형식 → 400 또는 429 ───
    const result2 = await page.evaluate(async () => {
      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnosisId: 'not-a-valid-uuid' }),
      })
      return { status: res.status, body: await res.json() }
    })
    expect([400, 429]).toContain(result2.status)
    expect(result2.body.success).toBe(false)

    // ─── Call 3: 유효한 UUID (mock 어댑터) → 200, 500, 또는 429 ───
    const result3 = await page.evaluate(async (uuid: string) => {
      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnosisId: uuid }),
      })
      return { status: res.status, body: await res.json() }
    }, FAKE_UUID)
    expect([200, 500, 429]).toContain(result3.status)

    // ─── Call 4+: 연속 호출로 rate limit 초과 확인 ───
    // quota 3회가 아직 남아있을 수 있으므로 최대 5회 추가 호출
    let got429 = false
    for (let i = 0; i < 5; i++) {
      const status = await page.evaluate(async (uuid: string) => {
        const res = await fetch('/api/payment/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ diagnosisId: uuid }),
        })
        return res.status
      }, FAKE_UUID)

      if (status === 429) {
        got429 = true
        break
      }
    }
    expect(got429).toBe(true)
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

  test('유효한 시크릿 + 존재하지 않는 진단 → 202 (after() 백그라운드 실행)', async ({
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
})
