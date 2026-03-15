import Anthropic from '@anthropic-ai/sdk'
import { DIAGNOSIS_PAID_CONFIG } from '@/config/diagnosis-paid'

/** AI 요청 파라미터 */
interface AIRequestParams {
  systemPrompt: string
  userMessage: string
  maxTokens: number
  model?: string
}

/** AI 응답 */
interface AIResponse {
  content: string
  tokenUsage: {
    input: number
    output: number
  }
}

/** 싱글턴 — 빌드 시점 env 미설정 대비 lazy init */
let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic()
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
  params: AIRequestParams
): Promise<AIResponse> {
  const model = params.model ?? DIAGNOSIS_PAID_CONFIG.MODEL

  const response = await getClient().messages.create({
    model,
    max_tokens: params.maxTokens,
    system: params.systemPrompt,
    messages: [{ role: 'user', content: params.userMessage }],
  })

  const textBlock = response.content.find((block) => block.type === 'text')
  const content = textBlock?.text ?? ''

  return {
    content,
    tokenUsage: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    },
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
