import type { AIPlatform } from '@/features/diagnosis-free'

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

/** API 비용 (USD per 1M tokens) */
interface TokenCostUsd {
  input: number
  output: number
}

/** AI 인용 추적 플랫폼 설정 */
interface CitationPlatformSpec {
  id: AIPlatform
  name: string
  model: string
  envKey: string
  costPerMTokenUsd: TokenCostUsd
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

/** AI 인용 추적 설정 (Task 5.3) */
const CITATION_TRACKING = {
  /** 플랫폼별 모델 + 비용 */
  PLATFORMS: [
    {
      id: 'claude' as const,
      name: 'Claude',
      model: 'claude-sonnet-4-6-20250514',
      envKey: 'ANTHROPIC_API_KEY',
      costPerMTokenUsd: { input: 3.0, output: 15.0 },
    },
    {
      id: 'chatgpt' as const,
      name: 'ChatGPT',
      model: 'gpt-4o',
      envKey: 'OPENAI_API_KEY',
      costPerMTokenUsd: { input: 2.5, output: 10.0 },
    },
    {
      id: 'google' as const,
      name: 'Gemini',
      model: 'gemini-1.5-pro',
      envKey: 'GOOGLE_AI_API_KEY',
      costPerMTokenUsd: { input: 1.25, output: 5.0 },
    },
    {
      id: 'perplexity' as const,
      name: 'Perplexity',
      model: 'sonar-pro',
      envKey: 'PERPLEXITY_API_KEY',
      costPerMTokenUsd: { input: 3.0, output: 15.0 },
    },
  ] satisfies readonly CitationPlatformSpec[],

  /** 키워드 최대 개수 */
  MAX_KEYWORDS: 3,

  /** 인용 추적 쿼리당 최대 토큰 */
  MAX_TOKENS_PER_QUERY: 512,

  /** 쿼리당 타임아웃 (ms) — 15초 */
  QUERY_TIMEOUT_MS: 15_000,

  /** 인용 추적 시스템 프롬프트 */
  SYSTEM_PROMPT: `You are a helpful assistant. Answer the user's question naturally and comprehensively.
If you know of specific websites, products, or services relevant to the answer, mention them by name and URL.
Be specific and provide real recommendations based on your knowledge.`,

  /** 쿼리 템플릿 — {keyword}가 실제 키워드로 대체됨 */
  QUERY_TEMPLATE: `"{keyword}" 관련 추천할 만한 서비스, 도구, 웹사이트를 알려주세요. 가능하면 구체적인 URL과 함께 설명해주세요.`,
} as const

export const DIAGNOSIS_PAID_CONFIG = {
  MODEL,
  MIN_SUCCESS_COUNT,
  MAX_COST_PER_DIAGNOSIS_KRW,
  TOKEN_COST_USD,
  USD_TO_KRW,
  AGENTS,
  CITATION_TRACKING,
} as const
