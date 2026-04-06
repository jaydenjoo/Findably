import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ───

const mockGetUser = vi.fn()
const mockMaybeSingle = vi.fn()
const mockInsert = vi.fn()

const mockFrom = vi.fn((table: string) => {
  if (table === 'diagnoses') {
    return {
      select: () => ({
        eq: () => ({
          maybeSingle: mockMaybeSingle,
        }),
      }),
    }
  }
  if (table === 'self_reports') {
    return { insert: mockInsert }
  }
  return {}
})

const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: mockFrom,
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

vi.mock('@/lib/analytics/events', () => ({
  trackEvent: vi.fn(() => Promise.resolve(true)),
}))

const { POST } = await import('../route')

// ─── Helpers ───

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/self-report', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

const USER_ID = '11111111-1111-4111-a111-111111111111'
const DIAGNOSIS_ID = '22222222-2222-4222-a222-222222222222'

beforeEach(() => {
  vi.clearAllMocks()
  mockGetUser.mockResolvedValue({
    data: { user: { id: USER_ID } },
    error: null,
  })
})

// ─── Tests ───

describe('POST /api/self-report', () => {
  it('should insert self report and return success', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: DIAGNOSIS_ID, user_id: USER_ID },
      error: null,
    })
    mockInsert.mockResolvedValue({ error: null })

    const res = await POST(
      makeRequest({ diagnosisId: DIAGNOSIS_ID, ruleId: 'tech-01' }) as never
    )
    const json = (await res.json()) as {
      success: boolean
      data: { alreadyReported: boolean; recrawlScheduledAt: string }
    }

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.alreadyReported).toBe(false)
    expect(json.data.recrawlScheduledAt).toBeTruthy()
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: USER_ID,
        diagnosis_id: DIAGNOSIS_ID,
        rule_id: 'tech-01',
      })
    )
  })

  it('should schedule recrawl 7 days later', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: DIAGNOSIS_ID, user_id: USER_ID },
      error: null,
    })
    mockInsert.mockResolvedValue({ error: null })

    const before = Date.now()
    await POST(
      makeRequest({ diagnosisId: DIAGNOSIS_ID, ruleId: 'tech-01' }) as never
    )

    const insertArg = mockInsert.mock.calls[0]![0] as {
      recrawl_scheduled_at: string
    }
    const scheduledMs = new Date(insertArg.recrawl_scheduled_at).getTime()
    const expectedMin = before + 7 * 24 * 60 * 60 * 1000 - 2000
    expect(scheduledMs).toBeGreaterThanOrEqual(expectedMin)
  })

  it('should return alreadyReported=true on duplicate (23505)', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: DIAGNOSIS_ID, user_id: USER_ID },
      error: null,
    })
    mockInsert.mockResolvedValue({
      error: { code: '23505', message: 'duplicate key' },
    })

    const res = await POST(
      makeRequest({ diagnosisId: DIAGNOSIS_ID, ruleId: 'tech-01' }) as never
    )
    const json = (await res.json()) as {
      success: boolean
      data: { alreadyReported: boolean }
    }

    expect(res.status).toBe(200)
    expect(json.data.alreadyReported).toBe(true)
  })

  it('should return 404 when diagnosis belongs to another user', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: DIAGNOSIS_ID, user_id: 'different-user-id' },
      error: null,
    })

    const res = await POST(
      makeRequest({ diagnosisId: DIAGNOSIS_ID, ruleId: 'tech-01' }) as never
    )

    expect(res.status).toBe(404)
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('should return 404 when diagnosis not found', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    const res = await POST(
      makeRequest({ diagnosisId: DIAGNOSIS_ID, ruleId: 'tech-01' }) as never
    )

    expect(res.status).toBe(404)
  })

  it('should return 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const res = await POST(
      makeRequest({ diagnosisId: DIAGNOSIS_ID, ruleId: 'tech-01' }) as never
    )

    expect(res.status).toBe(401)
  })

  it('should return 400 on invalid diagnosisId', async () => {
    const res = await POST(
      makeRequest({ diagnosisId: 'not-a-uuid', ruleId: 'tech-01' }) as never
    )

    expect(res.status).toBe(400)
  })

  it('should return 400 when ruleId is empty', async () => {
    const res = await POST(
      makeRequest({ diagnosisId: DIAGNOSIS_ID, ruleId: '' }) as never
    )

    expect(res.status).toBe(400)
  })

  it('should return 500 on unexpected insert error', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: DIAGNOSIS_ID, user_id: USER_ID },
      error: null,
    })
    mockInsert.mockResolvedValue({
      error: { code: '42501', message: 'rls violation' },
    })

    const res = await POST(
      makeRequest({ diagnosisId: DIAGNOSIS_ID, ruleId: 'tech-01' }) as never
    )

    expect(res.status).toBe(500)
  })
})
