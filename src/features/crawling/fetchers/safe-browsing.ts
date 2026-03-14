import { crawlingConfig } from '@/config/crawling'
import type { Layer2Data } from '../types'

type SafeBrowsingData = NonNullable<Layer2Data['safe_browsing']>

/** Safe Browsing API 타임아웃 (ms) — 단순 DB 조회라 빠름 */
const SAFE_BROWSING_TIMEOUT_MS = 10_000

/** Google Safe Browsing v4 Lookup API 엔드포인트 */
const SAFE_BROWSING_API_URL =
  'https://safebrowsing.googleapis.com/v4/threatMatches:find'

/** 검사할 위협 유형 */
const THREAT_TYPES = [
  'MALWARE',
  'SOCIAL_ENGINEERING',
  'UNWANTED_SOFTWARE',
  'POTENTIALLY_HARMFUL_APPLICATION',
] as const

/**
 * Google Safe Browsing API를 호출하여 URL의 악성/피싱/유해 여부를 검사.
 *
 * @param url - 검사할 URL
 * @returns SafeBrowsingData | null (API 키 미설정, 에러, 타임아웃 시 null)
 */
export async function fetchSafeBrowsing(
  url: string
): Promise<SafeBrowsingData | null> {
  const apiKey = crawlingConfig.googleApiKey
  if (!apiKey) {
    return null
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), SAFE_BROWSING_TIMEOUT_MS)

  try {
    const response = await fetch(`${SAFE_BROWSING_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client: {
          clientId: 'findably',
          clientVersion: '1.0',
        },
        threatInfo: {
          threatTypes: [...THREAT_TYPES],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }],
        },
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      console.error(`[fetchSafeBrowsing] HTTP ${response.status} for ${url}`)
      return null
    }

    const json: unknown = await response.json()
    return parseSafeBrowsingResponse(json)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error(
        `[fetchSafeBrowsing] Timeout after ${SAFE_BROWSING_TIMEOUT_MS}ms for ${url}`
      )
    } else {
      console.error('[fetchSafeBrowsing]', error)
    }
    return null
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Safe Browsing API 응답 JSON에서 위협 정보를 추출.
 *
 * 응답 본문이 빈 객체 `{}` 이면 안전 → is_safe: true
 * matches 배열이 있으면 위협 존재 → is_safe: false + 위협 유형 목록
 */
function parseSafeBrowsingResponse(json: unknown): SafeBrowsingData {
  if (typeof json !== 'object' || json === null) {
    return { is_safe: true, threats: [] }
  }

  const root = json as Record<string, unknown>
  const matches = root['matches']

  // matches가 없거나 빈 배열이면 안전
  if (!Array.isArray(matches) || matches.length === 0) {
    return { is_safe: true, threats: [] }
  }

  // 위협 유형을 중복 없이 추출
  const threatSet = new Set<string>()
  for (const match of matches) {
    if (typeof match === 'object' && match !== null) {
      const m = match as Record<string, unknown>
      const threatType = m['threatType']
      if (typeof threatType === 'string') {
        threatSet.add(threatType)
      }
    }
  }

  return {
    is_safe: false,
    threats: [...threatSet],
  }
}
