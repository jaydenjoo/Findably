import type { MobileData } from '../types'

/**
 * HTML 원문에서 모바일 호환성을 판별하여 MobileData를 반환.
 * n8n이 fetch한 HTML 텍스트를 받아 meta viewport + 터치 친화성 신호를 분석.
 *
 * @param html - 페이지 HTML 전체 텍스트 (null이면 미수집)
 */
export function checkMobile(html: string | null): MobileData {
  if (html === null || html.trim() === '') {
    return {
      viewport_configured: false,
      touch_friendly: false,
      issues: ['viewport_missing'],
    }
  }

  // BOM 제거
  const cleaned = html.replace(/^\uFEFF/, '')

  const issues: string[] = []

  // ─── 1. viewport 분석 ───
  const viewportContent = extractViewportContent(cleaned)
  const viewportConfigured = analyzeViewport(viewportContent, issues)

  // ─── 2. 터치 친화성 판정 ───
  const hasFixedWidth = detectFixedWidth(cleaned)
  if (hasFixedWidth) {
    issues.push('fixed_width_layout')
  }

  const touchFriendly = viewportConfigured && !hasFixedWidth

  return {
    viewport_configured: viewportConfigured,
    touch_friendly: touchFriendly,
    issues,
  }
}

/** <meta name="viewport" content="..."> 값 추출 */
function extractViewportContent(html: string): string | null {
  // name이 content보다 앞에 있는 경우
  const match =
    /<meta\s+[^>]*name\s*=\s*["']viewport["'][^>]*content\s*=\s*["']([^"']*)["'][^>]*\/?>/i.exec(
      html
    )
  if (match?.[1]?.trim()) return match[1].trim()

  // content가 name보다 앞에 있는 경우
  const altMatch =
    /<meta\s+[^>]*content\s*=\s*["']([^"']*)["'][^>]*name\s*=\s*["']viewport["'][^>]*\/?>/i.exec(
      html
    )
  if (altMatch?.[1]?.trim()) return altMatch[1].trim()

  return null
}

/**
 * viewport content 속성을 분석하여 viewport_configured 여부를 반환.
 * 문제 발견 시 issues 배열에 추가.
 */
function analyzeViewport(content: string | null, issues: string[]): boolean {
  if (content === null) {
    issues.push('viewport_missing')
    return false
  }

  const hasDeviceWidth = /width\s*=\s*device-width/i.test(content)
  if (!hasDeviceWidth) {
    issues.push('viewport_no_device_width')
  }

  // 확대 차단 체크
  if (/user-scalable\s*=\s*no/i.test(content)) {
    issues.push('zoom_disabled')
  }

  // 확대 제한 체크
  const maxScaleMatch = /maximum-scale\s*=\s*([\d.]+)/i.exec(content)
  if (maxScaleMatch?.[1]) {
    const maxScale = parseFloat(maxScaleMatch[1])
    if (maxScale <= 1) {
      issues.push('zoom_limited')
    }
  }

  // viewport 태그 존재 + width=device-width → configured
  return hasDeviceWidth
}

/** body/html 태그의 인라인 스타일에서 고정 너비 감지 */
function detectFixedWidth(html: string): boolean {
  // <body style="...width: 960px..."> 또는 <html style="...width: 1024px...">
  const bodyStyleMatch =
    /<body\s+[^>]*style\s*=\s*["']([^"']*)["'][^>]*>/i.exec(html)
  if (bodyStyleMatch?.[1] && /width\s*:\s*\d+px/i.test(bodyStyleMatch[1])) {
    return true
  }

  const htmlStyleMatch =
    /<html\s+[^>]*style\s*=\s*["']([^"']*)["'][^>]*>/i.exec(html)
  if (htmlStyleMatch?.[1] && /width\s*:\s*\d+px/i.test(htmlStyleMatch[1])) {
    return true
  }

  return false
}
