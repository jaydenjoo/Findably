import type { Layer2Data } from '@/features/crawling/types'
import { SCORING } from '@/config/scoring'
import type { PerformanceScore, VitalRating, VitalScore } from './types'

// ─── config/scoring에서 임계값·가중치 참조 (OST) ───

const THRESHOLDS = SCORING.WEB_VITALS_THRESHOLDS
const WEIGHTS = SCORING.PERFORMANCE_WEIGHTS

// ─── 등급 판정 ───

function rateVital(value: number, good: number, poor: number): VitalRating {
  if (value <= good) return 'good'
  if (value <= poor) return 'needs-improvement'
  return 'poor'
}

// ─── 점수 정규화 (선형 보간) ───

/**
 * 원시값을 0-100 점수로 변환.
 * good 이하 = 90-100, good~poor = 50-89, poor 초과 = 0-49
 */
function normalizeScore(value: number, good: number, poor: number): number {
  if (value <= 0) return 100
  if (value <= good) {
    // 0 → 100, good → 90
    return Math.round(90 + (1 - value / good) * 10)
  }
  if (value <= poor) {
    // good → 89, poor → 50
    const ratio = (value - good) / (poor - good)
    return Math.round(89 - ratio * 39)
  }
  // poor 초과: poor → 49, poor*2 → 0 (하한 0)
  const overshoot = (value - poor) / poor
  return Math.max(0, Math.round(49 - overshoot * 49))
}

// ─── 개별 메트릭 점수 산출 ───

function scoreVital(
  value: number | undefined | null,
  good: number,
  poor: number
): VitalScore | null {
  if (value == null || !Number.isFinite(value)) return null

  return {
    value,
    score: normalizeScore(value, good, poor),
    rating: rateVital(value, good, poor),
  }
}

// ─── 데이터 소스 판별 ───

function determineDataSource(
  layer2: Layer2Data | null
): PerformanceScore['dataSource'] {
  if (!layer2) return 'none'

  const hasPageSpeed = layer2.pagespeed !== null
  const hasCrux = layer2.crux !== null

  if (hasPageSpeed && hasCrux) return 'both'
  if (hasCrux) return 'crux'
  if (hasPageSpeed) return 'pagespeed'
  return 'none'
}

// ─── 메인 함수 ───

/**
 * Layer2Data에서 성능 종합 점수를 산출한다.
 *
 * CrUX(실제 사용자 데이터) 우선, 없으면 PageSpeed(합성 데이터) 폴백.
 * 양쪽 다 없으면 overall=0, dataSource='none'.
 *
 * @param layer2 - 크롤링 단계에서 이미 수집된 Layer2Data
 * @returns PerformanceScore
 */
export function calculatePerformanceScore(
  layer2: Layer2Data | null
): PerformanceScore {
  const dataSource = determineDataSource(layer2)

  if (dataSource === 'none' || !layer2) {
    return {
      overall: 0,
      breakdown: { lcp: null, cls: null, inp: null, ttfb: null, fcp: null },
      dataSource: 'none',
    }
  }

  const { pagespeed, crux } = layer2

  // CrUX 우선, PageSpeed 폴백
  const lcpMs = crux?.lcp_ms ?? pagespeed?.lcp_ms ?? null
  const clsValue = crux?.cls ?? pagespeed?.cls ?? null
  const inpMs = crux?.inp_ms ?? null // INP는 CrUX에서만 제공
  const ttfbMs = crux?.ttfb_ms ?? pagespeed?.ttfb_ms ?? null
  const fcpMs = crux?.fcp_ms ?? null // FCP는 CrUX에서만 제공

  const breakdown = {
    lcp: scoreVital(lcpMs, THRESHOLDS.lcp.good, THRESHOLDS.lcp.poor),
    cls: scoreVital(clsValue, THRESHOLDS.cls.good, THRESHOLDS.cls.poor),
    inp: scoreVital(inpMs, THRESHOLDS.inp.good, THRESHOLDS.inp.poor),
    ttfb: scoreVital(ttfbMs, THRESHOLDS.ttfb.good, THRESHOLDS.ttfb.poor),
    fcp: scoreVital(fcpMs, THRESHOLDS.fcp.good, THRESHOLDS.fcp.poor),
  }

  // 가중 평균 계산 (존재하는 메트릭만 참여)
  let weightedSum = 0
  let totalWeight = 0

  const entries: Array<[keyof typeof WEIGHTS, VitalScore | null]> = [
    ['lcp', breakdown.lcp],
    ['cls', breakdown.cls],
    ['inp', breakdown.inp],
    ['ttfb', breakdown.ttfb],
    ['fcp', breakdown.fcp],
  ]

  for (const [key, vital] of entries) {
    if (vital !== null) {
      weightedSum += vital.score * WEIGHTS[key]
      totalWeight += WEIGHTS[key]
    }
  }

  const overall = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0

  return { overall, breakdown, dataSource }
}
