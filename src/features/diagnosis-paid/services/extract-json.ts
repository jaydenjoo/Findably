/**
 * AI 응답에서 JSON 객체를 추출하는 공용 헬퍼
 *
 * 추출 순서 (첫 번째 성공 시 반환):
 * 1. ```json ... ``` 코드블록
 * 2. ``` ... ``` 코드블록 (언어 미지정)
 * 3. 최외곽 { ... } 객체
 * 4. 최외곽 [ ... ] 배열 → { items: [...] } 래핑
 * 5. 전체 content를 직접 JSON.parse 시도
 */
export function extractJsonFromContent(
  content: string
): Record<string, unknown> | null {
  // 빈 입력 방어
  if (!content || content.trim().length === 0) {
    console.warn('[extractJsonFromContent] 빈 content 입력')
    return null
  }

  // 1차: ```json ... ``` 코드블록
  const jsonFenceMatch = content.match(/```json\s*\n?([\s\S]*?)\n?\s*```/)
  if (jsonFenceMatch?.[1]) {
    const result = tryParseJson(jsonFenceMatch[1].trim())
    if (result) return result
  }

  // 2차: ``` ... ``` 코드블록 (언어 미지정)
  const plainFenceMatch = content.match(/```\s*\n?([\s\S]*?)\n?\s*```/)
  if (plainFenceMatch?.[1]) {
    const result = tryParseJson(plainFenceMatch[1].trim())
    if (result) return result
  }

  // 3차: 최외곽 { ... } 객체
  const objMatch = content.match(/(\{[\s\S]*\})/)
  if (objMatch?.[1]) {
    const result = tryParseJson(objMatch[1].trim())
    if (result) return result
  }

  // 4차: 최외곽 [ ... ] 배열 → { items: [...] } 래핑
  const arrMatch = content.match(/(\[[\s\S]*\])/)
  if (arrMatch?.[1]) {
    try {
      const parsed = JSON.parse(arrMatch[1]) as unknown
      if (Array.isArray(parsed)) {
        return { insights: parsed }
      }
    } catch {
      // 5차로 계속
    }
  }

  // 5차: 전체 content를 직접 JSON.parse 시도
  const directResult = tryParseJson(content.trim())
  if (directResult) return directResult

  // 모든 시도 실패
  console.warn(
    '[extractJsonFromContent] JSON 추출 실패. content 앞 300자:',
    content.slice(0, 300)
  )
  return null
}

/** JSON 문자열 파싱 시도 — 성공 시 Record, 실패 시 null */
function tryParseJson(str: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(str) as unknown
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>
    }
    return null
  } catch {
    return null
  }
}
