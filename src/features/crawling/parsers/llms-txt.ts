import type { LlmsTxtData } from '../types'

/**
 * llms.txt 원문을 파싱하여 LlmsTxtData를 반환.
 * n8n이 fetch한 텍스트를 받아 존재 여부 + 내용 반환.
 *
 * @param raw - llms.txt 전체 텍스트 (null이면 파일 미존재)
 */
export function parseLlmsTxt(raw: string | null): LlmsTxtData {
  // 파일 미존재
  if (raw === null) {
    return { exists: false, content: null }
  }

  // BOM 제거
  const cleaned = raw.replace(/^\uFEFF/, '')

  // 빈 파일 (공백/줄바꿈만)
  const trimmed = cleaned.trim()
  if (trimmed === '') {
    return { exists: true, content: null }
  }

  return { exists: true, content: trimmed }
}
