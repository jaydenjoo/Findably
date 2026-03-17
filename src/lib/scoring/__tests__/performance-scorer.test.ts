import { describe, it, expect } from 'vitest'
import { calculatePerformanceScore } from '../performance-scorer'
import type { Layer2Data } from '@/features/crawling/types'

// ─── 헬퍼 ───

function makeLayer2(overrides: Partial<Layer2Data> = {}): Layer2Data {
  return {
    pagespeed: null,
    crux: null,
    safe_browsing: null,
    ...overrides,
  }
}

const goodPageSpeed = {
  performance_score: 95,
  lcp_ms: 1200,
  fid_ms: 50,
  cls: 0.05,
  ttfb_ms: 400,
}

const goodCrux = {
  lcp_ms: 1500,
  inp_ms: 100,
  cls: 0.08,
  ttfb_ms: 500,
  fcp_ms: 1200,
  form_factors: { phone: 0.6, desktop: 0.35, tablet: 0.05 },
  collection_period: { first_date: '2026-02-15', last_date: '2026-03-14' },
}

const poorPageSpeed = {
  performance_score: 30,
  lcp_ms: 6000,
  fid_ms: 400,
  cls: 0.35,
  ttfb_ms: 3000,
}

const poorCrux = {
  lcp_ms: 5500,
  inp_ms: 700,
  cls: 0.4,
  ttfb_ms: 2500,
  fcp_ms: 4000,
  form_factors: null,
  collection_period: { first_date: '2026-02-15', last_date: '2026-03-14' },
}

// ─── null / none 처리 ───

describe('calculatePerformanceScore — null 처리', () => {
  it('should return 0 score with none source when layer2 is null', () => {
    const result = calculatePerformanceScore(null)

    expect(result.overall).toBe(0)
    expect(result.dataSource).toBe('none')
    expect(result.breakdown.lcp).toBeNull()
    expect(result.breakdown.cls).toBeNull()
    expect(result.breakdown.inp).toBeNull()
    expect(result.breakdown.ttfb).toBeNull()
    expect(result.breakdown.fcp).toBeNull()
  })

  it('should return 0 score when all Layer2 fields are null', () => {
    const result = calculatePerformanceScore(makeLayer2())

    expect(result.overall).toBe(0)
    expect(result.dataSource).toBe('none')
  })
})

// ─── dataSource 판별 ───

describe('calculatePerformanceScore — dataSource', () => {
  it('should return pagespeed when only pagespeed exists', () => {
    const result = calculatePerformanceScore(
      makeLayer2({ pagespeed: goodPageSpeed })
    )
    expect(result.dataSource).toBe('pagespeed')
  })

  it('should return crux when only crux exists', () => {
    const result = calculatePerformanceScore(makeLayer2({ crux: goodCrux }))
    expect(result.dataSource).toBe('crux')
  })

  it('should return both when pagespeed and crux both exist', () => {
    const result = calculatePerformanceScore(
      makeLayer2({ pagespeed: goodPageSpeed, crux: goodCrux })
    )
    expect(result.dataSource).toBe('both')
  })
})

// ─── good 등급 ───

describe('calculatePerformanceScore — good metrics', () => {
  it('should score high with good CrUX data', () => {
    const result = calculatePerformanceScore(makeLayer2({ crux: goodCrux }))

    expect(result.overall).toBeGreaterThanOrEqual(85)
    expect(result.breakdown.lcp?.rating).toBe('good')
    expect(result.breakdown.cls?.rating).toBe('good')
    expect(result.breakdown.inp?.rating).toBe('good')
    expect(result.breakdown.ttfb?.rating).toBe('good')
    expect(result.breakdown.fcp?.rating).toBe('good')
  })

  it('should score high with good PageSpeed data', () => {
    const result = calculatePerformanceScore(
      makeLayer2({ pagespeed: goodPageSpeed })
    )

    expect(result.overall).toBeGreaterThanOrEqual(85)
    expect(result.breakdown.lcp?.rating).toBe('good')
    expect(result.breakdown.cls?.rating).toBe('good')
    expect(result.breakdown.ttfb?.rating).toBe('good')
    // INP, FCP: PageSpeed에서 제공하지 않아 null
    expect(result.breakdown.inp).toBeNull()
    expect(result.breakdown.fcp).toBeNull()
  })
})

// ─── poor 등급 ───

describe('calculatePerformanceScore — poor metrics', () => {
  it('should score low with poor CrUX data', () => {
    const result = calculatePerformanceScore(makeLayer2({ crux: poorCrux }))

    expect(result.overall).toBeLessThanOrEqual(40)
    expect(result.breakdown.lcp?.rating).toBe('poor')
    expect(result.breakdown.cls?.rating).toBe('poor')
    expect(result.breakdown.inp?.rating).toBe('poor')
  })

  it('should score low with poor PageSpeed data', () => {
    const result = calculatePerformanceScore(
      makeLayer2({ pagespeed: poorPageSpeed })
    )

    expect(result.overall).toBeLessThanOrEqual(40)
    expect(result.breakdown.lcp?.rating).toBe('poor')
    expect(result.breakdown.cls?.rating).toBe('poor')
  })
})

// ─── CrUX 우선순위 ───

describe('calculatePerformanceScore — CrUX priority', () => {
  it('should use CrUX values over PageSpeed when both exist', () => {
    const result = calculatePerformanceScore(
      makeLayer2({ pagespeed: goodPageSpeed, crux: poorCrux })
    )

    // CrUX의 poor 값이 적용되어야 함
    expect(result.breakdown.lcp?.value).toBe(poorCrux.lcp_ms)
    expect(result.breakdown.cls?.value).toBe(poorCrux.cls)
    expect(result.breakdown.ttfb?.value).toBe(poorCrux.ttfb_ms)
  })

  it('should fallback to PageSpeed for LCP when CrUX is null', () => {
    const result = calculatePerformanceScore(
      makeLayer2({ pagespeed: goodPageSpeed })
    )

    expect(result.breakdown.lcp?.value).toBe(goodPageSpeed.lcp_ms)
  })
})

// ─── 경계값 테스트 ───

describe('calculatePerformanceScore — boundary values', () => {
  it('should rate LCP exactly at good threshold as good', () => {
    const crux = { ...goodCrux, lcp_ms: 2500 }
    const result = calculatePerformanceScore(makeLayer2({ crux }))

    expect(result.breakdown.lcp?.rating).toBe('good')
    expect(result.breakdown.lcp?.score).toBe(90)
  })

  it('should rate LCP just above good threshold as needs-improvement', () => {
    const crux = { ...goodCrux, lcp_ms: 2501 }
    const result = calculatePerformanceScore(makeLayer2({ crux }))

    expect(result.breakdown.lcp?.rating).toBe('needs-improvement')
  })

  it('should rate CLS exactly at poor threshold as needs-improvement', () => {
    const crux = { ...goodCrux, cls: 0.25 }
    const result = calculatePerformanceScore(makeLayer2({ crux }))

    expect(result.breakdown.cls?.rating).toBe('needs-improvement')
  })

  it('should rate CLS just above poor threshold as poor', () => {
    const crux = { ...goodCrux, cls: 0.251 }
    const result = calculatePerformanceScore(makeLayer2({ crux }))

    expect(result.breakdown.cls?.rating).toBe('poor')
  })

  it('should rate INP exactly at 200ms as good', () => {
    const crux = { ...goodCrux, inp_ms: 200 }
    const result = calculatePerformanceScore(makeLayer2({ crux }))

    expect(result.breakdown.inp?.rating).toBe('good')
  })

  it('should rate TTFB at 800ms as good', () => {
    const crux = { ...goodCrux, ttfb_ms: 800 }
    const result = calculatePerformanceScore(makeLayer2({ crux }))

    expect(result.breakdown.ttfb?.rating).toBe('good')
  })

  it('should handle value of 0 as perfect score', () => {
    const crux = { ...goodCrux, lcp_ms: 0 }
    const result = calculatePerformanceScore(makeLayer2({ crux }))

    expect(result.breakdown.lcp?.score).toBe(100)
    expect(result.breakdown.lcp?.rating).toBe('good')
  })
})

// ─── needs-improvement 등급 ───

describe('calculatePerformanceScore — needs-improvement', () => {
  it('should rate midrange values as needs-improvement', () => {
    const crux = {
      ...goodCrux,
      lcp_ms: 3200,
      cls: 0.18,
      inp_ms: 350,
      ttfb_ms: 1200,
      fcp_ms: 2400,
    }
    const result = calculatePerformanceScore(makeLayer2({ crux }))

    expect(result.breakdown.lcp?.rating).toBe('needs-improvement')
    expect(result.breakdown.cls?.rating).toBe('needs-improvement')
    expect(result.breakdown.inp?.rating).toBe('needs-improvement')
    expect(result.breakdown.ttfb?.rating).toBe('needs-improvement')
    expect(result.breakdown.fcp?.rating).toBe('needs-improvement')
    expect(result.overall).toBeGreaterThan(40)
    expect(result.overall).toBeLessThan(90)
  })
})

// ─── 가중 평균 정합성 ───

describe('calculatePerformanceScore — weighted average', () => {
  it('should weight LCP highest (30%)', () => {
    // LCP만 poor, 나머지 good → overall 감소폭이 큼
    const cruxBadLcp = { ...goodCrux, lcp_ms: 6000 }
    const cruxBadFcp = { ...goodCrux, fcp_ms: 4000 }

    const resultBadLcp = calculatePerformanceScore(
      makeLayer2({ crux: cruxBadLcp })
    )
    const resultBadFcp = calculatePerformanceScore(
      makeLayer2({ crux: cruxBadFcp })
    )

    // LCP(30%) poor가 FCP(10%) poor보다 overall에 더 큰 영향
    expect(resultBadLcp.overall).toBeLessThan(resultBadFcp.overall)
  })

  it('should produce overall between 0 and 100', () => {
    const scenarios: Layer2Data[] = [
      makeLayer2({ crux: goodCrux }),
      makeLayer2({ crux: poorCrux }),
      makeLayer2({ pagespeed: goodPageSpeed }),
      makeLayer2({ pagespeed: poorPageSpeed }),
      makeLayer2({ pagespeed: goodPageSpeed, crux: poorCrux }),
    ]

    for (const layer2 of scenarios) {
      const result = calculatePerformanceScore(layer2)
      expect(result.overall).toBeGreaterThanOrEqual(0)
      expect(result.overall).toBeLessThanOrEqual(100)
    }
  })
})
