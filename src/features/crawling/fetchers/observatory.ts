import type { Layer3Data } from '../types'

type ObservatoryData = NonNullable<Layer3Data['observatory']>

/** Observatory API 타임아웃 (ms) */
const OBSERVATORY_TIMEOUT_MS = 15_000

/** Mozilla HTTP Observatory API v1 엔드포인트 */
const OBSERVATORY_API_URL =
  'https://http-observatory.security.mozilla.org/api/v1'

/**
 * Mozilla Observatory API를 호출하여 보안 헤더 점수를 조회.
 *
 * 1. POST /analyze — 스캔 시작/캐시 조회
 * 2. GET /getScanResults — 실패한 테스트 항목 (issues) 추출
 *
 * @param url - 분석할 URL
 * @returns ObservatoryData | null
 */
export async function fetchObservatory(
  url: string
): Promise<ObservatoryData | null> {
  const host = extractHost(url)
  if (!host) {
    return null
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), OBSERVATORY_TIMEOUT_MS)

  try {
    // 1단계: 스캔 요청/캐시 조회
    const analyzeRes = await fetch(
      `${OBSERVATORY_API_URL}/analyze?host=${encodeURIComponent(host)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'hidden=true&rescan=false',
        signal: controller.signal,
      }
    )

    if (!analyzeRes.ok) {
      console.error(`[fetchObservatory] HTTP ${analyzeRes.status} for ${host}`)
      return null
    }

    const analyzeJson: unknown = await analyzeRes.json()
    const scanResult = parseScanResponse(analyzeJson)
    if (!scanResult) {
      return null
    }

    // 2단계: 상세 테스트 결과에서 실패 항목 추출
    const issues = await fetchScanIssues(scanResult.scanId, controller.signal)

    return {
      grade: scanResult.grade,
      score: scanResult.score,
      issues,
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error(
        `[fetchObservatory] Timeout after ${OBSERVATORY_TIMEOUT_MS}ms for ${host}`
      )
    } else {
      console.error('[fetchObservatory]', error)
    }
    return null
  } finally {
    clearTimeout(timeout)
  }
}

/** URL에서 hostname 추출 */
function extractHost(url: string): string | null {
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

interface ScanResult {
  grade: string | null
  score: number | null
  scanId: number
}

/** analyze 응답 파싱 — state=FINISHED인 경우만 */
function parseScanResponse(json: unknown): ScanResult | null {
  if (typeof json !== 'object' || json === null) {
    return null
  }

  const scan = json as Record<string, unknown>

  // 완료된 스캔만 사용
  if (scan['state'] !== 'FINISHED') {
    return null
  }

  const scanId = scan['scan_id']
  if (typeof scanId !== 'number') {
    return null
  }

  const grade = typeof scan['grade'] === 'string' ? scan['grade'] : null
  const score = typeof scan['score'] === 'number' ? scan['score'] : null

  return { grade, score, scanId }
}

/**
 * getScanResults에서 실패한 테스트 이름 추출.
 * 실패 시 빈 배열 반환 (grade/score만으로도 유용).
 */
async function fetchScanIssues(
  scanId: number,
  signal: AbortSignal
): Promise<string[]> {
  try {
    const response = await fetch(
      `${OBSERVATORY_API_URL}/getScanResults?scan=${scanId}`,
      { signal }
    )

    if (!response.ok) {
      return []
    }

    const json: unknown = await response.json()
    return parseIssues(json)
  } catch {
    return []
  }
}

/** 테스트 결과에서 pass=false인 항목의 score_description 추출 */
function parseIssues(json: unknown): string[] {
  if (typeof json !== 'object' || json === null) {
    return []
  }

  const tests = json as Record<string, unknown>
  const issues: string[] = []

  for (const value of Object.values(tests)) {
    if (typeof value !== 'object' || value === null) {
      continue
    }

    const test = value as Record<string, unknown>
    if (test['pass'] === false) {
      const desc = test['score_description']
      if (typeof desc === 'string' && desc.length > 0) {
        issues.push(desc)
      }
    }
  }

  return issues
}
