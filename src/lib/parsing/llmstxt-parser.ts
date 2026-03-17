import type { LlmsTxtData } from '@/features/crawling/types'

const TIMEOUT_MS = 5_000

/**
 * baseUrl에서 llms.txt / llms-full.txt를 HTTP fetch하여 파싱한다.
 *
 * - llms.txt: AI 크롤러용 사이트 요약
 * - llms-full.txt: 상세 버전 (존재 여부만 체크)
 * - 5초 타임아웃, 실패 시 exists=false 반환
 *
 * @param baseUrl - 프로토콜 포함 도메인 (e.g. "https://example.com")
 * @returns LlmsTxtData
 */
export async function fetchLlmsTxt(baseUrl: string): Promise<LlmsTxtData> {
  const normalized = baseUrl.replace(/\/+$/, '')

  const [mainResult, fullResult] = await Promise.allSettled([
    fetchText(`${normalized}/llms.txt`),
    fetchText(`${normalized}/llms-full.txt`),
  ])

  const mainContent =
    mainResult.status === 'fulfilled' ? mainResult.value : null
  const fullContent =
    fullResult.status === 'fulfilled' ? fullResult.value : null

  if (!mainContent) {
    return { exists: false, content: null, hasFullVersion: !!fullContent }
  }

  // BOM 제거 + 빈 문서 체크
  const cleaned = mainContent.replace(/^\uFEFF/, '').trim()
  if (cleaned.length === 0) {
    return { exists: false, content: null, hasFullVersion: !!fullContent }
  }

  return {
    exists: true,
    content: cleaned,
    hasFullVersion: !!fullContent,
  }
}

/**
 * URL에서 텍스트를 fetch한다. 2xx + text/* 계열만 유효.
 * 타임아웃 또는 에러 시 null 반환.
 */
async function fetchText(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Findably-Bot/1.0' },
    })

    clearTimeout(timeoutId)

    if (!response.ok) return null

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('text/')) {
      return null
    }

    const text = await response.text()
    return text || null
  } catch {
    return null
  }
}
