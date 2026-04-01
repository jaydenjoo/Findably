/**
 * 유료 분석 에이전트 재시도 로직
 *
 * 기존 retryFailedAgents()에 Opus fallback 추가:
 * 1차 실패 → 2차 Opus로 재시도 → 2차도 실패 시 empty 유지
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

/**
 * 실패/빈 에이전트 재시도 (1차 Sonnet → 2차 Opus fallback)
 *
 * 로직:
 * 1. failedAgentIds에 해당하는 에이전트만 재실행
 * 2. 1차 재시도: Sonnet (동일 모델)
 * 3. 1차 실패 시 2차 재시도: Opus로 fallback
 * 4. 2차도 실패 시: empty 상태 유지
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
    `[retryFailedAgentsWithFallback:${diagnosisId}] ${validFailedIds.length}개 에이전트 1차 재시도 (Sonnet):`,
    validFailedIds
  )

  // 1차 재시도: 동일 모델(Sonnet) + 축소 토큰
  const firstRetryResults: AIAgentResult[] = []

  for (const agentId of validFailedIds) {
    const agentConfig = DIAGNOSIS_PAID_CONFIG.AGENTS.find(
      (a) => a.id === agentId
    )
    if (!agentConfig) {
      console.warn(
        `[retryFailedAgentsWithFallback:${diagnosisId}] ${agentId} 설정 찾을 수 없음`
      )
      continue
    }

    try {
      const result = await executeAgentWithRetry({
        agentId,
        systemPrompt: agentConfig.systemPrompt,
        maxTokens: DIAGNOSIS_PAID_CONFIG.RETRY_MAX_TOKENS,
        crawlData,
        url: freeAnalysis.url,
        context,
        model: DIAGNOSIS_PAID_CONFIG.MODEL, // 1차: Sonnet
        retryCount: 1,
        diagnosisId,
      })

      firstRetryResults.push(result)

      // 1차 성공 → 2차 스킵
      if (result.status === 'completed') {
        console.log(
          `[retryFailedAgentsWithFallback:${diagnosisId}] ${agentId} 1차 성공 → 2차 Opus fallback 스킵`
        )
      } else {
        // 1차 실패/empty → 2차 Opus fallback 시도
        console.warn(
          `[retryFailedAgentsWithFallback:${diagnosisId}] ${agentId} 1차 ${result.status} → 2차 Opus fallback 시작`
        )

        const secondRetryResult = await executeAgentWithRetry({
          agentId,
          systemPrompt: agentConfig.systemPrompt,
          maxTokens: DIAGNOSIS_PAID_CONFIG.RETRY_MAX_TOKENS,
          crawlData,
          url: freeAnalysis.url,
          context,
          model: DIAGNOSIS_PAID_CONFIG.MODEL_OPUS, // 2차: Opus
          retryCount: 2,
          diagnosisId,
        })

        // 2차 결과로 1차 결과 덮어쓰기
        const idx = firstRetryResults.findIndex((r) => r.agentId === agentId)
        if (idx !== -1) {
          firstRetryResults[idx] = secondRetryResult
        }

        if (secondRetryResult.status === 'completed') {
          console.log(
            `[retryFailedAgentsWithFallback:${diagnosisId}] ${agentId} 2차 Opus 성공`
          )
        } else {
          console.warn(
            `[retryFailedAgentsWithFallback:${diagnosisId}] ${agentId} 2차 Opus도 ${secondRetryResult.status} → empty 유지`
          )
        }
      }
    } catch (error) {
      console.error(
        `[retryFailedAgentsWithFallback:${diagnosisId}] ${agentId} 재시도 중 예외:`,
        error instanceof Error ? error.message : String(error)
      )
      // 예외 발생 시 empty 상태 결과 추가
      firstRetryResults.push({
        agentId,
        status: 'empty',
        insights: [],
        tokenUsage: { input: 0, output: 0 },
        durationMs: 0,
        error: `재시도 중 예외: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    }
  }

  return firstRetryResults
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
