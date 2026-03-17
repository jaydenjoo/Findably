import type { CrawlData } from '@/features/crawling/types'
import { SCORING } from '@/config/scoring'
import type { GeoScore, GeoCategoryScore } from './types'

// ─── config/scoring에서 상수 참조 (OST) ───

const MAX = SCORING.GEO_MAX_SCORES
const CONTENT_THRESHOLDS = SCORING.GEO_CONTENT_LENGTH_THRESHOLDS
const OG_REQUIRED = SCORING.GEO_OG_REQUIRED_FIELDS

// ─── 1. Schema.org (20점) ───

function scoreSchemaOrg(
  schemaMarkup: unknown[]
): GeoCategoryScore & { count: number } {
  const maxScore = MAX.schemaOrg
  const count = schemaMarkup.length

  if (count === 0) return { score: 0, maxScore, count }
  if (count >= 3) return { score: maxScore, maxScore, count }

  // 1개=10, 2개=15
  const score = count === 1 ? 10 : 15
  return { score, maxScore, count }
}

// ─── 2. Structured Data / JSON-LD (15점) ───

function scoreStructuredData(
  schemaMarkup: unknown[]
): GeoCategoryScore & { hasJsonLd: boolean } {
  const maxScore = MAX.structuredData

  // JSON-LD 존재 판별: @context 필드가 있는 객체
  const hasJsonLd = schemaMarkup.some(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      '@context' in (item as Record<string, unknown>)
  )

  if (!hasJsonLd) return { score: 0, maxScore, hasJsonLd }
  return { score: maxScore, maxScore, hasJsonLd }
}

// ─── 3. FAQ Schema (10점) ───

function scoreFaqSchema(
  schemaMarkup: unknown[]
): GeoCategoryScore & { count: number } {
  const maxScore = MAX.faqSchema

  const faqItems = schemaMarkup.filter((item) => {
    if (typeof item !== 'object' || item === null) return false
    const obj = item as Record<string, unknown>
    return obj['@type'] === 'FAQPage' || obj['@type'] === 'Question'
  })

  const count = faqItems.length
  if (count === 0) return { score: 0, maxScore, count }
  return { score: maxScore, maxScore, count }
}

// ─── 4. Content Length (10점, markdownContent 기준) ───

function scoreContentLength(
  markdownContent: string | null
): GeoCategoryScore & { charCount: number } {
  const maxScore = MAX.contentLength

  if (!markdownContent) return { score: 0, maxScore, charCount: 0 }

  // 헤딩 라인(# 으로 시작) 제거 → 본문만 카운트
  const bodyText = markdownContent
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('#'))
    .join('\n')
    .trim()

  const charCount = bodyText.length

  const found = CONTENT_THRESHOLDS.find((t) => charCount >= t.minChars)
  const score = found?.score ?? 0

  return { score, maxScore, charCount }
}

// ─── 5. Image Alt (10점) ───

function scoreImageAlt(images: {
  total: number
  without_alt: number
}): GeoCategoryScore & { ratio: number } {
  const maxScore = MAX.imageAlt

  if (images.total === 0) {
    // 이미지 없으면 만점 (감점 사유 없음)
    return { score: maxScore, maxScore, ratio: 1 }
  }

  const withAlt = images.total - images.without_alt
  const ratio = withAlt / images.total

  // 100% = 10점, 80%+ = 7점, 50%+ = 4점, 나머지 = 0점
  let score = 0
  if (ratio >= 1) score = maxScore
  else if (ratio >= 0.8) score = 7
  else if (ratio >= 0.5) score = 4

  return { score, maxScore, ratio: Math.round(ratio * 100) / 100 }
}

// ─── 6. E-E-A-T 신호 (5점) ───

function scoreEeat(
  meta: { description: string | null },
  schemaMarkup: unknown[]
): GeoCategoryScore {
  const maxScore = MAX.eeat
  let score = 0

  // 메타 디스크립션 존재 = 2점
  if (meta.description && meta.description.trim().length > 0) {
    score += 2
  }

  // Organization 또는 Person 스키마 존재 = 3점
  const hasAuthorSchema = schemaMarkup.some((item) => {
    if (typeof item !== 'object' || item === null) return false
    const obj = item as Record<string, unknown>
    return obj['@type'] === 'Organization' || obj['@type'] === 'Person'
  })
  if (hasAuthorSchema) score += 3

  return { score, maxScore }
}

// ─── 7. llms.txt (15점) ───

function scoreLlmsTxt(
  llmsTxt: CrawlData['llms_txt']
): GeoCategoryScore & { exists: boolean; hasFullVersion: boolean } {
  const maxScore = MAX.llmsTxt

  if (!llmsTxt || !llmsTxt.exists) {
    return {
      score: 0,
      maxScore,
      exists: false,
      hasFullVersion: false,
    }
  }

  // exists = 10점, hasFullVersion 추가 = 15점
  const score = llmsTxt.hasFullVersion ? maxScore : 10

  return {
    score,
    maxScore,
    exists: true,
    hasFullVersion: !!llmsTxt.hasFullVersion,
  }
}

// ─── 8. Canonical (5점) ───

function scoreCanonical(
  canonical: string | null
): GeoCategoryScore & { exists: boolean } {
  const maxScore = MAX.canonical
  const exists = !!canonical && canonical.trim().length > 0

  return { score: exists ? maxScore : 0, maxScore, exists }
}

// ─── 9. OG Completeness (5점) ───

function scoreOgCompleteness(
  og: Record<string, string>
): GeoCategoryScore & { presentFields: string[] } {
  const maxScore = MAX.ogCompleteness

  const presentFields = OG_REQUIRED.filter((field) => {
    const key = field.replace('og:', '')
    return !!og[key] || !!og[field]
  })

  const ratio = presentFields.length / OG_REQUIRED.length
  const score = Math.round(ratio * maxScore)

  return { score, maxScore, presentFields: [...presentFields] }
}

// ─── 10. Hreflang (5점) ───

function scoreHreflang(
  hreflang: string[] | undefined
): GeoCategoryScore & { languages: string[] } {
  const maxScore = MAX.hreflang
  const languages = hreflang ?? []

  if (languages.length === 0) return { score: 0, maxScore, languages }

  // 1개 이상 = 만점
  return { score: maxScore, maxScore, languages: [...languages] }
}

// ─── 데이터 소스 판별 ───

function determineDataSource(
  crawlData: CrawlData | null
): GeoScore['dataSource'] {
  if (!crawlData) return 'none'
  if (!crawlData.layer1) return 'none'

  const hasSchema = (crawlData.layer1.schema_markup?.length ?? 0) > 0
  const hasMeta = !!crawlData.layer1.meta?.title
  const hasContent = !!crawlData.markdownContent

  if (hasSchema && hasMeta && hasContent) return 'full'
  if (hasMeta || hasContent) return 'partial'
  return 'none'
}

// ─── 메인 함수 ───

/**
 * CrawlData에서 GEO 종합 점수를 산출한다.
 *
 * 10개 카테고리 합계 = 100점.
 * layer1이 없으면 overall=0, dataSource='none'.
 *
 * @param crawlData - 크롤링 단계에서 수집된 CrawlData
 * @returns GeoScore
 */
export function calculateGeoScore(crawlData: CrawlData | null): GeoScore {
  const dataSource = determineDataSource(crawlData)

  if (dataSource === 'none' || !crawlData?.layer1) {
    return {
      overall: 0,
      breakdown: {
        schemaOrg: { score: 0, maxScore: MAX.schemaOrg, count: 0 },
        structuredData: {
          score: 0,
          maxScore: MAX.structuredData,
          hasJsonLd: false,
        },
        faqSchema: { score: 0, maxScore: MAX.faqSchema, count: 0 },
        contentLength: { score: 0, maxScore: MAX.contentLength, charCount: 0 },
        imageAlt: { score: 0, maxScore: MAX.imageAlt, ratio: 0 },
        eeat: { score: 0, maxScore: MAX.eeat },
        llmsTxt: {
          score: 0,
          maxScore: MAX.llmsTxt,
          exists: false,
          hasFullVersion: false,
        },
        canonical: { score: 0, maxScore: MAX.canonical, exists: false },
        ogCompleteness: {
          score: 0,
          maxScore: MAX.ogCompleteness,
          presentFields: [],
        },
        hreflang: { score: 0, maxScore: MAX.hreflang, languages: [] },
      },
      dataSource: 'none',
    }
  }

  const layer1 = crawlData.layer1

  const schemaOrg = scoreSchemaOrg(layer1.schema_markup)
  const structuredData = scoreStructuredData(layer1.schema_markup)
  const faqSchema = scoreFaqSchema(layer1.schema_markup)
  const contentLength = scoreContentLength(crawlData.markdownContent)
  const imageAlt = scoreImageAlt(layer1.images)
  const eeat = scoreEeat(layer1.meta, layer1.schema_markup)
  const llmsTxt = scoreLlmsTxt(crawlData.llms_txt)
  const canonical = scoreCanonical(layer1.meta.canonical)
  const ogCompleteness = scoreOgCompleteness(layer1.meta.og)
  const hreflang = scoreHreflang(layer1.hreflang)

  const overall =
    schemaOrg.score +
    structuredData.score +
    faqSchema.score +
    contentLength.score +
    imageAlt.score +
    eeat.score +
    llmsTxt.score +
    canonical.score +
    ogCompleteness.score +
    hreflang.score

  return {
    overall,
    breakdown: {
      schemaOrg,
      structuredData,
      faqSchema,
      contentLength,
      imageAlt,
      eeat,
      llmsTxt,
      canonical,
      ogCompleteness,
      hreflang,
    },
    dataSource,
  }
}
