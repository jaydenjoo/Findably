import { createAdminClient } from '@/lib/supabase/admin'
import { executeAIRequest, calculateCostKrw } from '@/lib/adapters/ai'
import { DIAGNOSIS_PAID_CONFIG } from '@/config/diagnosis-paid'
import type { CrawlData } from '@/features/crawling'
import type {
  OverallScore,
  CategoryScore,
  QuickWin,
  AICitationPossibilityScore,
} from '@/features/diagnosis-free'
import type { Json } from '@/types/database'
import type {
  AgentId,
  AICitationTrackingResult,
  AIAgentResult,
  AIInsight,
  CmoVerificationResponse,
  CompetitorAnalysis,
  DiagnosisStatus,
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

const DIAGNOSIS_STATUS: Record<string, DiagnosisStatus> = {
  ANALYZING: 'analyzing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

/** 기존 무료 분석 데이터 (analysis_data 내부 구조) */
interface FreeAnalysisData {
  overallScore: OverallScore
  categoryScores: CategoryScore[]
  quickWins: QuickWin[]
  aiCitation: AICitationPossibilityScore
}

/** analysis_data JSON을 FreeAnalysisData로 안전하게 파싱 */
function isValidFreeAnalysis(data: unknown): data is FreeAnalysisData {
  if (!data || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  return (
    'overallScore' in obj &&
    'categoryScores' in obj &&
    'quickWins' in obj &&
    'aiCitation' in obj
  )
}

/** 사이트 컨텍스트 (DB에서 조회) */
interface SiteContext {
  targetKeywords: string[]
  competitorUrls: string[]
  industry: string
}

/** executeAgent 파라미터 (6개 → 1 객체) */
/** 5개 분석 에이전트 ID (CMO 제외) */
type AnalysisAgentId = Exclude<AgentId, 'cmo'>

interface ExecuteAgentParams {
  agentId: AnalysisAgentId
  systemPrompt: string
  maxTokens: number
  crawlData: CrawlData
  url: string
  context: SiteContext
}

/**
 * 무료 분석(analysis_data) 완료를 폴링 대기
 * 결제가 무료 분석 완료 전에 트리거되는 타이밍 이슈 대응
 */
async function waitForFreeAnalysis(
  diagnosisId: string,
  maxAttempts = 3,
  intervalMs = 10_000
): Promise<FreeAnalysisData | null> {
  const supabase = createAdminClient()

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { data } = await supabase
      .from('diagnoses')
      .select('analysis_data')
      .eq('id', diagnosisId)
      .single()

    const raw = data?.analysis_data
    if (isValidFreeAnalysis(raw)) {
      console.log(`[runDiagnosisPaid] analysis_data 확인 (${attempt}번째 시도)`)
      return raw
    }

    if (attempt < maxAttempts) {
      console.log(
        `[runDiagnosisPaid] analysis_data 대기 중... (${attempt}/${maxAttempts})`
      )
      await new Promise((resolve) => setTimeout(resolve, intervalMs))
    }
  }

  return null
}

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

    const crawlData = diagnosis.crawl_data as unknown as CrawlData

    if (!crawlData) {
      return {
        success: false,
        error: '크롤링 데이터가 없습니다. 먼저 URL 분석을 완료해주세요.',
      }
    }

    // analysis_data 확인 — 없으면 폴링 대기 (무료 분석 완료 대기)
    let freeAnalysis: FreeAnalysisData | null = isValidFreeAnalysis(
      diagnosis.analysis_data
    )
      ? diagnosis.analysis_data
      : null

    if (!freeAnalysis) {
      console.log('[runDiagnosisPaid] analysis_data 없음 — 폴링 시작')
      freeAnalysis = await waitForFreeAnalysis(diagnosisId)
    }

    // 폴링 후에도 없으면 실패 반환 (무료 분석 자동 트리거는 trigger-analysis API에서 처리)
    if (!freeAnalysis) {
      return {
        success: false,
        error:
          '무료 분석 데이터가 준비되지 않았습니다. 잠시 후 다시 시도해주세요.',
      }
    }

    // 2. 상태를 'analyzing'으로 업데이트
    await supabase
      .from('diagnoses')
      .update({ status: DIAGNOSIS_STATUS.ANALYZING })
      .eq('id', diagnosisId)

    // 3. Phase 1 — 5개 에이전트 병렬 실행 (글로벌 2분 타임아웃)
    const context: SiteContext = {
      targetKeywords: diagnosis.target_keywords ?? [],
      competitorUrls: diagnosis.competitor_urls ?? [],
      industry: diagnosis.industry ?? '',
    }

    const GLOBAL_TIMEOUT_MS = 2 * 60 * 1000 // 2분

    const agentsPromise = Promise.all([
      executeAgentsParallel(crawlData, diagnosis.url, context),
      trackAICitation({
        url: diagnosis.url,
        keywords: context.targetKeywords,
      }),
    ])

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`글로벌 타임아웃: ${GLOBAL_TIMEOUT_MS / 1000}초 초과`))
      }, GLOBAL_TIMEOUT_MS)
    })

    const [agentResults, citationResult] = await Promise.race([
      agentsPromise,
      timeoutPromise,
    ])

    // 4. 성공/실패 집계
    const successResults = agentResults.filter((r) => r.status === 'completed')
    const failedAgents = agentResults
      .filter((r) => r.status === 'failed')
      .map((r) => r.agentId)

    if (successResults.length < DIAGNOSIS_PAID_CONFIG.MIN_SUCCESS_COUNT) {
      await supabase
        .from('diagnoses')
        .update({ status: DIAGNOSIS_STATUS.FAILED })
        .eq('id', diagnosisId)

      return {
        success: false,
        error: `최소 ${DIAGNOSIS_PAID_CONFIG.MIN_SUCCESS_COUNT}개 에이전트가 성공해야 합니다. (${successResults.length}/5 성공)`,
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
      totalCostKrw,
      totalDurationMs,
    })

    // 6. DB 저장
    const { error: updateError } = await supabase
      .from('diagnoses')
      .update({
        analysis_data: paidAnalysisData as unknown as Json,
        status: DIAGNOSIS_STATUS.COMPLETED,
        completed_at: new Date().toISOString(),
        tier: 'paid',
      })
      .eq('id', diagnosisId)

    if (updateError) {
      console.error('[runDiagnosisPaid] DB 업데이트 실패', updateError)
      return { success: false, error: 'DB 업데이트에 실패했습니다.' }
    }

    return {
      success: true,
      ...(failedAgents.length > 0 ? { failedAgents } : {}),
    }
  } catch (err) {
    console.error('[runDiagnosisPaid]', err)

    await supabase
      .from('diagnoses')
      .update({ status: DIAGNOSIS_STATUS.FAILED })
      .eq('id', diagnosisId)

    return {
      success: false,
      error:
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.',
    }
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

  return {
    agentId,
    status: 'completed',
    insights,
    rawResponse: response.content,
    tokenUsage: response.tokenUsage,
    durationMs: Date.now() - agentStart,
  }
}

// ─── 프롬프트 빌딩 ───

interface BuildUserMessageParams {
  agentId: Exclude<AgentId, 'cmo'>
  crawlData: CrawlData
  url: string
  context: SiteContext
}

/**
 * 에이전트별 사용자 메시지 생성
 */
function buildUserMessage(params: BuildUserMessageParams): string {
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
    `페이지 크기: ${Math.round(l1.page_size_bytes / 1024)}KB`,
    `로드 시간: ${l1.load_time_ms}ms`,
    `언어: ${l1.html_lang || '미설정'}`,
  ].join('\n')
}

/**
 * CrawlData → 텍스트 요약 (Content Agent 데이터 품질 강화 포함)
 */
export function buildCrawlSummary(crawlData: CrawlData): string {
  const parts: string[] = []

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
    parts.push(
      [
        '### PageSpeed',
        `- Performance: ${ps.performance_score}`,
        `- LCP: ${ps.lcp_ms}ms`,
        `- CLS: ${ps.cls}`,
        `- FID: ${ps.fid_ms}ms`,
        `- TTFB: ${ps.ttfb_ms}ms`,
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
    parts.push(
      [
        '### SSL',
        `- 등급: ${ssl.grade ?? 'N/A'}`,
        `- 유효: ${ssl.valid ? 'Y' : 'N'}`,
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

  if (crawlData.cms?.detected) {
    parts.push(`### CMS\n- 감지: ${crawlData.cms.detected}`)
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
      console.error(`[parseAgentResponse:${agentId}] JSON을 찾을 수 없음`)
      return []
    }

    if (Array.isArray(parsed.insights)) {
      return (parsed.insights as Record<string, unknown>[])
        .filter(isValidInsight)
        .map(normalizeInsight)
    }

    return []
  } catch (err) {
    console.error(`[parseAgentResponse:${agentId}] 파싱 실패`, err)
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
export function normalizeInsight(item: Record<string, unknown>): AIInsight {
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
  totalCostKrw: number
  totalDurationMs: number
}

/**
 * 에이전트 결과 합산 → PaidAnalysisData (Phase 2 + 3)
 */
async function aggregateResults(
  params: AggregateResultsParams
): Promise<PaidAnalysisData> {
  const {
    freeAnalysis,
    agentResults,
    citationResult,
    totalCostKrw,
    totalDurationMs,
  } = params
  const allInsights = agentResults.flatMap((r) => r.insights)

  const competitorsResult = agentResults.find(
    (r) => r.agentId === 'competitors'
  )
  const parsed = parseCompetitorsResult(competitorsResult)
  const { competitors } = parsed

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
    quickWins: freeAnalysis.quickWins,
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
    categoryScores: freeAnalysis.categoryScores,
    quickWins: freeAnalysis.quickWins,
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
  const allInsights = agentResults.flatMap((r) => r.insights)

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
      return { cmoSummary: parsed.executive_summary, cmoCostKrw }
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

  return {
    executive_summary: parsed.executive_summary,
    quality_score: parsed.quality_score,
    issues_found: Array.isArray(parsed.issues_found)
      ? parsed.issues_found.filter(isValidCmoIssue)
      : [],
  }
}

/**
 * CMO 폴백 요약 — AI 실패 시 단순 집계
 */
export function generateCmoSummaryFallback(insights: AIInsight[]): string {
  const critical = insights.filter((i) => i.severity === 'critical').length
  const warning = insights.filter((i) => i.severity === 'warning').length
  const info = insights.filter((i) => i.severity === 'info').length

  return `총 ${insights.length}개 인사이트 발견: 심각 ${critical}개, 주의 ${warning}개, 참고 ${info}개`
}
