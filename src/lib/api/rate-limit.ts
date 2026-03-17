/**
 * 인메모리 슬라이딩 윈도우 Rate Limiter
 *
 * 서버리스 환경(Vercel)에서는 인스턴스별 메모리이므로 완벽하지 않지만,
 * 단일 인스턴스 내 연속 요청은 방어 가능.
 * Phase 2에서 Redis(Upstash) 기반으로 교체 시 이 파일만 교체.
 */

interface RateLimitConfig {
  /** 슬라이딩 윈도우 크기 (ms) */
  windowMs: number
  /** 윈도우 내 최대 요청 수 */
  maxRequests: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterMs: number | null
}

const store = new Map<string, number[]>()
let lastCleanup = Date.now()
const CLEANUP_INTERVAL_MS = 60_000

/** 오래된 키를 주기적으로 정리 (메모리 누수 방지) */
function cleanupStale(): void {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now

  for (const [key, timestamps] of store) {
    const fresh = timestamps.filter((t) => t > now - 300_000)
    if (fresh.length === 0) {
      store.delete(key)
    } else {
      store.set(key, fresh)
    }
  }
}

/**
 * Rate limit 확인
 *
 * @param key - 식별 키 (예: `payment:${userId}`)
 * @param config - 윈도우 크기 + 최대 요청 수
 * @returns allowed=false면 요청 거부, retryAfterMs로 재시도 시점 안내
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanupStale()

  const now = Date.now()
  const windowStart = now - config.windowMs

  const timestamps = (store.get(key) ?? []).filter((t) => t > windowStart)

  if (timestamps.length >= config.maxRequests) {
    const oldestInWindow = timestamps[0] ?? now
    const retryAfterMs = Math.max(0, oldestInWindow + config.windowMs - now)
    store.set(key, timestamps)
    return { allowed: false, remaining: 0, retryAfterMs }
  }

  timestamps.push(now)
  store.set(key, timestamps)

  return {
    allowed: true,
    remaining: config.maxRequests - timestamps.length,
    retryAfterMs: null,
  }
}
