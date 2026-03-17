import { describe, it, expect, vi, afterEach } from 'vitest'
import { calculateSecurityScore } from '../security-scorer'
import type { Layer3Data } from '@/features/crawling/types'

// ─── 헬퍼 ───

function makeLayer3(overrides: Partial<Layer3Data> = {}): Layer3Data {
  return {
    ssl: null,
    observatory: null,
    ...overrides,
  }
}

const goodSsl: NonNullable<Layer3Data['ssl']> = {
  grade: 'A+',
  valid: true,
  expires_at: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(), // 120일 후
  issuer: "Let's Encrypt",
  protocols: ['TLS 1.3', 'TLS 1.2'],
}

const goodObservatory: NonNullable<Layer3Data['observatory']> = {
  grade: 'A+',
  score: 115,
  issues: [],
}

const poorSsl: NonNullable<Layer3Data['ssl']> = {
  grade: 'F',
  valid: false,
  expires_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10일 전 만료
  issuer: null,
  protocols: ['TLS 1.0'],
}

const poorObservatory: NonNullable<Layer3Data['observatory']> = {
  grade: 'F',
  score: 10,
  issues: ['no-https', 'no-hsts', 'no-csp'],
}

// ─── null / none 처리 ───

describe('calculateSecurityScore — null 처리', () => {
  it('should return 0 score with none source when layer3 is null', () => {
    const result = calculateSecurityScore(null)

    expect(result.overall).toBe(0)
    expect(result.dataSource).toBe('none')
    expect(result.breakdown.sslGrade.score).toBe(0)
    expect(result.breakdown.sslProtocol.score).toBe(0)
    expect(result.breakdown.certExpiry.score).toBe(0)
    expect(result.breakdown.securityHeaders.score).toBe(0)
  })

  it('should return 0 score when all Layer3 fields are null', () => {
    const result = calculateSecurityScore(makeLayer3())

    expect(result.overall).toBe(0)
    expect(result.dataSource).toBe('none')
  })
})

// ─── dataSource 판별 ───

describe('calculateSecurityScore — dataSource', () => {
  it('should return partial when only ssl exists', () => {
    const result = calculateSecurityScore(makeLayer3({ ssl: goodSsl }))
    expect(result.dataSource).toBe('partial')
  })

  it('should return partial when only observatory exists', () => {
    const result = calculateSecurityScore(
      makeLayer3({ observatory: goodObservatory })
    )
    expect(result.dataSource).toBe('partial')
  })

  it('should return full when both ssl and observatory exist', () => {
    const result = calculateSecurityScore(
      makeLayer3({ ssl: goodSsl, observatory: goodObservatory })
    )
    expect(result.dataSource).toBe('full')
  })
})

// ─── good 등급 ───

describe('calculateSecurityScore — good metrics', () => {
  it('should score high with good SSL + Observatory data', () => {
    const result = calculateSecurityScore(
      makeLayer3({ ssl: goodSsl, observatory: goodObservatory })
    )

    // A+ = 40, TLS 1.3 = 15, 120일 = 15, 115/100*30 = 30 → 총 100
    expect(result.overall).toBeGreaterThanOrEqual(95)
    expect(result.breakdown.sslGrade.grade).toBe('A+')
    expect(result.breakdown.sslGrade.score).toBe(40)
    expect(result.breakdown.sslProtocol.bestProtocol).toBe('TLS 1.3')
    expect(result.breakdown.sslProtocol.score).toBe(15)
    expect(result.breakdown.certExpiry.score).toBe(15)
  })
})

// ─── poor 등급 ───

describe('calculateSecurityScore — poor metrics', () => {
  it('should score low with poor SSL + Observatory data', () => {
    const result = calculateSecurityScore(
      makeLayer3({ ssl: poorSsl, observatory: poorObservatory })
    )

    // F = 0, TLS 1.0 = 2, 만료(-10일) = 0, 10/100*30 = 3 → 총 5
    expect(result.overall).toBeLessThanOrEqual(10)
    expect(result.breakdown.sslGrade.score).toBe(0)
    expect(result.breakdown.sslProtocol.score).toBe(2)
    expect(result.breakdown.certExpiry.score).toBe(0)
    expect(result.breakdown.certExpiry.daysRemaining).toBeLessThan(0)
  })
})

// ─── SSL 등급 점수 ───

describe('calculateSecurityScore — SSL grade scoring', () => {
  it.each([
    ['A+', 40],
    ['A', 36],
    ['A-', 32],
    ['B', 28],
    ['C', 20],
    ['D', 10],
    ['E', 5],
    ['F', 0],
    ['T', 0],
    ['M', 0],
  ])('should score grade %s as %d', (grade, expected) => {
    const ssl = { ...goodSsl, grade }
    const result = calculateSecurityScore(makeLayer3({ ssl }))

    expect(result.breakdown.sslGrade.score).toBe(expected)
    expect(result.breakdown.sslGrade.maxScore).toBe(40)
  })

  it('should score unknown grade as 0', () => {
    const ssl = { ...goodSsl, grade: 'X' }
    const result = calculateSecurityScore(makeLayer3({ ssl }))

    expect(result.breakdown.sslGrade.score).toBe(0)
  })

  it('should score null grade as 0', () => {
    const ssl = { ...goodSsl, grade: null }
    const result = calculateSecurityScore(makeLayer3({ ssl }))

    expect(result.breakdown.sslGrade.score).toBe(0)
  })
})

// ─── TLS 프로토콜 점수 ───

describe('calculateSecurityScore — TLS protocol scoring', () => {
  it('should use highest protocol version score', () => {
    const ssl = { ...goodSsl, protocols: ['TLS 1.0', 'TLS 1.2', 'TLS 1.3'] }
    const result = calculateSecurityScore(makeLayer3({ ssl }))

    expect(result.breakdown.sslProtocol.score).toBe(15)
    expect(result.breakdown.sslProtocol.bestProtocol).toBe('TLS 1.3')
  })

  it('should score TLS 1.2 only as 10', () => {
    const ssl = { ...goodSsl, protocols: ['TLS 1.2'] }
    const result = calculateSecurityScore(makeLayer3({ ssl }))

    expect(result.breakdown.sslProtocol.score).toBe(10)
    expect(result.breakdown.sslProtocol.bestProtocol).toBe('TLS 1.2')
  })

  it('should score empty protocols as 0', () => {
    const ssl = { ...goodSsl, protocols: [] }
    const result = calculateSecurityScore(makeLayer3({ ssl }))

    expect(result.breakdown.sslProtocol.score).toBe(0)
    expect(result.breakdown.sslProtocol.bestProtocol).toBeNull()
  })

  it('should score unknown protocol as 0 but still record it', () => {
    const ssl = { ...goodSsl, protocols: ['SSL 3.0'] }
    const result = calculateSecurityScore(makeLayer3({ ssl }))

    expect(result.breakdown.sslProtocol.score).toBe(0)
    expect(result.breakdown.sslProtocol.bestProtocol).toBe('SSL 3.0')
  })
})

// ─── 인증서 만료 점수 ───

describe('calculateSecurityScore — cert expiry scoring', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should score 15 when 90+ days remaining', () => {
    const ssl = {
      ...goodSsl,
      expires_at: new Date(
        Date.now() + 100 * 24 * 60 * 60 * 1000
      ).toISOString(),
    }
    const result = calculateSecurityScore(makeLayer3({ ssl }))

    expect(result.breakdown.certExpiry.score).toBe(15)
    expect(result.breakdown.certExpiry.daysRemaining).toBeGreaterThanOrEqual(90)
  })

  it('should score 10 when 30-89 days remaining', () => {
    const ssl = {
      ...goodSsl,
      expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    }
    const result = calculateSecurityScore(makeLayer3({ ssl }))

    expect(result.breakdown.certExpiry.score).toBe(10)
  })

  it('should score 5 when 7-29 days remaining', () => {
    const ssl = {
      ...goodSsl,
      expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    }
    const result = calculateSecurityScore(makeLayer3({ ssl }))

    expect(result.breakdown.certExpiry.score).toBe(5)
  })

  it('should score 2 when 0-6 days remaining', () => {
    const ssl = {
      ...goodSsl,
      expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    }
    const result = calculateSecurityScore(makeLayer3({ ssl }))

    expect(result.breakdown.certExpiry.score).toBe(2)
  })

  it('should score 0 when expired', () => {
    const ssl = {
      ...goodSsl,
      expires_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    }
    const result = calculateSecurityScore(makeLayer3({ ssl }))

    expect(result.breakdown.certExpiry.score).toBe(0)
    expect(result.breakdown.certExpiry.daysRemaining).toBeLessThan(0)
  })

  it('should score 0 when expires_at is null', () => {
    const ssl = { ...goodSsl, expires_at: null }
    const result = calculateSecurityScore(makeLayer3({ ssl }))

    expect(result.breakdown.certExpiry.score).toBe(0)
    expect(result.breakdown.certExpiry.daysRemaining).toBeNull()
  })

  it('should score 0 when expires_at is invalid date', () => {
    const ssl = { ...goodSsl, expires_at: 'not-a-date' }
    const result = calculateSecurityScore(makeLayer3({ ssl }))

    expect(result.breakdown.certExpiry.score).toBe(0)
    expect(result.breakdown.certExpiry.daysRemaining).toBeNull()
  })
})

// ─── 보안 헤더 점수 ───

describe('calculateSecurityScore — security headers scoring', () => {
  it('should normalize observatory score to 30pt max', () => {
    const observatory = { grade: 'A+', score: 115, issues: [] }
    const result = calculateSecurityScore(makeLayer3({ observatory }))

    // 115/100*30 = 34.5 → capped at 30
    expect(result.breakdown.securityHeaders.score).toBe(30)
    expect(result.breakdown.securityHeaders.maxScore).toBe(30)
  })

  it('should handle observatory score of 100 as 30', () => {
    const observatory = { grade: 'A', score: 100, issues: [] }
    const result = calculateSecurityScore(makeLayer3({ observatory }))

    expect(result.breakdown.securityHeaders.score).toBe(30)
  })

  it('should handle observatory score of 50 as 15', () => {
    const observatory = { grade: 'C', score: 50, issues: ['no-csp'] }
    const result = calculateSecurityScore(makeLayer3({ observatory }))

    expect(result.breakdown.securityHeaders.score).toBe(15)
    expect(result.breakdown.securityHeaders.issues).toEqual(['no-csp'])
  })

  it('should handle observatory score of 0 as 0', () => {
    const observatory = { grade: 'F', score: 0, issues: ['all-bad'] }
    const result = calculateSecurityScore(makeLayer3({ observatory }))

    expect(result.breakdown.securityHeaders.score).toBe(0)
  })

  it('should handle null observatory as 0', () => {
    const result = calculateSecurityScore(
      makeLayer3({ ssl: goodSsl, observatory: null })
    )

    expect(result.breakdown.securityHeaders.score).toBe(0)
  })

  it('should handle null observatory score as 0', () => {
    const observatory = { grade: null, score: null, issues: [] }
    const result = calculateSecurityScore(makeLayer3({ observatory }))

    expect(result.breakdown.securityHeaders.score).toBe(0)
  })
})

// ─── 종합 점수 정합성 ───

describe('calculateSecurityScore — overall consistency', () => {
  it('should sum all category scores', () => {
    const result = calculateSecurityScore(
      makeLayer3({ ssl: goodSsl, observatory: goodObservatory })
    )

    const sum =
      result.breakdown.sslGrade.score +
      result.breakdown.sslProtocol.score +
      result.breakdown.certExpiry.score +
      result.breakdown.securityHeaders.score

    expect(result.overall).toBe(sum)
  })

  it('should produce overall between 0 and 100', () => {
    const scenarios: Layer3Data[] = [
      makeLayer3({ ssl: goodSsl, observatory: goodObservatory }),
      makeLayer3({ ssl: poorSsl, observatory: poorObservatory }),
      makeLayer3({ ssl: goodSsl }),
      makeLayer3({ observatory: goodObservatory }),
    ]

    for (const layer3 of scenarios) {
      const result = calculateSecurityScore(layer3)
      expect(result.overall).toBeGreaterThanOrEqual(0)
      expect(result.overall).toBeLessThanOrEqual(100)
    }
  })

  it('should have maxScore sum to 100', () => {
    const result = calculateSecurityScore(
      makeLayer3({ ssl: goodSsl, observatory: goodObservatory })
    )

    const maxSum =
      result.breakdown.sslGrade.maxScore +
      result.breakdown.sslProtocol.maxScore +
      result.breakdown.certExpiry.maxScore +
      result.breakdown.securityHeaders.maxScore

    expect(maxSum).toBe(100)
  })
})
