import { DIAGNOSIS_PAID_CONFIG } from '@/config/diagnosis-paid'
import { executeAIRequest } from '@/lib/adapters/ai'
import { executeOpenAIRequest } from '@/lib/adapters/openai'
import { executeGeminiRequest } from '@/lib/adapters/gemini'
import { executePerplexityRequest } from '@/lib/adapters/perplexity'
import type {
  CitationStatus,
  CitationKeywordResult,
  CitationPlatformSummary,
  AICitationTrackingResult,
} from '../types'

// ─── 타입 ───

interface TrackAICitationParams {
  url: string
  keywords: string[]
  brandName?: string
}

/** 플랫폼 설정 타입 추출 */
type PlatformSpec =
  (typeof DIAGNOSIS_PAID_CONFIG.CITATION_TRACKING.PLATFORMS)[number]

/** AI 어댑터 공통 응답 */
interface AdapterResponse {
  content: string
  tokenUsage: { input: number; output: number }
}

// ─── 플랫폼 가용성 ───

/** 환경변수 확인 → 사용 가능한 플랫폼만 반환 */
function getAvailablePlatforms(): PlatformSpec[] {
  return DIAGNOSIS_PAID_CONFIG.CITATION_TRACKING.PLATFORMS.filter(
    (p) => !!process.env[p.envKey]
  )
}

// ─── 플랫폼별 쿼리 라우팅 ───

/** 플랫폼 ID에 따라 적절한 어댑터로 요청 */
async function queryPlatform(
  platform: PlatformSpec,
  keyword: string
): Promise<AdapterResponse> {
  const { SYSTEM_PROMPT, QUERY_TEMPLATE, MAX_TOKENS_PER_QUERY } =
    DIAGNOSIS_PAID_CONFIG.CITATION_TRACKING

  const userMessage = QUERY_TEMPLATE.replace('{keyword}', keyword)
  const requestParams = {
    systemPrompt: SYSTEM_PROMPT,
    userMessage,
    maxTokens: MAX_TOKENS_PER_QUERY,
    model: platform.model,
  }

  switch (platform.id) {
    case 'claude':
      return executeAIRequest(requestParams)
    case 'chatgpt':
      return executeOpenAIRequest(requestParams)
    case 'google':
      return executeGeminiRequest(requestParams)
    case 'perplexity':
      return executePerplexityRequest(requestParams)
  }
}

// ─── 인용 감지 ───

/** AI 응답에서 도메인/URL/브랜드 언급 여부 판정 */
function detectCitation(
  response: string,
  url: string,
  domain: string,
  brandName?: string
): CitationStatus {
  const lower = response.toLowerCase()
  const lowerUrl = url.toLowerCase().replace(/\/$/, '')
  const lowerDomain = domain.toLowerCase()

  // 정확한 URL 포함 → mentioned (Y)
  if (lower.includes(lowerUrl)) return 'mentioned'

  // 도메인명 포함 → similar (△)
  if (lower.includes(lowerDomain)) return 'similar'

  // 브랜드명 포함 → similar (△)
  if (brandName && brandName.length >= 2) {
    const lowerBrand = brandName.toLowerCase()
    if (lower.includes(lowerBrand)) return 'similar'
  }

  return 'not_mentioned'
}

/** URL에서 도메인 추출 */
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return (
      url
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0] ?? url
    )
  }
}

// ─── 비용 계산 ───

/** 플랫폼별 비용 계산 (USD → KRW) */
function calculatePlatformCostKrw(
  platform: PlatformSpec,
  tokenUsage: { input: number; output: number }
): number {
  const { USD_TO_KRW } = DIAGNOSIS_PAID_CONFIG
  const { costPerMTokenUsd } = platform
  const inputCostUsd = (tokenUsage.input / 1_000_000) * costPerMTokenUsd.input
  const outputCostUsd =
    (tokenUsage.output / 1_000_000) * costPerMTokenUsd.output
  return Math.round((inputCostUsd + outputCostUsd) * USD_TO_KRW)
}

// ─── 메인 함수 ───

/**
 * AI 인용 실제 추적 (Task 5.3)
 *
 * 3개 키워드 × 4개 플랫폼(Claude, ChatGPT, Gemini, Perplexity)
 * = 최대 12개 쿼리를 병렬 실행.
 *
 * API 키가 없는 플랫폼은 자동 스킵 (에러 아님).
 */
export async function trackAICitation(
  params: TrackAICitationParams
): Promise<AICitationTrackingResult> {
  const startTime = Date.now()
  const platforms = getAvailablePlatforms()
  const domain = extractDomain(params.url)
  const keywords = params.keywords.slice(
    0,
    DIAGNOSIS_PAID_CONFIG.CITATION_TRACKING.MAX_KEYWORDS
  )

  // 키워드가 없으면 빈 결과 반환
  if (keywords.length === 0) {
    return {
      keywords: [],
      results: [],
      platformSummary: [],
      overallMentionRate: 0,
      totalCostKrw: 0,
      totalDurationMs: Date.now() - startTime,
    }
  }

  // 사용 가능한 플랫폼이 없으면 빈 결과 + 플래그 표시
  if (platforms.length === 0) {
    console.error(
      '[trackAICitation] 사용 가능한 플랫폼이 없습니다. API 키를 확인하세요.'
    )
    return {
      keywords,
      results: [],
      platformSummary: [],
      overallMentionRate: 0,
      platformsUnavailable: true,
      totalCostKrw: 0,
      totalDurationMs: Date.now() - startTime,
    }
  }

  // 키워드 × 플랫폼 조합 생성
  const queries = keywords.flatMap((keyword) =>
    platforms.map((platform) => ({ keyword, platform }))
  )

  const { QUERY_TIMEOUT_MS } = DIAGNOSIS_PAID_CONFIG.CITATION_TRACKING

  // 전체 병렬 실행 (쿼리당 타임아웃 적용)
  const settled = await Promise.allSettled(
    queries.map(async ({ keyword, platform }) => {
      const queryStart = Date.now()
      const response = await Promise.race([
        queryPlatform(platform, keyword),
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(`${platform.name} 타임아웃 (${QUERY_TIMEOUT_MS}ms)`)
              ),
            QUERY_TIMEOUT_MS
          )
        ),
      ])
      const status = detectCitation(
        response.content,
        params.url,
        domain,
        params.brandName
      )

      return {
        keyword,
        platform: platform.id,
        platformLabel: platform.name,
        status,
        mentionedUrl: status !== 'not_mentioned' ? params.url : undefined,
        snippet: response.content.slice(0, 300),
        tokenUsage: response.tokenUsage,
        durationMs: Date.now() - queryStart,
        _platformSpec: platform,
      }
    })
  )

  // 성공 결과 수집 + 실패 로깅
  const rawResults: Array<
    CitationKeywordResult & { _platformSpec: PlatformSpec }
  > = []

  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      rawResults.push(
        r.value as CitationKeywordResult & { _platformSpec: PlatformSpec }
      )
    } else {
      const query = queries[i]
      if (query) {
        console.error(
          `[trackAICitation] ${query.platform.name}/${query.keyword} 실패:`,
          r.reason instanceof Error ? r.reason.message : r.reason
        )
      }
    }
  })

  // 비용 계산
  const totalCostKrw = rawResults.reduce(
    (sum, r) => sum + calculatePlatformCostKrw(r._platformSpec, r.tokenUsage),
    0
  )

  // _platformSpec 제거하여 최종 결과 생성
  const results: CitationKeywordResult[] = rawResults.map((r) => ({
    keyword: r.keyword,
    platform: r.platform,
    platformLabel: r.platformLabel,
    status: r.status,
    mentionedUrl: r.mentionedUrl,
    snippet: r.snippet,
    tokenUsage: r.tokenUsage,
    durationMs: r.durationMs,
  }))

  // 플랫폼별 요약
  const platformSummary: CitationPlatformSummary[] = platforms.map((p) => {
    const platformResults = results.filter((r) => r.platform === p.id)
    return {
      platform: p.id,
      platformLabel: p.name,
      mentionedCount: platformResults.filter(
        (r) => r.status !== 'not_mentioned'
      ).length,
      totalKeywords: platformResults.length,
    }
  })

  // 전체 인용률
  const mentionedCount = results.filter(
    (r) => r.status !== 'not_mentioned'
  ).length
  const overallMentionRate =
    results.length > 0 ? mentionedCount / results.length : 0

  return {
    keywords,
    results,
    platformSummary,
    overallMentionRate,
    totalCostKrw,
    totalDurationMs: Date.now() - startTime,
  }
}
