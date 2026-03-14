/** SSRF 차단 대상 호스트네임 (URL 파서가 반환하는 형태 기준: IPv6는 브라켓 포함) */
export const BLOCKED_HOSTNAMES = [
  'localhost',
  '0.0.0.0',
  '[::1]',
  'metadata.google.internal',
  '169.254.169.254',
] as const

/** URL 최대 길이 */
export const MAX_URL_LENGTH = 2048
