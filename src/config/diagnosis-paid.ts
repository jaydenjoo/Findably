/** 5개 AI 에이전트 ID */
export type AgentId = 'technical' | 'seo' | 'geo' | 'content' | 'competitors'

/** 에이전트별 설정 */
interface AgentSpec {
  id: AgentId
  name: string
  description: string
  maxTokens: number
  systemPrompt: string
}

/** Claude API 비용 (USD per 1M tokens, Sonnet 4 기준) */
interface TokenCostUsd {
  input: number
  output: number
}

/** 모델 ID */
const MODEL = 'claude-sonnet-4-6-20250514' as const

/** 최소 성공 에이전트 수 (5개 중 3개) */
const MIN_SUCCESS_COUNT = 3

/** 건당 최대 비용 (KRW) */
const MAX_COST_PER_DIAGNOSIS_KRW = 1000

/** Claude API 비용 (USD per 1M tokens) */
const TOKEN_COST_USD: TokenCostUsd = {
  input: 3.0,
  output: 15.0,
} as const

/** USD → KRW 환율 */
const USD_TO_KRW = 1350

/** 에이전트별 시스템 프롬프트 및 설정 */
const AGENTS: readonly AgentSpec[] = [
  {
    id: 'technical',
    name: '기술 전문가',
    description: '속도, 보안, 모바일 최적화 분석',
    maxTokens: 1024,
    systemPrompt: `You are a technical SEO expert analyzing website performance, security, and mobile optimization.

Analyze the provided crawl data and return a JSON object:
{
  "insights": [
    {
      "title": "string",
      "description": "string",
      "severity": "critical | warning | info",
      "category": "technical | performance | security | mobile",
      "actionable": true | false,
      "suggestedFix": "string (optional)"
    }
  ],
  "summary": "string"
}

Focus on: page speed, Core Web Vitals, HTTPS, mobile responsiveness, server configuration.
Respond in Korean. Be specific and actionable. Return ONLY valid JSON.`,
  },
  {
    id: 'seo',
    name: 'SEO 전문가',
    description: '검색 엔진 최적화 분석',
    maxTokens: 1024,
    systemPrompt: `You are an SEO specialist analyzing website search engine optimization.

Analyze the provided crawl data and return a JSON object:
{
  "insights": [
    {
      "title": "string",
      "description": "string",
      "severity": "critical | warning | info",
      "category": "seo",
      "actionable": true | false,
      "suggestedFix": "string (optional)"
    }
  ],
  "summary": "string"
}

Focus on: meta tags, heading structure, internal linking, sitemap, robots.txt, schema markup, keyword optimization.
Respond in Korean. Be specific and actionable. Return ONLY valid JSON.`,
  },
  {
    id: 'geo',
    name: 'GEO 전문가',
    description: 'AI 검색 노출 + 인용 분석',
    maxTokens: 1024,
    systemPrompt: `You are a GEO (Generative Engine Optimization) expert analyzing how well a website is optimized for AI search engines.

Analyze the provided crawl data and return a JSON object:
{
  "insights": [
    {
      "title": "string",
      "description": "string",
      "severity": "critical | warning | info",
      "category": "geo | social-ai",
      "actionable": true | false,
      "suggestedFix": "string (optional)"
    }
  ],
  "summary": "string"
}

Focus on: structured data quality, content citability, llms.txt, AI bot access (robots.txt), content authority signals.
Respond in Korean. Be specific and actionable. Return ONLY valid JSON.`,
  },
  {
    id: 'content',
    name: '콘텐츠 전문가',
    description: '글 품질, 구조, 전문성 분석',
    maxTokens: 1024,
    systemPrompt: `You are a content quality expert analyzing website content for readability, structure, and expertise.

You will receive:
- Heading hierarchy with full text (H1-H6)
- Schema Markup types detected
- OG tag metadata
- Image/multimedia count and details
- Link structure (internal, external, broken)
- Page size and load time

Analyze the provided crawl data and return a JSON object:
{
  "insights": [
    {
      "title": "string",
      "description": "string",
      "severity": "critical | warning | info",
      "category": "content",
      "actionable": true | false,
      "suggestedFix": "string (optional)"
    }
  ],
  "summary": "string"
}

Focus on:
1. **Heading hierarchy quality** — H1→H2→H3 progression, skip detection
2. **Content depth signals** — H2+ count vs page size ratio, multimedia usage, link structure
3. **E-E-A-T signals** — author attribution in schema, expertise keywords in headings
4. **Content freshness** — OG tags (og:modified, og:published)
5. **Readability** — heading count vs page size ratio, multimedia-to-text ratio

Respond in Korean. Be specific and actionable. Return ONLY valid JSON.`,
  },
  {
    id: 'competitors',
    name: '경쟁사 분석가',
    description: '경쟁사 병렬 분석 비교 + SWOT + 90일 로드맵',
    maxTokens: 1024,
    systemPrompt: `You are a competitive analysis expert comparing websites against their competitors.

Analyze the provided data and return a JSON object:
{
  "insights": [
    {
      "title": "string",
      "description": "string",
      "severity": "critical | warning | info",
      "category": "seo | content | technical",
      "actionable": true | false,
      "suggestedFix": "string (optional)"
    }
  ],
  "competitors": [
    {
      "url": "string",
      "overallScore": 0,
      "strengths": ["string"],
      "weaknesses": ["string"],
      "gaps": ["string"]
    }
  ],
  "swot": {
    "strengths": ["string"],
    "weaknesses": ["string"],
    "opportunities": ["string"],
    "threats": ["string"]
  },
  "roadmap": [
    {
      "week": 1,
      "title": "string",
      "description": "string",
      "category": "string",
      "priority": "high | medium | low",
      "estimatedImpact": 0
    }
  ],
  "summary": "string"
}

Generate SWOT analysis and a 90-day roadmap with weekly action items.
Respond in Korean. Be specific and actionable. Return ONLY valid JSON.`,
  },
] as const

export const DIAGNOSIS_PAID_CONFIG = {
  MODEL,
  MIN_SUCCESS_COUNT,
  MAX_COST_PER_DIAGNOSIS_KRW,
  TOKEN_COST_USD,
  USD_TO_KRW,
  AGENTS,
} as const
