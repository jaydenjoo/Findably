import type { ParsedSchema, RecommendedSchema } from '../types'

// ─── Schema @type별 필수 속성 ───

const REQUIRED_PROPERTIES: Record<string, string[]> = {
  Organization: ['name', 'url'],
  WebSite: ['name', 'url'],
  LocalBusiness: ['name', 'address', 'telephone'],
  Product: ['name', 'offers'],
  Article: ['headline', 'author', 'datePublished'],
  BreadcrumbList: ['itemListElement'],
  FAQPage: ['mainEntity'],
  Person: ['name'],
  WebPage: ['name'],
}

// ─── 파싱 ───

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function extractType(schema: Record<string, unknown>): string {
  const rawType = schema['@type']
  if (typeof rawType === 'string') return rawType
  if (Array.isArray(rawType) && typeof rawType[0] === 'string')
    return rawType[0]
  return 'Unknown'
}

function extractProperties(schema: Record<string, unknown>): string[] {
  return Object.keys(schema).filter((k) => !k.startsWith('@'))
}

function validateSchema(
  type: string,
  properties: string[]
): { isValid: boolean; issues: string[] } {
  const required = REQUIRED_PROPERTIES[type]
  if (!required) return { isValid: true, issues: [] }

  const missing = required.filter((prop) => !properties.includes(prop))
  if (missing.length === 0) return { isValid: true, issues: [] }

  return {
    isValid: false,
    issues: missing.map((prop) => `필수 속성 "${prop}" 누락`),
  }
}

/** unknown[] 배열을 안전하게 파싱하여 ParsedSchema[] 반환 */
export function parseSchemaMarkup(rawSchemas: unknown[]): ParsedSchema[] {
  const results: ParsedSchema[] = []

  for (const item of rawSchemas) {
    if (!isRecord(item)) continue

    // @graph 패턴 처리
    if (Array.isArray(item['@graph'])) {
      const graphItems = item['@graph'] as unknown[]
      for (const graphItem of graphItems) {
        if (!isRecord(graphItem)) continue
        const parsed = parseSingleSchema(graphItem)
        if (parsed) results.push(parsed)
      }
      continue
    }

    const parsed = parseSingleSchema(item)
    if (parsed) results.push(parsed)
  }

  return results
}

function parseSingleSchema(
  schema: Record<string, unknown>
): ParsedSchema | null {
  const type = extractType(schema)
  if (type === 'Unknown' && !schema['@type']) return null

  const properties = extractProperties(schema)
  const { isValid, issues } = validateSchema(type, properties)

  let raw: string
  try {
    raw = JSON.stringify(schema, null, 2)
  } catch (err) {
    console.error('[parseSingleSchema]', err)
    raw = '{}'
  }

  return { type, properties, isValid, raw, issues }
}

// ─── 추천 Schema 생성 (룰 기반) ───

interface SiteContext {
  url: string
  title: string | null
  description: string | null
  existingTypes: string[]
}

function generateOrganizationSchema(ctx: SiteContext): string {
  const domain = (() => {
    try {
      return new URL(ctx.url).hostname
    } catch {
      return ctx.url
    }
  })()

  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: ctx.title ?? domain,
      url: ctx.url,
      description: ctx.description ?? '',
      logo: `${ctx.url}/logo.png`,
    },
    null,
    2
  )
}

function generateWebSiteSchema(ctx: SiteContext): string {
  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: ctx.title ?? '',
      url: ctx.url,
      description: ctx.description ?? '',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${ctx.url}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    null,
    2
  )
}

function generateBreadcrumbSchema(ctx: SiteContext): string {
  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: '홈',
          item: ctx.url,
        },
      ],
    },
    null,
    2
  )
}

/** 사이트 메타 정보 기반 추천 Schema 코드 생성 */
export function generateRecommendedSchemas(
  ctx: SiteContext
): RecommendedSchema[] {
  const recommendations: RecommendedSchema[] = []

  if (!ctx.existingTypes.includes('Organization')) {
    recommendations.push({
      type: 'Organization',
      description:
        '검색엔진과 AI에게 조직 정보를 구조화하여 전달합니다. 브랜드 인지도와 검색 노출에 필수적입니다.',
      code: generateOrganizationSchema(ctx),
      priority: 'high',
    })
  }

  if (!ctx.existingTypes.includes('WebSite')) {
    recommendations.push({
      type: 'WebSite',
      description:
        '사이트 검색 기능을 Google에 알리고, 사이트링크 검색창 노출 가능성을 높입니다.',
      code: generateWebSiteSchema(ctx),
      priority: 'high',
    })
  }

  if (!ctx.existingTypes.includes('BreadcrumbList')) {
    recommendations.push({
      type: 'BreadcrumbList',
      description:
        '페이지 경로 구조를 검색 결과에 표시합니다. 사용자 경험과 CTR 개선에 도움됩니다.',
      code: generateBreadcrumbSchema(ctx),
      priority: 'medium',
    })
  }

  return recommendations
}
