/** AI 어댑터 공통 요청 파라미터 */
export interface AIAdapterRequestParams {
  systemPrompt: string
  userMessage: string
  maxTokens: number
  model?: string
}

/** AI 어댑터 공통 응답 */
export interface AIAdapterResponse {
  content: string
  tokenUsage: {
    input: number
    output: number
  }
}
