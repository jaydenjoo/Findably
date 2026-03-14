import { crawlingConfig } from '@/config/crawling'
import type { Layer2Data } from '../types'

type CruxData = NonNullable<Layer2Data['crux']>

/** CrUX API 타임아웃 (ms) — 캐시된 데이터 조회라 PageSpeed보다 빠름 */
const CRUX_TIMEOUT_MS = 15_000

/** CrUX API v1 엔드포인트 */
const CRUX_API_URL =
  'https://chromeuxreport.googleapis.com/v1/records:queryRecord'

/** CrUX에서 요청할 메트릭 목록 */
const CRUX_METRICS = [
  'largest_contentful_paint',
  'interaction_to_next_paint',
  'cumulative_layout_shift',
  'experimental_time_to_first_byte',
  'first_contentful_paint',
] as const

/**
 * CrUX API를 호출하여 실제 사용자 필드 데이터(Core Web Vitals p75)를 수집.
 *
 * @param url - 분석할 페이지 URL (origin 추출하여 사이트 전체 데이터 조회)
 * @returns CruxData | null (API 키 미설정, 데이터 없음, 에러 시 null)
 */
export async function fetchCrux(url: string): Promise<CruxData | null> {
  const apiKey = crawlingConfig.googleApiKey
  if (!apiKey) {
    return null
  }

  const origin = new URL(url).origin

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), CRUX_TIMEOUT_MS)

  try {
    const response = await fetch(`${CRUX_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin,
        metrics: [...CRUX_METRICS],
      }),
      signal: controller.signal,
    })

    // 404 = 트래픽 부족으로 데이터 없음 (정상 케이스)
    if (response.status === 404) {
      return null
    }

    if (!response.ok) {
      console.error(`[fetchCrux] HTTP ${response.status} for ${origin}`)
      return null
    }

    const json: unknown = await response.json()
    return parseCruxResponse(json)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error(
        `[fetchCrux] Timeout after ${CRUX_TIMEOUT_MS}ms for ${origin}`
      )
    } else {
      console.error('[fetchCrux]', error)
    }
    return null
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * CrUX API 응답 JSON에서 필요한 필드를 추출.
 * 핵심 p75 메트릭 하나라도 누락 시 null 반환.
 */
function parseCruxResponse(json: unknown): CruxData | null {
  if (typeof json !== 'object' || json === null) {
    return null
  }

  const root = json as Record<string, unknown>
  const record = root['record']
  if (typeof record !== 'object' || record === null) {
    return null
  }

  const rec = record as Record<string, unknown>
  const metrics = rec['metrics']
  if (typeof metrics !== 'object' || metrics === null) {
    return null
  }

  const metricsMap = metrics as Record<string, unknown>

  // ─── p75 값 추출 ───
  const lcpRaw = extractP75(metricsMap, 'largest_contentful_paint')
  const inpRaw = extractP75(metricsMap, 'interaction_to_next_paint')
  const clsRaw = extractP75(metricsMap, 'cumulative_layout_shift')
  const ttfbRaw = extractP75(metricsMap, 'experimental_time_to_first_byte')
  const fcpRaw = extractP75(metricsMap, 'first_contentful_paint')

  if (
    lcpRaw === null ||
    inpRaw === null ||
    clsRaw === null ||
    ttfbRaw === null ||
    fcpRaw === null
  ) {
    return null
  }

  // CLS는 문자열로 반환될 수 있음 → parseFloat 후 소수점 3자리
  const clsNum =
    typeof clsRaw === 'string' ? parseFloat(clsRaw) : Number(clsRaw)
  if (isNaN(clsNum)) {
    return null
  }

  // ─── form_factors 추출 ───
  const formFactors = extractFormFactors(rec)

  // ─── collection_period 추출 ───
  const collectionPeriod = extractCollectionPeriod(rec)
  if (!collectionPeriod) {
    return null
  }

  return {
    lcp_ms: Math.round(Number(lcpRaw)),
    inp_ms: Math.round(Number(inpRaw)),
    cls: Number(clsNum.toFixed(3)),
    ttfb_ms: Math.round(Number(ttfbRaw)),
    fcp_ms: Math.round(Number(fcpRaw)),
    form_factors: formFactors,
    collection_period: collectionPeriod,
  }
}

/** 메트릭에서 percentiles.p75 추출 */
function extractP75(
  metrics: Record<string, unknown>,
  metricName: string
): unknown {
  const metric = metrics[metricName]
  if (typeof metric !== 'object' || metric === null) {
    return null
  }

  const m = metric as Record<string, unknown>
  const percentiles = m['percentiles']
  if (typeof percentiles !== 'object' || percentiles === null) {
    return null
  }

  const p = percentiles as Record<string, unknown>
  const p75 = p['p75']
  if (p75 === undefined || p75 === null) {
    return null
  }

  return p75
}

/** record.key.formFactor 기반 기기 비율 추출 */
function extractFormFactors(
  record: Record<string, unknown>
): CruxData['form_factors'] {
  const key = record['key']
  if (typeof key !== 'object' || key === null) {
    return null
  }

  // CrUX origin 요청 시 form_factors는 별도 구조가 아닌,
  // record.metrics 내 각 메트릭의 fractions에서 파생.
  // 여기서는 간단히 null 처리하고, form_factor별 분리 조회는 스코프 외.
  return null
}

/** collectionPeriod에서 firstDate, lastDate 추출 */
function extractCollectionPeriod(
  record: Record<string, unknown>
): CruxData['collection_period'] | null {
  const cp = record['collectionPeriod']
  if (typeof cp !== 'object' || cp === null) {
    return null
  }

  const cpObj = cp as Record<string, unknown>

  const firstDate = cpObj['firstDate']
  const lastDate = cpObj['lastDate']

  if (typeof firstDate !== 'object' || firstDate === null) {
    return null
  }
  if (typeof lastDate !== 'object' || lastDate === null) {
    return null
  }

  const first = firstDate as Record<string, unknown>
  const last = lastDate as Record<string, unknown>

  const firstStr = formatCruxDate(first)
  const lastStr = formatCruxDate(last)

  if (!firstStr || !lastStr) {
    return null
  }

  return { first_date: firstStr, last_date: lastStr }
}

/** CrUX 날짜 객체 { year, month, day } → "YYYY-MM-DD" 문자열 */
function formatCruxDate(dateObj: Record<string, unknown>): string | null {
  const year = dateObj['year']
  const month = dateObj['month']
  const day = dateObj['day']

  if (
    typeof year !== 'number' ||
    typeof month !== 'number' ||
    typeof day !== 'number'
  ) {
    return null
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
