/**
 * 유료 분석 에이전트 재시도 로직
 *
 * Phase 3 Fix 5+/6/8 (2026-04-06):
 * - 전체 retry 단계에 60초 race timeout (Fix 5+)
 * - retry 병렬화: for 직렬 → Promise.allSettled (Fix 6)
 * - Opus 2차 retry 제거: Sonnet 1회만 시도 (Fix 8)
 *
 * 이전 구현(Opus fallback)은 시간 폭발의 주범이었음.
 * Opus는 60초+ 걸리고 직렬 retry 시 retry 단계만 120초+ 소비.
 * Sonnet 1회 + 폴백(룰 기반 변환)으로 충분한 품질 확보 가능.
 */

import { executeAIRequest } from '@/lib/adapters/ai'
import { DIAGNOSIS_PAID_CONFIG } from '@/config/diagnosis-paid'
import { parseAgentResponse, buildUserMessage } from './run-diagnosis-paid'
import type { AIAgentResult, AgentId } from '@/features/diagnosis-paid'
import type { CrawlData } from '@/features/crawling'
import type { SiteContext, AnalysisAgentId } from './run-diagnosis-paid'

interface ExecuteAgentWithRetryParams {
  agentId: AnalysisAgentId
  systemPrompt: string
  maxTokens: number
  crawlData: CrawlData
  url: string
  context: SiteContext
  model?: string // 재시도 시 모델 override
  retryCount: number
  diagnosisId: string
}

/** Retry 단계 전체 시간 한도 (Fix 5+) */
const RETRY_PHASE_TIMEOUT_MS = 60 * 1000

/**
 * 실패/빈 에이전트 재시도 (Sonnet 1회, 병렬, 60초 한도)
 *
 * 로직:
 * 1. failedAgentIds 모두를 Promise.allSettled로 병렬 재실행 (Sonnet 1회)
 * 2. 전체 retry 단계가 60초 race를 초과하면 미완료 분은 empty 유지
 * 3. Opus fallback 제거 — runDiagnosisPaid의 룰 기반 폴백이 그 역할 수행
 *
 * @param diagnosisId - 진단 ID (로깅용)
 * @param failedAgentIds - 실패한 에이전트 ID 배열
 * @param crawlData - 크롤링 데이터
 * @param freeAnalysis - 무료 분석 데이터
 * @returns 재시도 결과 배열
 */
export async function retryFailedAgentsWithFallback(
  diagnosisId: string,
  failedAgentIds: AgentId[],
  crawlData: CrawlData,
  freeAnalysis: {
    url: string
    targetKeywords?: string[]
    competitorUrls?: string[]
    industry?: string
  },
  context: SiteContext
): Promise<AIAgentResult[]> {
  if (failedAgentIds.length === 0) {
    return []
  }

  // analysisAgentId만 필터링 (CMO 제외)
  const validFailedIds = failedAgentIds.filter(
    (id) => id !== 'cmo'
  ) as AnalysisAgentId[]

  if (validFailedIds.length === 0) {
    return []
  }

  console.log(
    `[retryFailedAgentsWithFallback:${diagnosisId}] ${validFailedIds.length}개 에이전트 병렬 재시도 (Sonnet, 60s 한도):`,
    validFailedIds
  )

  // Fix 6: 병렬 재시도 (이전: for 직렬)
  const retryPromises = validFailedIds.map((agentId) => {
    const agentConfig = DIAGNOSIS_PAID_CONFIG.AGENTS.find(
      (a) => a.id === agentId
    )
    if (!agentConfig) {
      console.warn(
        `[retryFailedAgentsWithFallback:${diagnosisId}] ${agentId} 설정 찾을 수 없음`
      )
      return Promise.resolve(buildEmptyResult(agentId, '에이전트 설정 누락'))
    }

    return executeAgentWithRetry({
      agentId,
      systemPrompt: agentConfig.systemPrompt,
      maxTokens: DIAGNOSIS_PAID_CONFIG.RETRY_MAX_TOKENS,
      crawlData,
      url: freeAnalysis.url,
      context,
      model: DIAGNOSIS_PAID_CONFIG.MODEL, // Fix 8: Sonnet만 (Opus 제거)
      retryCount: 1,
      diagnosisId,
    }).catch((error) => {
      console.error(
        `[retryFailedAgentsWithFallback:${diagnosisId}] ${agentId} 재시도 예외:`,
        error instanceof Error ? error.message : String(error)
      )
      return buildEmptyResult(
        agentId,
        `재시도 예외: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    })
  })

  // Fix 5+: 전체 retry 단계 60초 race timeout
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<AIAgentResult[]>((resolve) => {
    timeoutId = setTimeout(() => {
      console.warn(
        `[retryFailedAgentsWithFallback:${diagnosisId}] 전체 retry 60초 한도 초과 — 미완료 에이전트는 empty 유지`
      )
      // 한도 초과 시 모두 empty로 처리 (개별 fetch는 background에 살아있을 수 있지만 결과는 반영 안 함)
      resolve(
        validFailedIds.map((id) =>
          buildEmptyResult(id, '전체 retry 60초 한도 초과')
        )
      )
    }, RETRY_PHASE_TIMEOUT_MS)
  })

  try {
    const result = await Promise.race([
      Promise.all(retryPromises),
      timeoutPromise,
    ])
    return result
  } finally {
    clearTimeout(timeoutId)
  }
}

/** empty 상태 결과 빌더 */
function buildEmptyResult(agentId: AgentId, error: string): AIAgentResult {
  return {
    agentId,
    status: 'empty',
    insights: [],
    tokenUsage: { input: 0, output: 0 },
    durationMs: 0,
    error,
  }
}

/**
 * 단일 에이전트 재시도 실행 (with 에러 핸들링)
 *
 * @param params - 실행 파라미터
 * @returns 에이전트 실행 결과
 */
async function executeAgentWithRetry(
  params: ExecuteAgentWithRetryParams
): Promise<AIAgentResult> {
  const {
    agentId,
    systemPrompt,
    maxTokens,
    crawlData,
    url,
    context,
    model,
    retryCount,
    diagnosisId,
  } = params

  const agentStart = Date.now()

  try {
    const userMessage = buildUserMessage({
      agentId,
      crawlData,
      url,
      context,
    })

    const response = await executeAIRequest({
      systemPrompt,
      userMessage,
      maxTokens,
      model,
    })

    const insights = parseAgentResponse(agentId, response.content)

    const status = insights.length > 0 ? 'completed' : 'empty'

    if (status === 'empty') {
      console.warn(
        `[executeAgentWithRetry:${diagnosisId}:${agentId}:retry${retryCount}] API 성공했으나 인사이트 0개. response 앞 300자:`,
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
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    console.error(
      `[executeAgentWithRetry:${diagnosisId}:${agentId}:retry${retryCount}] 실행 실패:`,
      errorMessage
    )

    return {
      agentId,
      status: 'failed',
      insights: [],
      tokenUsage: { input: 0, output: 0 },
      durationMs: Date.now() - agentStart,
      error: errorMessage,
    }
  }
}
