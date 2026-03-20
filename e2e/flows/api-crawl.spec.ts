import { test, expect } from '@playwright/test'

/**
 * 크롤링 API 엔드포인트 테스트
 *
 * 대상 엔드포인트:
 * - POST/GET /api/crawl/complete (n8n v2 콜백)
 * - POST /api/crawl/webhook (n8n Layer 1 콜백)
 * - POST /api/crawl/execute (내부 직접 크롤)
 * - POST /api/crawl/trigger (사용자 크롤 트리거)
 *
 * 테스트 전략:
 * - 인증 실패 / 페이로드 검증 실패 → 외부 의존성 없이 테스트 가능
 * - Happy path → 시스템 플로우 테스트에서 통합 검증
 */

const FAKE_UUID = '00000000-0000-0000-0000-000000000000'

test.describe('POST /api/crawl/complete — n8n v2 콜백', () => {
  test('Bearer 인증 없음 → 401', async ({ request }) => {
    const res = await request.post('/api/crawl/complete', {
      data: {
        diagnosisId: FAKE_UUID,
        url: 'https://example.com',
        dataCompleteness: 100,
        successSources: ['playwright'],
        failedSources: [],
        crawlResult: {},
      },
    })

    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  test('잘못된 Bearer 토큰 → 401', async ({ request }) => {
    const res = await request.post('/api/crawl/complete', {
      headers: { Authorization: 'Bearer wrong-token-value' },
      data: {
        diagnosisId: FAKE_UUID,
        url: 'https://example.com',
        dataCompleteness: 100,
        successSources: [],
        failedSources: [],
        crawlResult: {},
      },
    })

    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error).toContain('인증')
  })

  test('유효한 Bearer + 잘못된 페이로드 (UUID 형식 오류) → 400', async ({
    request,
  }) => {
    // N8N_WEBHOOK_SECRET이 설정되어야 이 테스트가 의미 있음
    const secret = process.env.N8N_WEBHOOK_SECRET
    if (!secret) {
      test.skip()
      return
    }

    const res = await request.post('/api/crawl/complete', {
      headers: { Authorization: `Bearer ${secret}` },
      data: {
        diagnosisId: 'not-a-uuid',
        url: 'https://example.com',
        dataCompleteness: 100,
        successSources: [],
        failedSources: [],
        crawlResult: {},
      },
    })

    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
  })
})

test.describe('GET /api/crawl/complete — n8n 308 리다이렉트 대응', () => {
  test('GET 메서드도 처리 가능 (POST→GET 변환 대응)', async ({ request }) => {
    // n8n이 trailing slash 308 리다이렉트 시 POST→GET 변환하는 경우 대응
    const res = await request.get('/api/crawl/complete')

    // 인증 없이 요청했으므로 401 (405가 아님을 확인)
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
  })
})

test.describe('POST /api/crawl/webhook — n8n Layer 1 콜백', () => {
  test('Bearer 인증 없음 → 401', async ({ request }) => {
    const res = await request.post('/api/crawl/webhook', {
      data: {
        diagnosisId: FAKE_UUID,
        url: 'https://example.com',
        layer1: null,
        robots_txt: null,
        sitemap: null,
        llms_txt: null,
        cms: null,
        mobile: null,
      },
    })

    expect(res.status()).toBe(401)
  })

  test('잘못된 Bearer 토큰 → 401', async ({ request }) => {
    const res = await request.post('/api/crawl/webhook', {
      headers: { Authorization: 'Bearer invalid-secret' },
      data: {
        diagnosisId: FAKE_UUID,
        url: 'https://example.com',
        layer1: null,
      },
    })

    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.error).toContain('인증')
  })

  test('유효한 Bearer + 잘못된 UUID → 400', async ({ request }) => {
    const secret = process.env.N8N_WEBHOOK_SECRET
    if (!secret) {
      test.skip()
      return
    }

    const res = await request.post('/api/crawl/webhook', {
      headers: { Authorization: `Bearer ${secret}` },
      data: {
        diagnosisId: 'invalid-uuid',
        url: 'not-a-url',
      },
    })

    expect(res.status()).toBe(400)
  })
})

test.describe('POST /api/crawl/execute — 내부 직접 크롤', () => {
  test('x-internal-secret 헤더 없음 → 401', async ({ request }) => {
    const res = await request.post('/api/crawl/execute', {
      data: {
        diagnosisId: FAKE_UUID,
        url: 'https://example.com',
      },
    })

    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  test('잘못된 시크릿 → 401', async ({ request }) => {
    const res = await request.post('/api/crawl/execute', {
      headers: { 'x-internal-secret': 'wrong-secret' },
      data: {
        diagnosisId: FAKE_UUID,
        url: 'https://example.com',
      },
    })

    expect(res.status()).toBe(401)
  })

  test('유효한 시크릿 + 잘못된 UUID 형식 → 400', async ({ request }) => {
    const secret = process.env.CRAWL_EXECUTE_SECRET
    if (!secret) {
      test.skip()
      return
    }

    const res = await request.post('/api/crawl/execute', {
      headers: { 'x-internal-secret': secret },
      data: {
        diagnosisId: 'not-uuid',
        url: 'https://example.com',
      },
    })

    expect(res.status()).toBe(400)
  })

  test('유효한 시크릿 + 존재하지 않는 진단 → 404', async ({ request }) => {
    const secret = process.env.CRAWL_EXECUTE_SECRET
    if (!secret) {
      test.skip()
      return
    }

    const res = await request.post('/api/crawl/execute', {
      headers: { 'x-internal-secret': secret },
      data: {
        diagnosisId: FAKE_UUID,
        url: 'https://example.com',
      },
    })

    expect(res.status()).toBe(404)
    const body = await res.json()
    expect(body.error).toContain('찾을 수 없습니다')
  })
})

test.describe('POST /api/crawl/trigger — 사용자 크롤 트리거', () => {
  test('비로그인 → 401', async ({ request }) => {
    const res = await request.post('/api/crawl/trigger', {
      data: { diagnosisId: FAKE_UUID },
    })

    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.error).toContain('인증')
  })

  test('로그인 + diagnosisId 누락 → 400', async ({ page }) => {
    // 로그인
    await page.goto('/login')
    await page.getByLabel('이메일').fill('e2etest-0316@findably.dev')
    await page.getByLabel('비밀번호').fill('TestPass1234!')
    await page.getByRole('button', { name: '로그인 →' }).click()
    await page.waitForURL('**/dashboard**', { timeout: 15_000 })

    // diagnosisId 없이 요청
    const result = await page.evaluate(async () => {
      const res = await fetch('/api/crawl/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      return { status: res.status, body: await res.json() }
    })

    expect(result.status).toBe(400)
    expect(result.body.success).toBe(false)
  })

  test('로그인 + 존재하지 않는 진단 → 403 (소유권 불일치)', async ({
    page,
  }) => {
    await page.goto('/login')
    await page.getByLabel('이메일').fill('e2etest-0316@findably.dev')
    await page.getByLabel('비밀번호').fill('TestPass1234!')
    await page.getByRole('button', { name: '로그인 →' }).click()
    await page.waitForURL('**/dashboard**', { timeout: 15_000 })

    const result = await page.evaluate(async (uuid: string) => {
      const res = await fetch('/api/crawl/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnosisId: uuid }),
      })
      return { status: res.status, body: await res.json() }
    }, FAKE_UUID)

    // 소유권 불일치 또는 미존재 → 동일하게 403
    expect(result.status).toBe(403)
    expect(result.body.success).toBe(false)
  })
})
