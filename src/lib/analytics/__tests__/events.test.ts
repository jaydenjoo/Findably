import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Supabase Admin Mock ───

const mockInsert = vi.fn()
const mockFrom = vi.fn(() => ({ insert: mockInsert }))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: mockFrom }),
}))

const { trackEvent } = await import('../events')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('trackEvent', () => {
  it('should insert event into analytics_events table', async () => {
    mockInsert.mockResolvedValue({ error: null })

    const result = await trackEvent({
      userId: 'user-123',
      event: 'url_submitted',
      properties: { url: 'https://example.com' },
    })

    expect(result).toBe(true)
    expect(mockFrom).toHaveBeenCalledWith('analytics_events')
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'user-123',
      event: 'url_submitted',
      properties: { url: 'https://example.com' },
    })
  })

  it('should default properties to empty object when omitted', async () => {
    mockInsert.mockResolvedValue({ error: null })

    await trackEvent({
      userId: 'user-123',
      event: 'diagnosis_completed',
    })

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'user-123',
      event: 'diagnosis_completed',
      properties: {},
    })
  })

  it('should return false when Supabase INSERT fails', async () => {
    mockInsert.mockResolvedValue({
      error: { message: 'RLS violation' },
    })

    const result = await trackEvent({
      userId: 'user-123',
      event: 'payment_started',
    })

    expect(result).toBe(false)
  })

  it('should return false and not throw on unexpected error', async () => {
    mockInsert.mockRejectedValue(new Error('Network error'))

    const result = await trackEvent({
      userId: 'user-123',
      event: 'report_viewed',
    })

    expect(result).toBe(false)
  })

  it('should accept all defined event types', async () => {
    mockInsert.mockResolvedValue({ error: null })

    const events = [
      'url_submitted',
      'diagnosis_completed',
      'report_viewed',
      'payment_started',
      'payment_completed',
      'quickwin_clicked',
      'pdf_downloaded',
      'self_report_submitted',
      'nps_submitted',
    ] as const

    for (const event of events) {
      await trackEvent({ userId: 'user-123', event })
    }

    expect(mockInsert).toHaveBeenCalledTimes(events.length)
  })
})
