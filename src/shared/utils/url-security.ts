import { BLOCKED_HOSTNAMES, MAX_URL_LENGTH } from '../constants/url-validation'

export interface UrlValidationResult {
  valid: boolean
  error?: string
}

/** URL 보안 검증 (SSRF 방지 — IPv4 + IPv6) */
export function validateUrlSecurity(url: string): UrlValidationResult {
  // 1. 길이 제한
  if (url.length > MAX_URL_LENGTH) {
    return { valid: false, error: `URL은 ${MAX_URL_LENGTH}자 이내여야 합니다` }
  }

  // 2. URL 파싱
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { valid: false, error: '올바른 URL 형식이 아닙니다' }
  }

  // 3. 프로토콜 검증
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'http:// 또는 https://만 지원합니다' }
  }

  // 4. 호스트네임 블록리스트
  const hostname = parsed.hostname.toLowerCase()
  if (
    BLOCKED_HOSTNAMES.includes(hostname as (typeof BLOCKED_HOSTNAMES)[number])
  ) {
    return { valid: false, error: '내부 네트워크 주소는 사용할 수 없습니다' }
  }

  // 5. 사설 IP 차단 (IPv4 + IPv6)
  if (isPrivateIpv4(hostname) || isPrivateIpv6(hostname)) {
    return { valid: false, error: '비공개 IP 주소는 사용할 수 없습니다' }
  }

  return { valid: true }
}

/** IPv4가 private 범위인지 확인 */
function isPrivateIpv4(hostname: string): boolean {
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
  const match = hostname.match(ipv4Regex)
  if (!match) return false

  const a = Number(match[1])
  const b = Number(match[2])

  // 127.x.x.x (loopback), 10.x.x.x (Class A), 0.x.x.x (current network)
  if (a === 127 || a === 10 || a === 0) return true
  // 172.16.0.0 – 172.31.255.255 (Class B)
  if (a === 172 && b >= 16 && b <= 31) return true
  // 192.168.x.x (Class C)
  if (a === 192 && b === 168) return true
  // 169.254.x.x (link-local)
  if (a === 169 && b === 254) return true

  return false
}

/** IPv6가 private 범위인지 확인 (URL 파서는 [bracket] 포함 반환) */
function isPrivateIpv6(hostname: string): boolean {
  // URL 파서는 IPv6를 [addr] 형태로 반환
  if (!hostname.startsWith('[') || !hostname.endsWith(']')) return false

  const addr = hostname.slice(1, -1).toLowerCase()

  // ::1 (loopback)
  if (addr === '::1' || addr === '0:0:0:0:0:0:0:1') return true

  // fe80::/10 (link-local)
  if (addr.startsWith('fe80')) return true

  // fc00::/7 (unique local: fc00:: – fdff::)
  const firstTwo = addr.slice(0, 2)
  if (firstTwo === 'fc' || firstTwo === 'fd') return true

  // ::ffff:X:X (IPv4-mapped IPv6 — URL 파서가 hex로 변환: e.g. ::ffff:7f00:1)
  const mappedHexMatch = addr.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/)
  if (mappedHexMatch?.[1] && mappedHexMatch[2]) {
    const hi = parseInt(mappedHexMatch[1], 16)
    const lo = parseInt(mappedHexMatch[2], 16)
    const a = (hi >> 8) & 0xff
    const b = hi & 0xff
    const c = (lo >> 8) & 0xff
    const d = lo & 0xff
    return isPrivateIpv4(`${a}.${b}.${c}.${d}`)
  }

  // ::ffff:a.b.c.d (IPv4-mapped, dotted notation — 일부 파서)
  const mappedDotMatch = addr.match(
    /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/
  )
  if (mappedDotMatch?.[1] && isPrivateIpv4(mappedDotMatch[1])) return true

  return false
}
