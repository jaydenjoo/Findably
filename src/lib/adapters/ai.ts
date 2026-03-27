import Anthropic from '@anthropic-ai/sdk'
import { DIAGNOSIS_PAID_CONFIG } from '@/config/diagnosis-paid'
import type { AIAdapterRequestParams, AIAdapterResponse } from './types'

/** 싱글턴 — 빌드 시점 env 미설정 대비 lazy init */
let _client: Anthropic | null = null

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.')
  }
  if (!_client) {
    _client = new Anthropic({ apiKey })
  }
  return _client
}

/**
 * Claude API 호출 — 단일 에이전트 실행용
 *
 * Anthropic SDK가 ANTHROPIC_API_KEY 환경변수를 자동으로 읽음.
 * 어댑터 패턴: 추후 OpenAI/Gemini로 교체 가능.
 */
export async function executeAIRequest(
  params: AIAdapterRequestParams
): Promise<AIAdapterResponse> {
  const model = params.model ?? DIAGNOSIS_PAID_CONFIG.MODEL

  try {
    const response = await getClient().messages.create({
      model,
      max_tokens: params.maxTokens,
      system: params.systemPrompt,
      messages: [{ role: 'user', content: params.userMessage }],
    })

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock) {
      console.warn(
        '[askClaude] Claude 응답에 text 블록 없음. content types:',
        response.content.map((b) => b.type)
      )
    }
    const content = textBlock?.text ?? ''

    return {
      content,
      tokenUsage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    }
  } catch (error: unknown) {
    let errorCategory = ''

    // Anthropic SDK의 APIError에서 status 코드 확인
    if (
      error instanceof Error &&
      'status' in error &&
      typeof error.status === 'number'
    ) {
      const status = error.status
      if (status === 429) {
        errorCategory = '[rate_limit] '
      } else if (status === 401 || status === 403) {
        errorCategory = '[auth_error] '
      } else if (status >= 500) {
        errorCategory = '[server_error] '
      }
    } else if (
      error instanceof Error &&
      error.message.toLowerCase().includes('timeout')
    ) {
      errorCategory = '[timeout] '
    }

    const message = error instanceof Error ? error.message : 'AI API 호출 실패'
    console.error(
      '[executeAIRequest] Claude API 오류:',
      errorCategory + message
    )
    throw new Error(`AI 분석 실패: ${errorCategory}${message}`)
  }
}

/**
 * 토큰 사용량 → KRW 비용 계산
 */
export function calculateCostKrw(tokenUsage: {
  input: number
  output: number
}): number {
  const { TOKEN_COST_USD, USD_TO_KRW } = DIAGNOSIS_PAID_CONFIG
  const inputCostUsd = (tokenUsage.input / 1_000_000) * TOKEN_COST_USD.input
  const outputCostUsd = (tokenUsage.output / 1_000_000) * TOKEN_COST_USD.output
  return Math.round((inputCostUsd + outputCostUsd) * USD_TO_KRW)
}
