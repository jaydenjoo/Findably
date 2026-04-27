import { createAdminClient } from '@/lib/supabase/admin'
import { transitionStatus } from '@/lib/diagnosis/transition-status'
import { executeAIRequest, calculateCostKrw } from '@/lib/adapters/ai'
import { enrichCrawlData } from '@/features/crawling/services/enrich-crawl-data'
import { DIAGNOSIS_PAID_CONFIG } from '@/config/diagnosis-paid'
import type { CrawlData } from '@/features/crawling'
import { crawlDataSchema } from '@/features/crawling/schemas'
import type {
  OverallScore,
  AICitationPossibilityScore,
  AggregatedScores,
  CategoryId,
  RuleResult,
} from '@/features/diagnosis-free'
import type { Json } from '@/types/database'
import type {
  AgentId,
  AICitationTrackingResult,
  AIAgentResult,
  AIInsight,
  CmoVerificationResponse,
  CompetitorAnalysis,
  SwotAnalysis,
  RoadmapItem,
  PaidAnalysisData,
  RunDiagnosisPaidResult,
} from '../types'
import { trackAICitation } from './track-ai-citation'
import { generateSwotAnalysis } from './generate-swot'
import { generateRoadmap } from './generate-roadmap'
import { extractJsonFromContent } from './extract-json'
import { parseV2EnhancedData } from './parse-v2-enhanced'
import { retryFailedAgentsWithFallback } from './retry-failed-agents'

// status 전이는 transitionStatus()로 일원화됨 — 직접 상수 불필요

/** 기존 무료 분석 데이터 (analysis_data 실제 DB 구조) */
interface FreeAnalysisData {
  overallScore: OverallScore
  aiCitation: AICitationPossibilityScore
  aggregated: AggregatedScores
}

/** analysis_data JSON을 FreeAnalysisData로 안전하게 파싱 */
function isValidFreeAnalysis(data: unknown): data is FreeAnalysisData {
  if (!data || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  return 'overallScore' in obj && 'aiCitation' in obj
}

/** crawl_data JSON을 CrawlData로 안전하게 파싱 */
function isValidCrawlData(data: unknown): data is CrawlData {
  const result = crawlDataSchema.safeParse(data)
  return result.success
}

/** 사이트 컨텍스트 (DB에서 조회) */
export interface SiteContext {
  targetKeywords: string[]
  competitorUrls: string[]
  industry: string
}

/** executeAgent 파라미터 (6개 → 1 객체) */
/** 5개 분석 에이전트 ID (CMO 제외) */
export type AnalysisAgentId = Exclude<AgentId, 'cmo'>

interface ExecuteAgentParams {
  agentId: AnalysisAgentId
  systemPrompt: string
  maxTokens: number
  crawlData: CrawlData
  url: string
  context: SiteContext
}

// 무료/유료 분리 아키텍처: 폴링 대기 함수 제거됨
// 유료 레코드는 생성 시 crawl_data + analysis_data가 이미 복사되어 있음

/**
 * 유료 5-Agent 병렬 분석 실행
 *
 * Phase 1: 5개 에이전트 병렬 실행 (~30초)
 * Phase 2: 결과 합산 (~즉시)
 * Phase 3: CMO 요약 (~즉시, 추후 AI 검증으로 업그레이드)
 */
export async function runDiagnosisPaid(
  diagnosisId: string
): Promise<RunDiagnosisPaidResult> {
  const supabase = createAdminClient()
  const startTime = Date.now()

  try {
    // Phase 3 Fix 7 (2026-04-06):
    // 시작 시 updated_at만 직접 갱신 → 디버깅용 timestamp 마커.
    // transitionStatus는 동일 status 시 스킵하므로 우회.
    // status 변경이 아닌 timestamp 마커이므로 일원화 원칙 위배 아님.
    await supabase
      .from('diagnoses')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', diagnosisId)

    // 1. 기존 진단 데이터 로드
    const { data: diagnosis, error: fetchError } = await supabase
      .from('diagnoses')
      .select(
        'url, crawl_data, analysis_data, target_keywords, competitor_urls, industry'
      )
      .eq('id', diagnosisId)
      .single()

    if (fetchError || !diagnosis) {
      console.error('[runDiagnosisPaid] 진단 조회 실패', fetchError)
      return { success: false, error: '진단 데이터를 찾을 수 없습니다.' }
    }

    // 무료/유료 분리 아키텍처: 유료 레코드는 생성 시 crawl_data가 복사됨
    // Layer2/3이 빈 경우 보강 실행 (무료 레코드에서 enrich 전에 복사된 경우)
    if (diagnosis.crawl_data) {
      const cd = diagnosis.crawl_data as Record<string, unknown>
      const needsEnrich =
        !cd.layer2 ||
        !cd.layer3 ||
        !(cd.layer2 as Record<string, unknown>)?.pagespeed

      if (needsEnrich) {
        console.log('[runDiagnosisPaid] Layer2/3 보강 실행')
        await enrichCrawlData(diagnosisId, diagnosis.url)

        // 보강된 데이터 재조회
        const { data: refreshed } = await supabase
          .from('diagnoses')
          .select('crawl_data')
          .eq('id', diagnosisId)
          .single()

        if (refreshed?.crawl_data) {
          diagnosis.crawl_data = refreshed.crawl_data
        }
      }
    }

    if (!isValidCrawlData(diagnosis.crawl_data)) {
      return {
        success: false,
        error: '크롤링 데이터가 없습니다. 무료 진단을 먼저 완료해주세요.',
      }
    }

    const crawlData = diagnosis.crawl_data

    const freeAnalysis: FreeAnalysisData | null = isValidFreeAnalysis(
      diagnosis.analysis_data
    )
      ? diagnosis.analysis_data
      : null

    if (!freeAnalysis) {
      return {
        success: false,
        error: '무료 분석 데이터가 없습니다. 무료 진단을 먼저 완료해주세요.',
      }
    }

    // 3. Phase 1 — 5개 에이전트 병렬 실행 (글로벌 2분 타임아웃)
    const context: SiteContext = {
      targetKeywords: diagnosis.target_keywords ?? [],
      competitorUrls: diagnosis.competitor_urls ?? [],
      industry: diagnosis.industry ?? '',
    }

    const GLOBAL_TIMEOUT_MS = 90 * 1000 // 90초 (Vercel Pro maxDuration=120초, 여유 30초)

    const agentsPromise = Promise.all([
      executeAgentsParallel(crawlData, diagnosis.url, context),
      trackAICitation({
        url: diagnosis.url,
        keywords: context.targetKeywords,
      }),
    ])

    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`글로벌 타임아웃: ${GLOBAL_TIMEOUT_MS / 1000}초 초과`))
      }, GLOBAL_TIMEOUT_MS)
    })

    let agentResults: Awaited<ReturnType<typeof executeAgentsParallel>>
    let citationResult: Awaited<ReturnType<typeof trackAICitation>>

    try {
      ;[agentResults, citationResult] = await Promise.race([
        agentsPromise,
        timeoutPromise,
      ])
    } finally {
      clearTimeout(timeoutId)
    }

    // 4. 성공/실패 집계 — 'completed'만 진짜 성공 (insights > 0)
    let successResults = agentResults.filter((r) => r.status === 'completed')
    const emptyResults = agentResults.filter((r) => r.status === 'empty')
    let failedAgents = agentResults
      .filter((r) => r.status === 'failed' || r.status === 'empty')
      .map((r) => r.agentId)

    if (emptyResults.length > 0) {
      console.warn(
        `[runDiagnosisPaid] ${emptyResults.length}개 에이전트가 API 성공했으나 유효 인사이트 0개:`,
        emptyResults.map((r) => r.agentId)
      )
    }

    // 4.1. 재시도 — 실패/빈 에이전트를 축소 토큰으로 1회 재실행
    const retryTargets = agentResults.filter(
      (r) => r.status === 'failed' || r.status === 'empty'
    )

    if (retryTargets.length > 0) {
      const failedAgentIds = retryTargets.map((r) => r.agentId)

      const retryResults = await retryFailedAgentsWithFallback(
        diagnosisId,
        failedAgentIds,
        crawlData,
        {
          url: diagnosis.url,
          targetKeywords: context.targetKeywords,
          competitorUrls: context.competitorUrls,
          industry: context.industry,
        },
        context
      )

      // 재시도 성공분을 원본 결과에 병합
      for (const retried of retryResults) {
        const idx = agentResults.findIndex((r) => r.agentId === retried.agentId)
        if (idx !== -1) {
          agentResults[idx] = retried
        }
      }

      // 재시도 후 성공/실패 재집계
      successResults = agentResults.filter((r) => r.status === 'completed')
      failedAgents = agentResults
        .filter((r) => r.status === 'failed' || r.status === 'empty')
        .map((r) => r.agentId)

      if (retryResults.some((r) => r.status === 'completed')) {
        console.log(
          `[runDiagnosisPaid] 재시도 후 성공: ${successResults.length}/5`
        )
      }
    }

    // 4.2. 최종 폴백 — 여전히 MIN_SUCCESS_COUNT 미달이면 무료 룰 결과로 인사이트 보충
    if (
      successResults.length < DIAGNOSIS_PAID_CONFIG.MIN_SUCCESS_COUNT &&
      failedAgents.length > 0
    ) {
      console.log(
        `[runDiagnosisPaid] 폴백 적용 — 실패 에이전트의 무료 룰 결과를 인사이트로 변환:`,
        failedAgents
      )

      for (const failedId of failedAgents) {
        const fallbackInsights = convertFreeRulesToInsights(
          failedId as AnalysisAgentId,
          freeAnalysis
        )
        if (fallbackInsights.length > 0) {
          const idx = agentResults.findIndex((r) => r.agentId === failedId)
          if (idx !== -1) {
            agentResults[idx] = {
              ...agentResults[idx]!,
              status: 'completed',
              insights: fallbackInsights,
              error: `${agentResults[idx]!.error ?? 'AI 실패'} → 룰 기반 폴백 적용`,
            }
          }
        }
      }

      // 폴백 후 최종 재집계
      successResults = agentResults.filter((r) => r.status === 'completed')
      failedAgents = agentResults
        .filter((r) => r.status === 'failed' || r.status === 'empty')
        .map((r) => r.agentId)

      console.log(
        `[runDiagnosisPaid] 폴백 후 최종 성공: ${successResults.length}/5`
      )
    }

    if (successResults.length < DIAGNOSIS_PAID_CONFIG.MIN_SUCCESS_COUNT) {
      await transitionStatus(diagnosisId, 'failed', {
        caller: 'runDiagnosisPaid:minSuccess',
      })

      const emptyInfo =
        emptyResults.length > 0
          ? ` (${emptyResults.length}개 에이전트는 API 성공했으나 유효 데이터 없음)`
          : ''

      return {
        success: false,
        error: `최소 ${DIAGNOSIS_PAID_CONFIG.MIN_SUCCESS_COUNT}개 에이전트가 유효한 인사이트를 반환해야 합니다. (${successResults.length}/5 성공)${emptyInfo}`,
        failedAgents,
      }
    }

    // 4.5. 전체 인사이트 유효성 최종 확인
    const totalInsights = successResults.reduce(
      (sum, r) => sum + r.insights.length,
      0
    )
    if (totalInsights === 0) {
      console.error(
        '[runDiagnosisPaid] 모든 에이전트의 인사이트가 0개 — 빈 리포트 생성 방지'
      )
      await transitionStatus(diagnosisId, 'failed', {
        caller: 'runDiagnosisPaid:zeroInsights',
      })

      return {
        success: false,
        error:
          '모든 에이전트가 유효한 인사이트를 생성하지 못했습니다. AI 응답 파싱을 확인하세요.',
        failedAgents,
      }
    }

    // 5. Phase 2 + 3 — 결과 합산 + CMO 요약
    const agentCostKrw = agentResults.reduce(
      (sum, r) => sum + calculateCostKrw(r.tokenUsage),
      0
    )
    const totalCostKrw = agentCostKrw + citationResult.totalCostKrw
    const totalDurationMs = Date.now() - startTime

    const paidAnalysisData = await aggregateResults({
      freeAnalysis,
      agentResults,
      citationResult,
      competitorUrls: context.competitorUrls,
      totalCostKrw,
      totalDurationMs,
    })

    // 6. DB 저장 (analysis_data만, status는 transitionStatus에 위임)
    const { error: updateError } = await supabase
      .from('diagnoses')
      .update({
        analysis_data: paidAnalysisData as unknown as Json,
        tier: 'paid',
      })
      .eq('id', diagnosisId)

    if (updateError) {
      console.error('[runDiagnosisPaid] DB 업데이트 실패', updateError)
      return { success: false, error: 'DB 업데이트에 실패했습니다.' }
    }

    // status 전이: analyzing → completed
    await transitionStatus(diagnosisId, 'completed', {
      caller: 'runDiagnosisPaid',
    })

    return {
      success: true,
      ...(failedAgents.length > 0 ? { failedAgents } : {}),
    }
  } catch (err) {
    console.error('[runDiagnosisPaid]', err)

    await transitionStatus(diagnosisId, 'failed', {
      caller: 'runDiagnosisPaid:catch',
    })

    return {
      success: false,
      error:
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.',
    }
  }
}

// ─── 재시도 + 폴백 ───

/** 에이전트 ID → 무료 분석 카테고리 매핑 (폴백 변환용) */
const AGENT_TO_CATEGORIES: Record<AnalysisAgentId, CategoryId[]> = {
  technical: ['technical', 'performance', 'security', 'mobile'],
  seo: ['technical'],
  geo: ['social-ai', 'geo'],
  content: ['content'],
  competitors: [],
}

/**
 * 무료 분석 룰 결과 → AIInsight 변환 (최종 폴백)
 * 에이전트가 재시도 후에도 실패한 경우, 해당 카테고리의 무료 룰 결과를 인사이트로 변환
 */
function convertFreeRulesToInsights(
  agentId: AnalysisAgentId,
  freeAnalysis: FreeAnalysisData
): AIInsight[] {
  const targetCategories = AGENT_TO_CATEGORIES[agentId]
  if (targetCategories.length === 0) return [] // competitors는 무료 룰 없음

  const rules: RuleResult[] = []
  for (const category of freeAnalysis.overallScore.categories) {
    if (targetCategories.includes(category.id)) {
      // 실패한 룰만 인사이트로 변환 (통과 룰은 문제 없으므로 제외)
      rules.push(...category.rules.filter((r) => !r.passed && !r.skipped))
    }
  }

  if (rules.length === 0) return []

  return rules.slice(0, 5).map((rule) => ({
    title: `[룰 기반] ${rule.name}`,
    description: rule.message,
    severity: rule.severity,
    category: rule.category,
    actionable: rule.quickWinEligible,
    evidence: `룰 점수: ${rule.points}/${rule.maxPoints}`,
    priority:
      rule.severity === 'critical' ? 1 : rule.severity === 'warning' ? 5 : 8,
  }))
}

// ─── G3: 경쟁사 PageSpeed 폴백 ───

/**
 * competitors 에이전트 실패 시 Google PageSpeed Insights로 경쟁사 기본 분석 생성
 * 모듈 경계 규칙: features/competitors 직접 import 금지 → 자체 구현
 */
async function generateCompetitorsFallback(
  competitorUrls: string[]
): Promise<CompetitorAnalysis[]> {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    console.warn(
      '[generateCompetitorsFallback] GOOGLE_API_KEY 미설정 → 폴백 불가'
    )
    return []
  }

  const results = await Promise.allSettled(
    competitorUrls.map((url) => fetchPageSpeedForFallback(url, apiKey))
  )

  const competitors: CompetitorAnalysis[] = []
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      competitors.push(result.value)
    }
  }

  console.log(
    `[generateCompetitorsFallback] ${competitors.length}/${competitorUrls.length}개 경쟁사 PageSpeed 폴백 완료`
  )
  return competitors
}

/** 단일 경쟁사 URL에 대해 PageSpeed API 호출 → CompetitorAnalysis 변환 */
async function fetchPageSpeedForFallback(
  url: string,
  apiKey: string
): Promise<CompetitorAnalysis | null> {
  const categories = ['performance', 'accessibility', 'seo', 'best-practices']
  const params = new URLSearchParams({
    url,
    key: apiKey,
    strategy: 'mobile',
  })
  for (const cat of categories) {
    params.append('category', cat)
  }

  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30_000)

    const response = await fetch(endpoint, { signal: controller.signal })
    clearTimeout(timeout)

    if (!response.ok) {
      console.warn(
        `[fetchPageSpeedForFallback] ${url} → HTTP ${response.status}`
      )
      return null
    }

    const data = await response.json()
    const cats = data?.lighthouseResult?.categories ?? {}

    const scores: Record<string, number | null> = {
      performance:
        cats.performance?.score != null
          ? Math.round(cats.performance.score * 100)
          : null,
      accessibility:
        cats.accessibility?.score != null
          ? Math.round(cats.accessibility.score * 100)
          : null,
      seo: cats.seo?.score != null ? Math.round(cats.seo.score * 100) : null,
      bestPractices:
        cats['best-practices']?.score != null
          ? Math.round(cats['best-practices'].score * 100)
          : null,
    }

    const validScores = Object.values(scores).filter(
      (s): s is number => s !== null
    )
    const overallScore =
      validScores.length > 0
        ? Math.round(
            validScores.reduce((a, b) => a + b, 0) / validScores.length
          )
        : 0

    const strengths: string[] = []
    const weaknesses: string[] = []
    const gaps: string[] = []

    const scoreLabels: Record<string, string> = {
      performance: '페이지 속도',
      accessibility: '접근성',
      seo: 'SEO 기본',
      bestPractices: '웹 표준',
    }

    for (const [key, score] of Object.entries(scores)) {
      const label = scoreLabels[key] ?? key
      if (score === null) continue
      if (score >= 80) {
        strengths.push(`${label} ${score}점 (양호)`)
      } else if (score >= 50) {
        gaps.push(`${label} ${score}점 (개선 여지)`)
      } else {
        weaknesses.push(`${label} ${score}점 (취약)`)
      }
    }

    return { url, overallScore, strengths, weaknesses, gaps }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.warn(`[fetchPageSpeedForFallback] ${url} 실패:`, message)
    return null
  }
}

// ─── Phase 1: 에이전트 병렬 실행 ───

/**
 * 5개 에이전트 병렬 실행 (Promise.allSettled)
 * 개별 에이전트 실패는 전체 실패로 전파되지 않음
 */
async function executeAgentsParallel(
  crawlData: CrawlData,
  url: string,
  context: SiteContext
): Promise<AIAgentResult[]> {
  const agents = DIAGNOSIS_PAID_CONFIG.AGENTS

  // AGENTS 배열은 분석 에이전트 5개만 포함 (CMO는 CMO_AGENT 별도 상수)
  const promises = agents.map((agent) =>
    executeAgent({
      agentId: agent.id as AnalysisAgentId,
      systemPrompt: agent.systemPrompt,
      maxTokens: agent.maxTokens,
      crawlData,
      url,
      context,
    })
  )

  const settled = await Promise.allSettled(promises)

  return settled.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    }

    const agent = agents[index]
    if (!agent) {
      console.error(`[Agent:index=${index}] 에이전트 설정을 찾을 수 없음`)
      return {
        agentId: (agents[0]?.id ?? 'technical') as AgentId,
        status: 'failed' as const,
        insights: [],
        tokenUsage: { input: 0, output: 0 },
        durationMs: 0,
        error: '에이전트 설정 누락',
      }
    }

    const agentId = agent.id as AgentId
    console.error(`[Agent:${agentId}] 실패`, result.reason)

    return {
      agentId,
      status: 'failed' as const,
      insights: [],
      tokenUsage: { input: 0, output: 0 },
      durationMs: 0,
      error:
        result.reason instanceof Error
          ? result.reason.message
          : '에이전트 실행 실패',
    }
  })
}

/**
 * 단일 에이전트 실행
 */
async function executeAgent(
  params: ExecuteAgentParams
): Promise<AIAgentResult> {
  const { agentId, systemPrompt, maxTokens, crawlData, url, context } = params
  const agentStart = Date.now()
  const userMessage = buildUserMessage({ agentId, crawlData, url, context })

  const response = await executeAIRequest({
    systemPrompt,
    userMessage,
    maxTokens,
  })

  const insights = parseAgentResponse(agentId, response.content)

  // insights가 0개면 API는 성공했지만 유효 데이터가 없는 'empty' 상태
  const status = insights.length > 0 ? 'completed' : 'empty'
  if (status === 'empty') {
    console.warn(
      `[executeAgent:${agentId}] API 성공했으나 유효 인사이트 0개. response 앞 300자:`,
      response.content.slice(0, 300)
    )
  }

  return {
    agentId,
    status,
    insights,
    rawResponse: response.content,
    tokenUsage: response.tokenUsage,
    durationMs: Date.now() - agentStart,
  }
}

// ─── 프롬프트 빌딩 ───

export interface BuildUserMessageParams {
  agentId: Exclude<AgentId, 'cmo'>
  crawlData: CrawlData
  url: string
  context: SiteContext
}

/**
 * 에이전트별 사용자 메시지 생성
 */
export function buildUserMessage(params: BuildUserMessageParams): string {
  const { agentId, crawlData, url, context } = params
  const baseInfo = [
    '## 분석 대상',
    `- URL: ${url}`,
    `- 업종: ${context.industry || '미지정'}`,
    `- 타겟 키워드: ${context.targetKeywords.length > 0 ? context.targetKeywords.join(', ') : '미지정'}`,
  ].join('\n')

  const crawlSummary = buildCrawlSummary(crawlData)

  const focusMap = {
    technical: '기술적 SEO 관점에서 분석해주세요.',
    seo: '검색 엔진 최적화 관점에서 분석해주세요.',
    geo: 'AI 검색 엔진(ChatGPT, Claude, Perplexity, Google AI) 노출 최적화 관점에서 분석해주세요.',
    content: '콘텐츠 품질, 구조, 전문성 관점에서 분석해주세요.',
    competitors: '경쟁사 비교 분석 + SWOT + 90일 로드맵을 생성해주세요.',
  } satisfies Record<AnalysisAgentId, string>

  const competitorLine =
    agentId === 'competitors'
      ? `\n- 경쟁사: ${context.competitorUrls.length > 0 ? context.competitorUrls.join(', ') : '자동 탐색 필요'}`
      : ''

  return `${baseInfo}${competitorLine}\n\n## 크롤링 데이터\n${crawlSummary}\n\n${focusMap[agentId]}`
}

/**
 * Layer 1 (직접 크롤링) 데이터 → 텍스트 요약
 */
function buildLayer1Section(l1: NonNullable<CrawlData['layer1']>): string {
  // Heading hierarchy with full text
  const headingLines: string[] = []
  if (l1.headings.h1.length > 0) {
    headingLines.push(`H1: "${l1.headings.h1[0]}"`)
  } else {
    headingLines.push('H1 없음')
  }
  if (l1.headings.h2.length > 0) {
    headingLines.push(
      `H2 (${l1.headings.h2.length}개):\n${l1.headings.h2.map((h) => `  - ${h}`).join('\n')}`
    )
  }
  if (l1.headings.h3.length > 0) {
    headingLines.push(
      `H3 (${l1.headings.h3.length}개):\n${l1.headings.h3.map((h) => `  - ${h}`).join('\n')}`
    )
  }
  const h4PlusCount =
    l1.headings.h4.length + l1.headings.h5.length + l1.headings.h6.length
  if (h4PlusCount > 0) {
    headingLines.push(`H4+: ${h4PlusCount}개`)
  }
  const headings = headingLines.join('\n')

  // Schema Markup with type detection
  const schema =
    l1.schema_markup.length > 0
      ? `있음 (${l1.schema_markup.length}개)\nTypes: ${[
          ...new Set(
            l1.schema_markup.map((s) => {
              if (s !== null && typeof s === 'object' && '@type' in s) {
                const t = (s as Record<string, unknown>)['@type']
                return typeof t === 'string' ? t : 'unknown'
              }
              return 'unknown'
            })
          ),
        ].join(', ')}`
      : '없음'

  // OG Tags summary
  const ogEntries = Object.entries(l1.meta.og || {})
  const ogTags =
    ogEntries.length > 0
      ? ogEntries
          .map(([k, v]) => {
            const val = typeof v === 'string' ? v : ''
            const truncated =
              val.length > 60 ? `${val.substring(0, 60)}...` : val
            return `  - og:${k}: ${truncated}`
          })
          .join('\n')
      : ''

  // Image details
  const images = `총 ${l1.images.total}개 (alt 미설정: ${l1.images.without_alt}개, 용량 초과: ${l1.images.large_images.length}개)`

  // Link analysis
  const links = `내부링크: ${l1.links.internal}개, 외부링크: ${l1.links.external}개, 깨진링크: ${l1.links.broken.length}개`

  return [
    '### HTML 메타데이터',
    `- Title: ${l1.meta.title ?? 'N/A'}`,
    `- Description: ${l1.meta.description ?? 'N/A'}`,
    `- Canonical: ${l1.meta.canonical ?? 'N/A'}`,
    '',
    '### 제목 계층 구조',
    headings,
    '',
    '### Schema Markup',
    schema,
    ...(ogTags ? ['', 'OG 태그:', ogTags] : []),
    '',
    '### 이미지 & 멀티미디어',
    images,
    '',
    '### 링크',
    links,
    '',
    '### 기타 신호',
    l1.page_size_bytes > 0
      ? `페이지 크기: ${Math.round(l1.page_size_bytes / 1024)}KB`
      : `페이지 크기: 측정 불가 ⚠️ (Firecrawl metadata 미수집 — "0KB", "사이트 로딩 실패", "전기 끊어진 상태" 같은 단정 표현 절대 금지. 사이트가 실제로 다운된 것이 아니라 크롤링 데이터에 해당 필드가 없을 뿐.)`,
    l1.load_time_ms > 0
      ? `로드 시간: ${l1.load_time_ms}ms`
      : `로드 시간: 측정 불가 ⚠️ (Firecrawl metadata 미수집 — 단정 표현 금지, 다른 신호로 판단)`,
    `언어: ${l1.html_lang || '미설정'}`,
  ].join('\n')
}

/**
 * CrawlData → 텍스트 요약 (Content Agent 데이터 품질 강화 포함)
 */
export function buildCrawlSummary(crawlData: CrawlData): string {
  const parts: string[] = []

  // ⚠️ 글로벌 데이터 가드레일 — 5 에이전트 + CMO 공통, 환각 차단 핵심
  parts.push(
    [
      '### ⚠️ 데이터 가드레일 (모든 insight 생성 시 강제 적용)',
      '- 본 데이터에 "측정 불가" 표시된 항목은 **사이트 자체의 부재가 아니라 크롤링 응답에 해당 필드가 없을 뿐**. 사이트는 정상 작동 중이지만 크롤러가 그 신호를 가져오지 못한 것.',
      '- 다음 단정 표현 절대 금지: "완전 누락", "치명적 오류", "0KB 로딩 실패", "전기 끊어진 상태", "사이트 장애", "http://로 접속", "보안 자물쇠 없음", "사이트가 작동하지 않음".',
      '- 측정 불가 항목은 insight를 생성하지 말거나, 생성한다면 "재측정 권고" 또는 "현재 데이터로는 확인 불가" 형태로만 표현.',
      '- title/description/h1/canonical/og/schema/ssl 등이 비어있다고 표시되더라도 1차로 "크롤링 데이터 누락"을 의심하고, "사이트가 그것을 안 가지고 있다"라고 단정하지 말 것.',
      '- description, suggestedFix, impact, evidence 4개 필드 모두 본 가드를 적용. evidence는 반드시 실제 측정값 인용 (측정 불가 → "데이터 미수집"으로 명시).',
    ].join('\n')
  )

  if (crawlData.layer1) {
    parts.push(buildLayer1Section(crawlData.layer1))
  }

  if (crawlData.robots_txt) {
    const rt = crawlData.robots_txt
    parts.push(
      [
        '### robots.txt',
        `- 존재: ${rt.exists ? 'Y' : 'N'}`,
        `- Googlebot 허용: ${rt.allows_googlebot ? 'Y' : 'N'}`,
        `- AI 봇: ${JSON.stringify(rt.ai_bots)}`,
      ].join('\n')
    )
  }

  if (crawlData.sitemap) {
    parts.push(
      [
        '### Sitemap',
        `- 존재: ${crawlData.sitemap.exists ? 'Y' : 'N'}`,
        `- URL 수: ${crawlData.sitemap.url_count}`,
      ].join('\n')
    )
  }

  if (crawlData.llms_txt) {
    parts.push(`### llms.txt\n- 존재: ${crawlData.llms_txt.exists ? 'Y' : 'N'}`)
  }

  if (crawlData.layer2?.pagespeed) {
    const ps = crawlData.layer2.pagespeed
    const lcpUnreliable = ps.lcp_ms > 20000
    parts.push(
      [
        '### PageSpeed',
        `- Performance: ${ps.performance_score}`,
        lcpUnreliable
          ? `- LCP: ${ps.lcp_ms}ms ⚠️ 비정상값 (20초 초과 — Vercel STALE 캐시 응답 또는 일시적 장애 가능성. "사이트 장애", "치명적 오류" 단정 금지. "재측정 권고"로 표현.)`
          : `- LCP: ${ps.lcp_ms}ms`,
        `- CLS: ${ps.cls}`,
        `- TTFB: ${ps.ttfb_ms}ms`,
        '- (FID는 2024-03부터 Google Core Web Vitals에서 폐기됨 — INP가 표준. CrUX 섹션의 inp_ms 참조. insight에서 FID 지표 사용 금지.)',
      ].join('\n')
    )
  }

  if (crawlData.layer2?.crux) {
    const crux = crawlData.layer2.crux
    parts.push(
      [
        '### CrUX (실사용자 데이터)',
        `- LCP: ${crux.lcp_ms}ms`,
        `- INP: ${crux.inp_ms}ms`,
        `- CLS: ${crux.cls}`,
      ].join('\n')
    )
  }

  if (crawlData.layer3?.ssl) {
    const ssl = crawlData.layer3.ssl
    const sslMissing = !ssl.grade && !ssl.issuer
    parts.push(
      [
        '### SSL',
        sslMissing
          ? '- 측정 불가 ⚠️ (SSL Labs API 응답 실패 또는 status≠READY — "SSL 인증서 완전 누락", "http://로 접속" 같은 단정 표현 절대 금지. HTTPS 자체는 응답 헤더의 strict-transport-security 또는 브라우저로 정상 확인 가능. 정확한 등급 측정만 실패한 것.)'
          : `- 등급: ${ssl.grade ?? 'N/A'}\n- 유효: ${ssl.valid ? 'Y' : 'N'}`,
      ].join('\n')
    )
  }

  if (crawlData.layer3?.observatory) {
    const obs = crawlData.layer3.observatory
    parts.push(
      [
        '### 보안 헤더 (Observatory)',
        `- 등급: ${obs.grade ?? 'N/A'}`,
        `- 점수: ${obs.score ?? 'N/A'}`,
        `- 이슈: ${obs.issues.length}개`,
      ].join('\n')
    )
  }

  if (crawlData.mobile) {
    const m = crawlData.mobile
    parts.push(
      [
        '### 모바일',
        `- 뷰포트: ${m.viewport_configured ? 'Y' : 'N'}`,
        `- 터치 친화: ${m.touch_friendly ? 'Y' : 'N'}`,
        `- 이슈: ${m.issues.length}개`,
      ].join('\n')
    )
  }

  // Phase C Task 5: CMS 감지 결과를 명시적으로 전달하여 WordPress/Shopify 편향 해소
  // 감지된 경우: AI가 해당 CMS 기준으로 suggestedFix 생성
  // 감지 불가: 3가지 경로 병렬 제시 강제 (단일 CMS 단정 금지)
  if (crawlData.cms?.detected) {
    parts.push(
      `### CMS\n- 감지: ${crawlData.cms.detected}\n- suggestedFix는 이 CMS에 맞춘 가이드를 우선 작성하세요.`
    )
  } else {
    parts.push(
      `### CMS\n- 감지: 불가 (technology fingerprint 검출 실패)\n- suggestedFix는 "워드프레스 / 카페24 / 직접 코딩" 3가지 경로를 모두 병렬 제시하세요. 단일 CMS로 단정하지 마세요.`
    )
  }

  // ── markdownContent 요약 (Firecrawl 본문) ──
  if (crawlData.markdownContent) {
    const contentSummary = extractContentSummary(crawlData.markdownContent)
    parts.push(`### 페이지 본문 요약\n${contentSummary}`)
  }

  // ── siteUrls (사이트 구조) ──
  if (crawlData.siteUrls && crawlData.siteUrls.length > 0) {
    const urlList = crawlData.siteUrls.slice(0, 20).join('\n- ')
    parts.push(
      `### 사이트 구조 (${crawlData.siteUrls.length}개 URL)\n- ${urlList}`
    )
  }

  return parts.join('\n\n') || '크롤링 데이터 없음'
}

/**
 * markdownContent에서 AI 분석에 필요한 핵심 부분만 추출
 * - 토큰 폭발 방지를 위해 2000자 제한
 * - 첫 문단 + H2 구조 + 핵심 통계 + 결론부
 */
export function extractContentSummary(
  markdown: string,
  maxLength: number = 2000
): string {
  if (!markdown || markdown.trim().length === 0) return '(본문 없음)'

  const parts: string[] = []

  // 1. 첫 문단 (H1 이후 첫 텍스트 블록)
  const firstParagraph = markdown
    .split('\n\n')
    .find((p) => p.trim().length > 50 && !p.startsWith('#'))
  if (firstParagraph) {
    parts.push(`[도입부] ${firstParagraph.trim().slice(0, 300)}`)
  }

  // 2. H2 구조 목록
  const h2Matches = markdown.match(/^## .+$/gm)
  if (h2Matches && h2Matches.length > 0) {
    parts.push(`[구조] ${h2Matches.slice(0, 10).join(' | ')}`)
  }

  // 3. 핵심 통계 (숫자 포함 문장)
  const statLines = markdown
    .split('\n')
    .filter((line) => /\d+[%만억원건]/.test(line) && line.trim().length > 10)
    .slice(0, 5)
  if (statLines.length > 0) {
    parts.push(`[통계] ${statLines.join(' / ')}`)
  }

  // 4. 결론부 (마지막 2 문단)
  const paragraphs = markdown
    .split('\n\n')
    .filter((p) => p.trim().length > 30 && !p.startsWith('#'))
  if (paragraphs.length >= 2) {
    const conclusion = paragraphs
      .slice(-2)
      .map((p) => p.trim().slice(0, 200))
      .join(' ')
    parts.push(`[결론부] ${conclusion}`)
  }

  const result = parts.join('\n')
  return result.length > maxLength ? result.slice(0, maxLength) + '...' : result
}

// ─── 응답 파싱 ───

/**
 * AI 응답 JSON 파싱 → AIInsight[]
 */
export function parseAgentResponse(
  agentId: AgentId,
  content: string
): AIInsight[] {
  try {
    const parsed = extractJsonFromContent(content)

    if (!parsed) {
      console.error(
        `[parseAgentResponse:${agentId}] JSON을 찾을 수 없음. content 앞 200자:`,
        content.slice(0, 200)
      )
      return []
    }

    if (Array.isArray(parsed.insights)) {
      const valid = (parsed.insights as Record<string, unknown>[])
        .filter(isValidInsight)
        .map(normalizeInsight)
        .filter((v): v is AIInsight => v !== null)
      if (valid.length === 0 && parsed.insights.length > 0) {
        console.warn(
          `[parseAgentResponse:${agentId}] insights ${parsed.insights.length}개 중 유효한 것 0개. 첫 항목:`,
          JSON.stringify(parsed.insights[0]).slice(0, 300)
        )
      }
      return valid
    }

    console.warn(
      `[parseAgentResponse:${agentId}] parsed.insights가 배열이 아님. keys:`,
      Object.keys(parsed).join(', ')
    )
    return []
  } catch (err) {
    console.error(
      `[parseAgentResponse:${agentId}] 파싱 실패. content 앞 200자:`,
      content.slice(0, 200),
      err
    )
    return []
  }
}

/** 인사이트 유효성 검사 */
export function isValidInsight(item: Record<string, unknown>): boolean {
  return (
    typeof item.title === 'string' &&
    typeof item.description === 'string' &&
    typeof item.severity === 'string' &&
    ['critical', 'warning', 'info'].includes(item.severity as string)
  )
}

/** 인사이트 정규화 */
export function normalizeInsight(
  item: Record<string, unknown>
): AIInsight | null {
  if (!isValidInsight(item)) return null
  return {
    title: item.title as string,
    description: item.description as string,
    severity: item.severity as AIInsight['severity'],
    category: (item.category as AIInsight['category']) ?? 'technical',
    actionable: item.actionable === true,
    suggestedFix:
      typeof item.suggestedFix === 'string' ? item.suggestedFix : undefined,
    impact: typeof item.impact === 'string' ? item.impact : undefined,
    evidence: typeof item.evidence === 'string' ? item.evidence : undefined,
    priority:
      typeof item.priority === 'number' &&
      item.priority >= 1 &&
      item.priority <= 10
        ? item.priority
        : undefined,
  }
}

// ─── Phase 2 + 3: 결과 합산 ───

interface AggregateResultsParams {
  freeAnalysis: FreeAnalysisData
  agentResults: AIAgentResult[]
  citationResult: AICitationTrackingResult
  competitorUrls: string[]
  totalCostKrw: number
  totalDurationMs: number
}

/**
 * 에이전트 결과 합산 → PaidAnalysisData (Phase 2 + 3)
 */
/**
 * 5 에이전트 중복 insight 제거 (Fix 6D)
 *
 * 5개 에이전트(technical/seo/geo/content/competitors)가 같은 항목(LCP/SSL 등)을
 * 다른 표현으로 중복 보고하는 패턴 차단. (category, normalized title) 키로
 * 첫 번째만 유지. title 정규화: 소문자 + 공백/특수문자 제거.
 */
function dedupeInsights<T extends { title: string; category?: string }>(
  insights: T[]
): T[] {
  const seen = new Set<string>()
  const result: T[] = []
  for (const insight of insights) {
    const titleNorm = insight.title
      .toLowerCase()
      .replace(/[\s\-_,./:;()'"!?]/g, '')
    const key = `${insight.category ?? 'misc'}::${titleNorm}`
    if (!seen.has(key)) {
      seen.add(key)
      result.push(insight)
    }
  }
  return result
}

async function aggregateResults(
  params: AggregateResultsParams
): Promise<PaidAnalysisData> {
  const {
    freeAnalysis,
    agentResults,
    citationResult,
    competitorUrls,
    totalCostKrw,
    totalDurationMs,
  } = params
  const allInsights = dedupeInsights(agentResults.flatMap((r) => r.insights))

  if (allInsights.length === 0) {
    console.warn(
      '[aggregateResults] 전체 에이전트 인사이트가 0개. 에이전트별 상태:',
      agentResults
        .map((r) => `${r.agentId}:${r.status}(insights=${r.insights.length})`)
        .join(', ')
    )
  }

  const competitorsResult = agentResults.find(
    (r) => r.agentId === 'competitors'
  )
  const parsed = parseCompetitorsResult(competitorsResult)

  // G3: competitors 에이전트 실패 시 PageSpeed 기반 폴백
  let competitors = parsed.competitors
  if (competitors.length === 0 && competitorUrls.length > 0) {
    console.warn(
      '[aggregateResults] competitors 에이전트 결과 없음 → PageSpeed 폴백 시도:',
      competitorUrls.join(', ')
    )
    competitors = await generateCompetitorsFallback(competitorUrls)
  }

  // Task 5.5 — 5개 에이전트 종합 SWOT (rule-based, AI 호출 없음)
  const swot = generateSwotAnalysis({
    agentResults,
    categoryScores: freeAnalysis.overallScore.categories,
    overallScore: freeAnalysis.overallScore,
    competitorSwot: isValidSwot(parsed.swot) ? parsed.swot : null,
    competitorAnalyses: competitors,
  })

  // Task 5.6 — 5개 에이전트 종합 90일 로드맵 (rule-based, AI 호출 없음)
  const roadmap = generateRoadmap({
    agentResults,
    categoryScores: freeAnalysis.overallScore.categories,
    overallScore: freeAnalysis.overallScore,
    quickWins: freeAnalysis.overallScore.quickWins,
    competitorRoadmap: parsed.roadmap,
    competitorAnalyses: competitors,
  })

  // Phase 3 — CMO 검증 에이전트
  const { cmoSummary, cmoCostKrw } = await executeCmoAgent(
    agentResults,
    freeAnalysis,
    citationResult
  )

  // v2: 컨설팅급 강화 데이터 추출 (rawResponse 재파싱)
  const v2Data = parseV2EnhancedData(agentResults)

  return {
    overallScore: freeAnalysis.overallScore,
    categoryScores: freeAnalysis.overallScore.categories,
    quickWins: freeAnalysis.overallScore.quickWins,
    aiCitation: freeAnalysis.aiCitation,
    aiInsights: allInsights,
    swot,
    roadmap,
    competitors,
    aiCitationTracking: citationResult,
    cmoSummary,
    agentResults,
    totalCostKrw: totalCostKrw + cmoCostKrw,
    totalDurationMs,
    // v2: 컨설팅급 강화 데이터 (optional — 하위호환)
    strategicRecommendations:
      v2Data.strategicRecommendations.length > 0
        ? v2Data.strategicRecommendations
        : undefined,
    enhancedQuickWins:
      v2Data.enhancedQuickWins.length > 0
        ? v2Data.enhancedQuickWins
        : undefined,
    aiCitability: v2Data.aiCitability ?? undefined,
  }
}

/**
 * 경쟁사 분석가 결과에서 SWOT, 로드맵, 경쟁사 비교 추출
 */
export function parseCompetitorsResult(result: AIAgentResult | undefined): {
  swot: SwotAnalysis
  roadmap: RoadmapItem[]
  competitors: CompetitorAnalysis[]
} {
  const empty = {
    swot: {
      strengths: [] as string[],
      weaknesses: [] as string[],
      opportunities: [] as string[],
      threats: [] as string[],
    },
    roadmap: [] as RoadmapItem[],
    competitors: [] as CompetitorAnalysis[],
  }

  if (!result?.rawResponse) return empty

  const parsed = extractJsonFromContent(result.rawResponse)
  if (!parsed) return empty

  return {
    swot: isValidSwot(parsed.swot) ? (parsed.swot as SwotAnalysis) : empty.swot,
    roadmap: Array.isArray(parsed.roadmap)
      ? parsed.roadmap.filter(isValidRoadmapItem)
      : [],
    competitors: Array.isArray(parsed.competitors)
      ? parsed.competitors.filter(isValidCompetitorAnalysis)
      : [],
  }
}

/** SWOT 유효성 검사 */
function isValidSwot(swot: unknown): boolean {
  if (!swot || typeof swot !== 'object') return false
  const s = swot as Record<string, unknown>
  return (
    Array.isArray(s.strengths) &&
    Array.isArray(s.weaknesses) &&
    Array.isArray(s.opportunities) &&
    Array.isArray(s.threats)
  )
}

/** 로드맵 항목 유효성 검사 */
function isValidRoadmapItem(item: unknown): item is RoadmapItem {
  if (!item || typeof item !== 'object') return false
  const r = item as Record<string, unknown>
  return (
    typeof r.week === 'number' &&
    typeof r.title === 'string' &&
    typeof r.description === 'string' &&
    typeof r.category === 'string' &&
    typeof r.priority === 'string' &&
    ['high', 'medium', 'low'].includes(r.priority as string) &&
    typeof r.estimatedImpact === 'number'
  )
}

/** 경쟁사 분석 항목 유효성 검사 */
function isValidCompetitorAnalysis(item: unknown): item is CompetitorAnalysis {
  if (!item || typeof item !== 'object') return false
  const c = item as Record<string, unknown>
  return (
    typeof c.url === 'string' &&
    typeof c.overallScore === 'number' &&
    Array.isArray(c.strengths) &&
    Array.isArray(c.weaknesses) &&
    Array.isArray(c.gaps)
  )
}

// ─── Phase 3: CMO 검증 에이전트 ───

/**
 * CMO 검증 에이전트 실행
 * 5개 에이전트 인사이트 + 점수 + 인용 결과를 요약하여 Executive Summary 생성
 * 실패 시 폴백 summary 반환 (진단 전체 실패 방지)
 */
export async function executeCmoAgent(
  agentResults: AIAgentResult[],
  freeAnalysis: FreeAnalysisData,
  citationResult: AICitationTrackingResult
): Promise<{ cmoSummary: string; cmoCostKrw: number }> {
  const { CMO_AGENT } = DIAGNOSIS_PAID_CONFIG
  const allInsights = dedupeInsights(agentResults.flatMap((r) => r.insights))

  try {
    const userMessage = buildCmoUserMessage(
      agentResults,
      freeAnalysis,
      citationResult
    )

    const aiPromise = executeAIRequest({
      systemPrompt: CMO_AGENT.systemPrompt,
      userMessage,
      maxTokens: CMO_AGENT.maxTokens,
      model: CMO_AGENT.model,
    })

    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error('CMO 에이전트 타임아웃')),
        CMO_AGENT.timeoutMs
      )
    })

    let response: Awaited<ReturnType<typeof executeAIRequest>>
    try {
      response = await Promise.race([aiPromise, timeoutPromise])
    } finally {
      clearTimeout(timeoutId)
    }
    const parsed = parseCmoResponse(response.content)
    const cmoCostKrw = calculateCostKrw(response.tokenUsage)

    if (parsed) {
      // G2: 우선순위 보정 적용 — CMO가 제안한 priority를 인사이트에 반영
      if (parsed.priority_adjustments?.length) {
        for (const adj of parsed.priority_adjustments) {
          const target = allInsights.find((i) => i.title === adj.insight_title)
          if (target) {
            target.priority = adj.suggested_priority
          }
        }
      }

      // G2: 구체성 플래그를 인사이트 evidence에 보충
      if (parsed.specificity_flags?.length) {
        for (const flag of parsed.specificity_flags) {
          const target = allInsights.find((i) => i.title === flag.insight_title)
          if (target) {
            const note = `[CMO 검증] ${flag.issue} → ${flag.suggestion}`
            target.evidence = target.evidence
              ? `${target.evidence}\n${note}`
              : note
          }
        }
      }

      // G2: 한국 시장 맥락을 executive_summary에 병합
      const summary = parsed.korean_market_notes
        ? `${parsed.executive_summary}\n\n[한국 시장 맥락] ${parsed.korean_market_notes}`
        : parsed.executive_summary

      return { cmoSummary: summary, cmoCostKrw }
    }

    return { cmoSummary: generateCmoSummaryFallback(allInsights), cmoCostKrw }
  } catch (err) {
    console.error('[executeCmoAgent] CMO 검증 실패, 폴백 사용', err)
    return {
      cmoSummary: generateCmoSummaryFallback(allInsights),
      cmoCostKrw: 0,
    }
  }
}

/**
 * CMO 에이전트용 사용자 메시지 생성
 * crawlData 제외 — 토큰 효율 (에이전트들이 이미 분석 완료)
 */
function buildCmoUserMessage(
  agentResults: AIAgentResult[],
  freeAnalysis: FreeAnalysisData,
  citationResult: AICitationTrackingResult
): string {
  const insightsSummary = agentResults
    .filter((r) => r.status === 'completed')
    .map((r) => {
      const counts = {
        critical: r.insights.filter((i) => i.severity === 'critical').length,
        warning: r.insights.filter((i) => i.severity === 'warning').length,
        info: r.insights.filter((i) => i.severity === 'info').length,
      }
      const topInsights = r.insights
        .slice(0, 3)
        .map((i) => `  - [${i.severity}] ${i.title}`)
        .join('\n')
      return `### ${r.agentId} (심각 ${counts.critical}, 주의 ${counts.warning}, 참고 ${counts.info})\n${topInsights}`
    })
    .join('\n\n')

  const score = freeAnalysis.overallScore
  const citation = citationResult.overallMentionRate

  return [
    '## 종합 점수',
    `- 전체: ${score.score}점 (${score.grade})`,
    `- AI 인용률: ${Math.round(citation * 100)}%`,
    '',
    '## 에이전트별 인사이트 요약',
    insightsSummary,
    '',
    '위 결과를 검증하고 Executive Summary를 생성해주세요.',
  ].join('\n')
}

const CMO_ISSUE_TYPES = ['contradiction', 'unsupported', 'duplicate'] as const

/** CMO issues_found 항목 유효성 검사 */
function isValidCmoIssue(
  item: unknown
): item is CmoVerificationResponse['issues_found'][number] {
  if (!item || typeof item !== 'object') return false
  const i = item as Record<string, unknown>
  return (
    typeof i.type === 'string' &&
    (CMO_ISSUE_TYPES as readonly string[]).includes(i.type) &&
    typeof i.description === 'string' &&
    Array.isArray(i.related_insights)
  )
}

/**
 * CMO AI 응답 JSON 파싱
 */
export function parseCmoResponse(
  content: string
): CmoVerificationResponse | null {
  const parsed = extractJsonFromContent(content)
  if (!parsed) return null

  if (
    typeof parsed.executive_summary !== 'string' ||
    typeof parsed.quality_score !== 'number'
  ) {
    return null
  }

  const result: CmoVerificationResponse = {
    executive_summary: parsed.executive_summary,
    quality_score: parsed.quality_score,
    issues_found: Array.isArray(parsed.issues_found)
      ? parsed.issues_found.filter(isValidCmoIssue)
      : [],
  }

  // G2: 우선순위 보정 파싱
  if (Array.isArray(parsed.priority_adjustments)) {
    result.priority_adjustments = parsed.priority_adjustments.filter(
      (
        item: unknown
      ): item is CmoVerificationResponse['priority_adjustments'] extends Array<
        infer T
      >
        ? T
        : never => {
        if (!item || typeof item !== 'object') return false
        const a = item as Record<string, unknown>
        return (
          typeof a.insight_title === 'string' &&
          typeof a.current_priority === 'number' &&
          typeof a.suggested_priority === 'number' &&
          typeof a.reason === 'string'
        )
      }
    )
  }

  // G2: 구체성 플래그 파싱
  if (Array.isArray(parsed.specificity_flags)) {
    result.specificity_flags = parsed.specificity_flags.filter(
      (
        item: unknown
      ): item is CmoVerificationResponse['specificity_flags'] extends Array<
        infer T
      >
        ? T
        : never => {
        if (!item || typeof item !== 'object') return false
        const f = item as Record<string, unknown>
        return (
          typeof f.insight_title === 'string' &&
          typeof f.issue === 'string' &&
          typeof f.suggestion === 'string'
        )
      }
    )
  }

  // G2: 한국 시장 맥락 파싱
  if (typeof parsed.korean_market_notes === 'string') {
    result.korean_market_notes = parsed.korean_market_notes
  }

  return result
}

/**
 * CMO 폴백 요약 — AI 실패 시 단순 집계
 */
export function generateCmoSummaryFallback(insights: AIInsight[]): string {
  const critical = insights.filter((i) => i.severity === 'critical')
  const warning = insights.filter((i) => i.severity === 'warning')
  const actionable = insights.filter((i) => i.actionable)

  const parts: string[] = []

  // 전체 요약
  parts.push(
    `이 사이트는 총 ${insights.length}개 항목을 분석한 결과, 심각 ${critical.length}개·주의 ${warning.length}개의 개선 포인트가 발견되었습니다.`
  )

  // 가장 긴급한 문제
  if (critical.length > 0) {
    const topCritical = critical
      .slice(0, 3)
      .map((i) => `"${i.title}"`)
      .join(', ')
    parts.push(
      `가장 시급한 문제는 ${topCritical}입니다. 이 항목들을 먼저 해결하면 검색 순위와 사용자 경험이 눈에 띄게 개선됩니다.`
    )
  }

  // 즉시 실행 가능한 항목
  if (actionable.length > 0) {
    parts.push(
      `${actionable.length}개 항목은 바로 실행할 수 있으며, 각 항목의 "이렇게 고치세요" 가이드를 따라 순서대로 진행하는 것을 권장합니다.`
    )
  }

  // 긍정적 마무리
  parts.push(
    '아래 90일 로드맵에 따라 Phase 1(즉시 실행)부터 차근차근 개선하면 3개월 내에 의미 있는 성과를 기대할 수 있습니다.'
  )

  return parts.join(' ')
}
