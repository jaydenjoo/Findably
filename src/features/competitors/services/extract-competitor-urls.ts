import type { CompetitorAnalysis } from '@/features/diagnosis-paid'
import type { ExtractResult, CompetitorUrlSource } from '../types'
import { MAX_COMPETITORS } from '../constants'

/**
 * AI agent 결과 + 사용자 입력에서 유효한 경쟁사 URL 추출.
 * 최대 MAX_COMPETITORS(3)개, 원본 URL 중복 제거.
 */
export function extractCompetitorUrls(params: {
  aiCompetitors: CompetitorAnalysis[]
  userCompetitorUrls?: string[]
  originalUrl: string
}): ExtractResult {
  const { aiCompetitors, userCompetitorUrls = [], originalUrl } = params

  const seen = new Set<string>()
  const urls: string[] = []
  const sources: CompetitorUrlSource[] = []

  // 원본 URL 호스트네임 (중복 제거용)
  const originalHost = parseHostname(originalUrl)

  // 1. 사용자 입력 URL 우선 (사용자 의도 존중)
  for (const raw of userCompetitorUrls) {
    const normalized = normalizeUrl(raw)
    if (!normalized) continue

    const host = parseHostname(normalized)
    if (!host || host === originalHost) continue
    if (seen.has(host)) continue

    seen.add(host)
    urls.push(normalized)
    sources.push('user_input')

    if (urls.length >= MAX_COMPETITORS) break
  }

  // 2. AI agent 결과에서 URL 추출
  if (urls.length < MAX_COMPETITORS) {
    for (const competitor of aiCompetitors) {
      if (urls.length >= MAX_COMPETITORS) break

      const normalized = normalizeUrl(competitor.url)
      if (!normalized) continue

      const host = parseHostname(normalized)
      if (!host || host === originalHost) continue
      if (seen.has(host)) continue

      seen.add(host)
      urls.push(normalized)
      sources.push('ai_agent')
    }
  }

  return { urls, sources }
}

/** URL 파싱 후 호스트네임 추출 (실패 시 null) */
function parseHostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

/** URL 정규화 — http:// 없으면 https:// 접두사 추가 */
function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`

  try {
    const parsed = new URL(withProtocol)
    // 최소 유효성: 호스트네임에 점(.) 포함
    if (!parsed.hostname.includes('.')) return null
    return parsed.origin
  } catch {
    return null
  }
}
