import OpenAI from 'openai'
import type { AIAdapterRequestParams, AIAdapterResponse } from './types'

/** 싱글턴 — Perplexity는 OpenAI 호환 API 사용 */
let _client: OpenAI | null = null

function getClient(): OpenAI {
  const apiKey = process.env.PERPLEXITY_API_KEY
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY 환경변수가 설정되지 않았습니다.')
  }
  if (!_client) {
    _client = new OpenAI({
      apiKey,
      baseURL: 'https://api.perplexity.ai',
    })
  }
  return _client
}

/**
 * Perplexity API 호출 (OpenAI 호환)
 *
 * PERPLEXITY_API_KEY 환경변수 필요.
 */
export async function executePerplexityRequest(
  params: AIAdapterRequestParams
): Promise<AIAdapterResponse> {
  const model = params.model ?? 'sonar-pro'

  const response = await getClient().chat.completions.create({
    model,
    max_tokens: params.maxTokens,
    messages: [
      { role: 'system', content: params.systemPrompt },
      { role: 'user', content: params.userMessage },
    ],
  })

  const content = response.choices[0]?.message?.content ?? ''

  return {
    content,
    tokenUsage: {
      input: response.usage?.prompt_tokens ?? 0,
      output: response.usage?.completion_tokens ?? 0,
    },
  }
}

/** Perplexity API 키 존재 여부 확인 */
export function isPerplexityAvailable(): boolean {
  return !!process.env.PERPLEXITY_API_KEY
}
