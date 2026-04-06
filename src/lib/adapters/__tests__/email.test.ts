import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Resend Mock ───

const mockSend = vi.fn()

vi.mock('resend', () => {
  return {
    Resend: class MockResend {
      emails = { send: mockSend }
    },
  }
})

const { sendDiagnosisCompleteEmail } = await import('../email')

const baseParams = {
  to: 'test@example.com',
  score: 67,
  grade: '보통',
  reportUrl: 'https://findably.kr/dashboard',
  siteUrl: 'https://example.com',
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.RESEND_API_KEY = 'test-api-key'
})

describe('sendDiagnosisCompleteEmail', () => {
  it('should send email successfully and return true', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email-123' }, error: null })

    const result = await sendDiagnosisCompleteEmail(baseParams)

    expect(result).toBe(true)
    expect(mockSend).toHaveBeenCalledOnce()
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Findably <noreply@findably.kr>',
        to: 'test@example.com',
        subject: '마케팅 진단 완료 — 67점 (보통)',
      })
    )
  })

  it('should include score and CTA in HTML', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email-123' }, error: null })

    await sendDiagnosisCompleteEmail(baseParams)

    const html = mockSend.mock.calls[0]![0].html as string
    expect(html).toContain('67')
    expect(html).toContain('보통')
    expect(html).toContain('https://findably.kr/dashboard')
    expect(html).toContain('진단 결과 보기')
  })

  it('should use green color for score >= 70', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email-123' }, error: null })

    await sendDiagnosisCompleteEmail({ ...baseParams, score: 85 })

    const html = mockSend.mock.calls[0]![0].html as string
    expect(html).toContain('#22C55E')
  })

  it('should use yellow color for score 40-69', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email-123' }, error: null })

    await sendDiagnosisCompleteEmail({ ...baseParams, score: 55 })

    const html = mockSend.mock.calls[0]![0].html as string
    expect(html).toContain('#F59E0B')
  })

  it('should use red color for score < 40', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email-123' }, error: null })

    await sendDiagnosisCompleteEmail({ ...baseParams, score: 25 })

    const html = mockSend.mock.calls[0]![0].html as string
    expect(html).toContain('#EF4444')
  })

  it('should return false when Resend returns error', async () => {
    mockSend.mockResolvedValue({
      data: null,
      error: { message: 'Invalid API key' },
    })

    const result = await sendDiagnosisCompleteEmail(baseParams)

    expect(result).toBe(false)
  })

  it('should return false and not throw when send throws', async () => {
    mockSend.mockRejectedValue(new Error('Network error'))

    const result = await sendDiagnosisCompleteEmail(baseParams)

    expect(result).toBe(false)
  })

  it('should return false when RESEND_API_KEY is missing on fresh module', async () => {
    delete process.env.RESEND_API_KEY

    // 싱글턴 캐시를 우회하기 위해 모듈 재로드
    vi.resetModules()
    const { sendDiagnosisCompleteEmail: freshSend } = await import('../email')

    const result = await freshSend(baseParams)

    expect(result).toBe(false)
  })
})
