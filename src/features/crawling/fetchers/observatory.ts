import type { Layer3Data } from '../types'

type ObservatoryData = NonNullable<Layer3Data['observatory']>

/** Observatory API 타임아웃 (ms) */
const OBSERVATORY_TIMEOUT_MS = 15_000

/** Mozilla HTTP Observatory API v2 엔드포인트 (2026년 MDN으로 이전) */
const OBSERVATORY_API_URL = 'https://observatory-api.mdn.mozilla.net/api/v2'

/**
 * Mozilla Observatory API v2를 호출하여 보안 헤더 점수를 조회.
 *
 * v1 API(`http-observatory.security.mozilla.org`)는 2026년 초 서비스 종료(502).
 * v2 API(`observatory-api.mdn.mozilla.net`)로 이전됨.
 *
 * v2는 단일 POST 요청으로 grade + score + 실패 수를 반환.
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
    // v2 API: 단일 POST 요청으로 스캔 + 결과 반환
    const response = await fetch(
      `${OBSERVATORY_API_URL}/scan?host=${encodeURIComponent(host)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host }),
        signal: controller.signal,
      }
    )

    if (!response.ok) {
      console.error(`[fetchObservatory] HTTP ${response.status} for ${host}`)
      return null
    }

    const json: unknown = await response.json()
    return parseV2Response(json)
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

/**
 * v2 API 응답 파싱.
 *
 * 응답 예시:
 * {
 *   "id": 90218733,
 *   "grade": "D",
 *   "score": 30,
 *   "status_code": 200,
 *   "tests_failed": 4,
 *   "tests_passed": 6,
 *   "tests_quantity": 10,
 *   "error": null
 * }
 */
function parseV2Response(json: unknown): ObservatoryData | null {
  if (typeof json !== 'object' || json === null) {
    return null
  }

  const scan = json as Record<string, unknown>

  // 에러 체크
  if (scan['error'] !== null && scan['error'] !== undefined) {
    console.error('[fetchObservatory] API error:', scan['error'])
    return null
  }

  const grade = typeof scan['grade'] === 'string' ? scan['grade'] : null
  const score = typeof scan['score'] === 'number' ? scan['score'] : null

  // 실패한 테스트 수 기반 issues 생성
  const testsFailed =
    typeof scan['tests_failed'] === 'number' ? scan['tests_failed'] : 0
  const testsPassed =
    typeof scan['tests_passed'] === 'number' ? scan['tests_passed'] : 0
  const issues: string[] = []

  if (testsFailed > 0) {
    issues.push(`${testsFailed}개 보안 테스트 실패 (${testsPassed}개 통과)`)
  }

  if (score !== null && score < 50) {
    issues.push('보안 헤더 점수가 50점 미만으로 개선이 필요합니다')
  }

  return { grade, score, issues }
}
