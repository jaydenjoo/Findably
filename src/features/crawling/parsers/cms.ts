import type { CmsData } from '../types'
import { CMS_SIGNATURES } from '../constants'

interface CmsMatch {
  name: string
  confidence: number
  category: 'cms' | 'framework'
}

/**
 * HTML 원문에서 CMS/프레임워크를 감지하여 CmsData를 반환.
 * n8n이 fetch한 HTML 텍스트를 받아 패턴 매칭만 수행.
 *
 * @param html - 페이지 HTML 전체 텍스트 (null이면 미수집)
 */
export function detectCms(html: string | null): CmsData {
  if (html === null || html.trim() === '') {
    return { detected: null, confidence: 0, technologies: [] }
  }

  // BOM 제거
  const cleaned = html.replace(/^\uFEFF/, '')

  // meta generator 추출
  const generator = extractMetaGenerator(cleaned)

  // 모든 시그니처 순회하며 매칭
  const matches: CmsMatch[] = []

  for (const sig of CMS_SIGNATURES) {
    // 1. meta generator 일치 → confidence 95
    if (generator && sig.metaGenerator && sig.metaGenerator.test(generator)) {
      matches.push({ name: sig.name, confidence: 95, category: sig.category })
      continue
    }

    // 2. HTML 패턴 매칭
    const matchedPatterns = sig.patterns.filter((p) => p.test(cleaned))

    if (matchedPatterns.length >= 2) {
      matches.push({ name: sig.name, confidence: 85, category: sig.category })
    } else if (matchedPatterns.length === 1) {
      matches.push({ name: sig.name, confidence: 60, category: sig.category })
    }
  }

  if (matches.length === 0) {
    return { detected: null, confidence: 0, technologies: [] }
  }

  // CMS가 framework보다 우선
  const sorted = [...matches].sort((a, b) => {
    if (a.category === 'cms' && b.category === 'framework') return -1
    if (a.category === 'framework' && b.category === 'cms') return 1
    return b.confidence - a.confidence
  })

  const primary = sorted[0] as (typeof sorted)[number]

  return {
    detected: primary.name,
    confidence: primary.confidence,
    technologies: matches.map((m) => m.name),
  }
}

/** <meta name="generator" content="..."> 값 추출 */
function extractMetaGenerator(html: string): string | null {
  const match =
    /<meta\s+[^>]*name\s*=\s*["']generator["'][^>]*content\s*=\s*["']([^"']*)["'][^>]*\/?>/i.exec(
      html
    )
  if (match?.[1]?.trim()) return match[1].trim()

  // content가 name보다 앞에 올 수도 있음
  const altMatch =
    /<meta\s+[^>]*content\s*=\s*["']([^"']*)["'][^>]*name\s*=\s*["']generator["'][^>]*\/?>/i.exec(
      html
    )
  if (altMatch?.[1]?.trim()) return altMatch[1].trim()

  return null
}
