import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { CrawlData } from '../../types'

// ─── Supabase admin mock ───
const mockUpdate = vi.fn()
const mockEq = vi.fn()
const mockFrom = vi.fn(() => ({
  update: mockUpdate,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: mockFrom,
  }),
}))

import { saveCrawlResult, markDiagnosisFailed } from '../save-crawl-result'

/** 유효한 CrawlData 생성 헬퍼 */
function createValidCrawlData(overrides?: Partial<CrawlData>): CrawlData {
  return {
    crawled_at: '2026-03-14T10:00:00.000Z',
    duration_ms: 5000,
    is_partial: false,
    layer1: null,
    robots_txt: null,
    sitemap: null,
    llms_txt: null,
    cms: null,
    mobile: null,
    layer2: null,
    layer3: null,
    markdownContent: null,
    siteUrls: null,
    firecrawlUsed: false,
    ...overrides,
  }
}

describe('saveCrawlResult', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})

    // 기본 체이닝 설정: from().update().eq()
    mockUpdate.mockReturnValue({ eq: mockEq })
    mockEq.mockResolvedValue({ error: null })
  })

  // ─── 정상 저장 ───

  it('should save valid crawl data and return success', async () => {
    const crawlData = createValidCrawlData()

    const result = await saveCrawlResult({
      diagnosisId: 'diag-123',
      crawlData,
    })

    expect(result).toEqual({ success: true })
    expect(mockFrom).toHaveBeenCalledWith('diagnoses')
    expect(mockUpdate).toHaveBeenCalledWith({
      crawl_data: expect.objectContaining({
        crawled_at: '2026-03-14T10:00:00.000Z',
        duration_ms: 5000,
        is_partial: false,
      }),
      status: 'analyzing',
    })
    expect(mockEq).toHaveBeenCalledWith('id', 'diag-123')
  })

  // ─── Zod 검증 실패 ───

  it('should return error when crawlData fails Zod validation', async () => {
    const invalidData = {
      crawled_at: 123, // string이어야 함
      duration_ms: 'not-a-number',
    } as unknown as CrawlData

    const result = await saveCrawlResult({
      diagnosisId: 'diag-456',
      crawlData: invalidData,
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('데이터 검증 실패')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  // ─── Supabase UPDATE 실패 ───

  it('should return error when Supabase UPDATE fails', async () => {
    mockEq.mockResolvedValueOnce({
      error: { message: 'Row not found' },
    })

    const result = await saveCrawlResult({
      diagnosisId: 'diag-789',
      crawlData: createValidCrawlData(),
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('DB 저장 실패')
  })

  // ─── 예외 발생 ───

  it('should catch exception and return error', async () => {
    mockUpdate.mockImplementationOnce(() => {
      throw new Error('Connection refused')
    })

    const result = await saveCrawlResult({
      diagnosisId: 'diag-000',
      crawlData: createValidCrawlData(),
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('데이터 저장 중 오류가 발생했습니다')
  })

  // ─── is_partial + blocked_reason 포함 ───

  it('should save partial crawl data with blocked_reason', async () => {
    const crawlData = createValidCrawlData({
      is_partial: true,
      blocked_reason: 'robots.txt denied',
    })

    const result = await saveCrawlResult({
      diagnosisId: 'diag-partial',
      crawlData,
    })

    expect(result.success).toBe(true)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        crawl_data: expect.objectContaining({
          is_partial: true,
          blocked_reason: 'robots.txt denied',
        }),
      })
    )
  })

  // ─── status를 analyzing으로 변경 ───

  it('should set status to analyzing', async () => {
    await saveCrawlResult({
      diagnosisId: 'diag-status',
      crawlData: createValidCrawlData(),
    })

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'analyzing',
      })
    )
  })
})

describe('markDiagnosisFailed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})

    mockUpdate.mockReturnValue({ eq: mockEq })
    mockEq.mockResolvedValue({ error: null })
  })

  // ─── 정상 실패 마킹 ───

  it('should update status to failed with reason', async () => {
    await markDiagnosisFailed('diag-fail', 'Timeout exceeded')

    expect(mockFrom).toHaveBeenCalledWith('diagnoses')
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        crawl_data: expect.objectContaining({
          is_partial: true,
          blocked_reason: 'Timeout exceeded',
          layer1: null,
          layer2: null,
          layer3: null,
        }),
      })
    )
    expect(mockEq).toHaveBeenCalledWith('id', 'diag-fail')
  })

  // ─── Supabase 에러 시 로깅만 ───

  it('should log error when Supabase UPDATE fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error')
    mockEq.mockResolvedValueOnce({
      error: { message: 'DB error' },
    })

    await markDiagnosisFailed('diag-err', 'some reason')

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[markDiagnosisFailed]'),
      'DB error'
    )
  })

  // ─── 예외 시 크래시 안 함 ───

  it('should not throw when exception occurs', async () => {
    mockUpdate.mockImplementationOnce(() => {
      throw new Error('Network error')
    })

    await expect(
      markDiagnosisFailed('diag-crash', 'reason')
    ).resolves.toBeUndefined()
  })
})
