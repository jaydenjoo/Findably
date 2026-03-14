import type { SitemapData } from '../types'

/**
 * sitemap.xml 원문을 파싱하여 SitemapData를 반환.
 * n8n이 fetch한 XML 텍스트를 받아 파싱만 수행.
 *
 * @param raw - sitemap.xml 전체 텍스트 (null이면 파일 미존재)
 */
export function parseSitemap(raw: string | null): SitemapData {
  // 파일 미존재
  if (raw === null) {
    return { exists: false, url_count: 0, last_modified: null }
  }

  // BOM 제거
  const cleaned = raw.replace(/^\uFEFF/, '')

  // 빈 파일
  if (cleaned.trim() === '') {
    return { exists: true, url_count: 0, last_modified: null }
  }

  // sitemap index 여부 판별
  const isSitemapIndex = /<sitemapindex[\s>]/i.test(cleaned)

  // URL 개수 카운팅
  const urlCount = isSitemapIndex
    ? countMatches(cleaned, /<sitemap[\s>]/gi)
    : countMatches(cleaned, /<url[\s>]/gi)

  // lastmod 추출 → 가장 최신 날짜
  const lastModified = extractLatestLastmod(cleaned)

  return {
    exists: true,
    url_count: urlCount,
    last_modified: lastModified,
  }
}

/** 정규식 매치 개수 카운팅 */
function countMatches(text: string, pattern: RegExp): number {
  const matches = text.match(pattern)
  return matches ? matches.length : 0
}

/** 모든 <lastmod> 값 중 가장 최신(사전순 최대) 반환 */
function extractLatestLastmod(text: string): string | null {
  const lastmodPattern = /<lastmod>\s*([^<]+?)\s*<\/lastmod>/gi
  let latest: string | null = null
  let match: RegExpExecArray | null

  while ((match = lastmodPattern.exec(text)) !== null) {
    const value = match[1]?.trim()
    if (!value) continue

    if (latest === null || value > latest) {
      latest = value
    }
  }

  return latest
}
