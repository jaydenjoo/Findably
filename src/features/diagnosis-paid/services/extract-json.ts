/**
 * AI 응답에서 JSON 객체를 추출하는 공용 헬퍼
 *
 * 1차: ```json ... ``` 코드블록에서 추출
 * 2차: 최외곽 { ... } 패턴 매칭
 */
export function extractJsonFromContent(
  content: string
): Record<string, unknown> | null {
  try {
    const jsonMatch =
      content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/) ??
      content.match(/(\{[\s\S]*\})/)

    if (!jsonMatch?.[1]) return null

    return JSON.parse(jsonMatch[1]) as Record<string, unknown>
  } catch {
    return null
  }
}
