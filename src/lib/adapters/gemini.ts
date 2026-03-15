import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AIAdapterRequestParams, AIAdapterResponse } from './types'

/** 싱글턴 — 빌드 시점 env 미설정 대비 lazy init */
let _client: GoogleGenerativeAI | null = null

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY 환경변수가 설정되지 않았습니다.')
  }
  if (!_client) {
    _client = new GoogleGenerativeAI(apiKey)
  }
  return _client
}

/**
 * Google Gemini API 호출
 *
 * GOOGLE_AI_API_KEY 환경변수 필요.
 */
export async function executeGeminiRequest(
  params: AIAdapterRequestParams
): Promise<AIAdapterResponse> {
  const modelName = params.model ?? 'gemini-1.5-pro'

  const model = getClient().getGenerativeModel({
    model: modelName,
    systemInstruction: params.systemPrompt,
    generationConfig: {
      maxOutputTokens: params.maxTokens,
    },
  })

  const result = await model.generateContent(params.userMessage)
  const response = result.response
  const content = response.text()

  const usageMetadata = response.usageMetadata
  const inputTokens = usageMetadata?.promptTokenCount ?? 0
  const outputTokens = usageMetadata?.candidatesTokenCount ?? 0

  return {
    content,
    tokenUsage: {
      input: inputTokens,
      output: outputTokens,
    },
  }
}

/** Gemini API 키 존재 여부 확인 */
export function isGeminiAvailable(): boolean {
  return !!process.env.GOOGLE_AI_API_KEY
}
