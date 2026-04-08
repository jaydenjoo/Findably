import { resolve4, resolve6 } from 'node:dns/promises'

/** DNS 조회 타임아웃 (ms) */
const DNS_TIMEOUT_MS = 2_000

/**
 * 호스트명 DNS 해석 가능 여부 확인 (A + AAAA 레코드 병렬 조회)
 *
 * apex 도메인(example.com) 중에는 A 레코드 없이 www.example.com만 존재하는
 * 케이스가 있어 크롤링 실패. 이 유틸로 사전에 DNS 조회해서 www 폴백을 결정한다.
 *
 * - A/AAAA 중 하나라도 성공하면 true
 * - ENOTFOUND, ENODATA, 타임아웃 등은 모두 false (예외 throw 없음)
 * - 타임아웃은 2초 고정 (외부 DNS 조회 지연 방지)
 *
 * @param hostname 호스트명 (예: "example.com", "www.example.com")
 * @returns DNS 해석 성공 여부
 */
export async function resolveHostname(hostname: string): Promise<boolean> {
  if (!hostname || typeof hostname !== 'string') return false

  const timeoutPromise = new Promise<false>((resolve) => {
    setTimeout(() => resolve(false), DNS_TIMEOUT_MS)
  })

  const resolvePromise = (async (): Promise<boolean> => {
    try {
      const [v4Result, v6Result] = await Promise.allSettled([
        resolve4(hostname),
        resolve6(hostname),
      ])

      const v4Ok = v4Result.status === 'fulfilled' && v4Result.value.length > 0
      const v6Ok = v6Result.status === 'fulfilled' && v6Result.value.length > 0

      return v4Ok || v6Ok
    } catch {
      return false
    }
  })()

  return Promise.race([resolvePromise, timeoutPromise])
}

/**
 * apex 도메인 → www 폴백 결정
 *
 * 입력 URL의 hostname이 DNS 해석 안 되면 www 버전 시도.
 * 성공 시 www URL 반환, 실패 시 null.
 *
 * @param url 원본 URL
 * @returns 폴백 결과: { url: 교체된 URL, fallback: 'www' | 'none' } | null(둘 다 실패)
 */
export async function resolveWithWwwFallback(
  url: string
): Promise<{ url: string; fallback: 'none' | 'www' } | null> {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  const originalHost = parsed.hostname

  // 1차: 원본 호스트명 조회
  if (await resolveHostname(originalHost)) {
    return { url, fallback: 'none' }
  }

  // 2차: www 없는 경우만 www 폴백 시도
  if (originalHost.startsWith('www.')) {
    return null
  }

  const wwwHost = `www.${originalHost}`
  if (await resolveHostname(wwwHost)) {
    const wwwUrl = new URL(url)
    wwwUrl.hostname = wwwHost
    return { url: wwwUrl.toString(), fallback: 'www' }
  }

  return null
}
