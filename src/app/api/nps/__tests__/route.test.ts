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
  if (table === 'nps_responses') {
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
  return new Request('http://localhost/api/nps', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

const USER_ID = '33333333-3333-4333-a333-333333333333'
const DIAGNOSIS_ID = '44444444-4444-4444-a444-444444444444'

beforeEach(() => {
  vi.clearAllMocks()
  mockGetUser.mockResolvedValue({
    data: { user: { id: USER_ID } },
    error: null,
  })
})

// ─── Tests ───

describe('POST /api/nps', () => {
  it('should insert NPS response and return submitted=true', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: DIAGNOSIS_ID, user_id: USER_ID, status: 'completed' },
      error: null,
    })
    mockInsert.mockResolvedValue({ error: null })

    const res = await POST(
      makeRequest({ diagnosisId: DIAGNOSIS_ID, score: 9 }) as never
    )
    const json = (await res.json()) as {
      success: boolean
      data: { submitted: boolean }
    }

    expect(res.status).toBe(200)
    expect(json.data.submitted).toBe(true)
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: USER_ID,
      diagnosis_id: DIAGNOSIS_ID,
      score: 9,
      comment: null,
    })
  })

  it('should pass null when comment is not provided', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: DIAGNOSIS_ID, user_id: USER_ID, status: 'completed' },
      error: null,
    })
    mockInsert.mockResolvedValue({ error: null })

    await POST(makeRequest({ diagnosisId: DIAGNOSIS_ID, score: 9 }) as never)

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ comment: null })
    )
  })

  it('should accept optional comment', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: DIAGNOSIS_ID, user_id: USER_ID, status: 'completed' },
      error: null,
    })
    mockInsert.mockResolvedValue({ error: null })

    await POST(
      makeRequest({
        diagnosisId: DIAGNOSIS_ID,
        score: 8,
        comment: '유용했어요',
      }) as never
    )

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ comment: '유용했어요' })
    )
  })

  it('should silently return success on duplicate (23505)', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: DIAGNOSIS_ID, user_id: USER_ID, status: 'completed' },
      error: null,
    })
    mockInsert.mockResolvedValue({
      error: { code: '23505', message: 'duplicate key' },
    })

    const res = await POST(
      makeRequest({ diagnosisId: DIAGNOSIS_ID, score: 7 }) as never
    )
    const json = (await res.json()) as {
      success: boolean
      data: { submitted: boolean }
    }

    // 사용자에게는 성공으로 보여야 함
    expect(res.status).toBe(200)
    expect(json.data.submitted).toBe(true)
  })

  it('should return 400 when score is below 0', async () => {
    const res = await POST(
      makeRequest({ diagnosisId: DIAGNOSIS_ID, score: -1 }) as never
    )
    expect(res.status).toBe(400)
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('should return 400 when score is above 10', async () => {
    const res = await POST(
      makeRequest({ diagnosisId: DIAGNOSIS_ID, score: 11 }) as never
    )
    expect(res.status).toBe(400)
  })

  it('should return 400 when score is not integer', async () => {
    const res = await POST(
      makeRequest({ diagnosisId: DIAGNOSIS_ID, score: 7.5 }) as never
    )
    expect(res.status).toBe(400)
  })

  it('should return 400 when comment exceeds 500 chars', async () => {
    const res = await POST(
      makeRequest({
        diagnosisId: DIAGNOSIS_ID,
        score: 9,
        comment: 'a'.repeat(501),
      }) as never
    )
    expect(res.status).toBe(400)
  })

  it('should return 404 when diagnosis belongs to another user', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: DIAGNOSIS_ID,
        user_id: 'different-user-id',
        status: 'completed',
      },
      error: null,
    })

    const res = await POST(
      makeRequest({ diagnosisId: DIAGNOSIS_ID, score: 9 }) as never
    )
    expect(res.status).toBe(404)
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('should return 400 when diagnosis status is pending', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: DIAGNOSIS_ID, user_id: USER_ID, status: 'pending' },
      error: null,
    })

    const res = await POST(
      makeRequest({ diagnosisId: DIAGNOSIS_ID, score: 9 }) as never
    )
    expect(res.status).toBe(400)
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('should return 400 when diagnosis status is failed', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: DIAGNOSIS_ID, user_id: USER_ID, status: 'failed' },
      error: null,
    })

    const res = await POST(
      makeRequest({ diagnosisId: DIAGNOSIS_ID, score: 9 }) as never
    )
    expect(res.status).toBe(400)
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('should return 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const res = await POST(
      makeRequest({ diagnosisId: DIAGNOSIS_ID, score: 9 }) as never
    )
    expect(res.status).toBe(401)
  })

  it('should return 500 on unexpected insert error', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: DIAGNOSIS_ID, user_id: USER_ID, status: 'completed' },
      error: null,
    })
    mockInsert.mockResolvedValue({
      error: { code: '23514', message: 'check violation' },
    })

    const res = await POST(
      makeRequest({ diagnosisId: DIAGNOSIS_ID, score: 9 }) as never
    )
    expect(res.status).toBe(500)
  })
})
