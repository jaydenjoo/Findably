import OpenAI from 'openai'
import type { AIAdapterRequestParams, AIAdapterResponse } from './types'

/** 싱글턴 — 빌드 시점 env 미설정 대비 lazy init */
let _client: OpenAI | null = null

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY 환경변수가 설정되지 않았습니다.')
  }
  if (!_client) {
    _client = new OpenAI({ apiKey })
  }
  return _client
}

/**
 * OpenAI (ChatGPT) API 호출
 *
 * OpenAI SDK가 OPENAI_API_KEY 환경변수를 자동으로 읽음.
 */
export async function executeOpenAIRequest(
  params: AIAdapterRequestParams
): Promise<AIAdapterResponse> {
  const model = params.model ?? 'gpt-4o'

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

/** OpenAI API 키 존재 여부 확인 */
export function isOpenAIAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY
}
