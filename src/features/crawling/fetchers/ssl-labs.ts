import type { Layer3Data } from '../types'

type SslData = NonNullable<Layer3Data['ssl']>

/** SSL Labs API 타임아웃 (ms) */
const SSL_LABS_TIMEOUT_MS = 15_000

/** SSL Labs API v3 엔드포인트 */
const SSL_LABS_API_URL = 'https://api.ssllabs.com/api/v3/analyze'

/** 캐시 최대 유효 시간 (시간) */
const CACHE_MAX_AGE_HOURS = 72

/**
 * SSL Labs API를 호출하여 SSL 인증서 등급 및 정보를 조회.
 *
 * 전략: 캐시 먼저 → 없으면 새 스캔 시작 → 최대 3회 폴링
 *
 * @param url - 분석할 URL
 * @returns SslData | null
 */
export async function fetchSslLabs(url: string): Promise<SslData | null> {
  const host = extractHost(url)
  if (!host) {
    return null
  }

  // 1차: 캐시 조회
  const cached = await fetchSslLabsOnce(host, {
    fromCache: 'on',
    maxAge: String(CACHE_MAX_AGE_HOURS),
  })
  if (cached) return cached

  // 2차: 새 스캔 시작 + 폴링 (최대 3회, 10초 간격)
  await fetchSslLabsOnce(host, { startNew: 'on' })

  for (let attempt = 1; attempt <= 3; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 10_000))
    const result = await fetchSslLabsOnce(host, { fromCache: 'off' })
    if (result) return result
  }

  return null
}

/** 단일 SSL Labs 요청 */
async function fetchSslLabsOnce(
  host: string,
  extraParams: Record<string, string>
): Promise<SslData | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), SSL_LABS_TIMEOUT_MS)

  try {
    const params = new URLSearchParams({ host, ...extraParams })
    const response = await fetch(`${SSL_LABS_API_URL}?${params.toString()}`, {
      method: 'GET',
      signal: controller.signal,
    })

    if (!response.ok) return null

    const json: unknown = await response.json()
    return parseSslLabsResponse(json)
  } catch {
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
 * SSL Labs 응답 JSON 파싱.
 * status=READY인 캐시 결과만 사용, 나머지는 null.
 */
function parseSslLabsResponse(json: unknown): SslData | null {
  if (typeof json !== 'object' || json === null) {
    return null
  }

  const root = json as Record<string, unknown>

  // 캐시된 완료 결과만 사용
  if (root['status'] !== 'READY') {
    return null
  }

  const grade = extractGrade(root)
  const certInfo = extractCertInfo(root)

  return {
    grade,
    valid: certInfo.valid,
    expires_at: certInfo.expires_at,
    issuer: certInfo.issuer,
    protocols: extractProtocols(root),
  }
}

/** endpoints[0].grade 추출 */
function extractGrade(root: Record<string, unknown>): string | null {
  const endpoints = root['endpoints']
  if (!Array.isArray(endpoints) || endpoints.length === 0) {
    return null
  }

  const first: unknown = endpoints[0]
  if (typeof first !== 'object' || first === null) {
    return null
  }

  const ep = first as Record<string, unknown>
  const grade = ep['grade']
  return typeof grade === 'string' ? grade : null
}

/** certs[0]에서 인증서 정보 추출 */
function extractCertInfo(root: Record<string, unknown>): {
  valid: boolean
  expires_at: string | null
  issuer: string | null
} {
  const certs = root['certs']
  if (!Array.isArray(certs) || certs.length === 0) {
    return { valid: false, expires_at: null, issuer: null }
  }

  const cert: unknown = certs[0]
  if (typeof cert !== 'object' || cert === null) {
    return { valid: false, expires_at: null, issuer: null }
  }

  const c = cert as Record<string, unknown>

  // notAfter → expires_at (ISO 문자열) + valid 여부
  const notAfter = c['notAfter']
  let expiresAt: string | null = null
  let valid = false

  if (typeof notAfter === 'number') {
    expiresAt = new Date(notAfter).toISOString()
    valid = notAfter > Date.now()
  }

  // issuerLabel 우선, 없으면 issuerSubject 사용
  const issuerLabel = c['issuerLabel']
  const issuerSubject = c['issuerSubject']
  let issuer: string | null = null

  if (typeof issuerLabel === 'string' && issuerLabel.length > 0) {
    issuer = issuerLabel
  } else if (typeof issuerSubject === 'string' && issuerSubject.length > 0) {
    issuer = issuerSubject
  }

  return { valid, expires_at: expiresAt, issuer }
}

/** endpoints[0].details.protocols에서 TLS 프로토콜 버전명 추출 */
function extractProtocols(root: Record<string, unknown>): string[] {
  const endpoints = root['endpoints']
  if (!Array.isArray(endpoints) || endpoints.length === 0) {
    return []
  }

  const ep = endpoints[0]
  if (typeof ep !== 'object' || ep === null) {
    return []
  }

  const details = (ep as Record<string, unknown>)['details']
  if (typeof details !== 'object' || details === null) {
    return []
  }

  const protocols = (details as Record<string, unknown>)['protocols']
  if (!Array.isArray(protocols)) {
    return []
  }

  return protocols
    .filter(
      (p): p is Record<string, unknown> => typeof p === 'object' && p !== null
    )
    .flatMap((p) => {
      const name = p['name']
      const version = p['version']
      return typeof name === 'string' && typeof version === 'string'
        ? [`${name} ${version}`]
        : []
    })
}
