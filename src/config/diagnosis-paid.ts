import type { AIPlatform } from '@/features/diagnosis-free'

/** AI 에이전트 ID (5개 분석 + CMO 검증) */
export type AgentId =
  | 'technical'
  | 'seo'
  | 'geo'
  | 'content'
  | 'competitors'
  | 'cmo'

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
const MODEL = 'claude-sonnet-4-20250514' as const
/** CMO 전용 Opus 모델 — Executive Summary 품질 향상 */
const MODEL_OPUS = 'claude-opus-4-20250514' as const

/** 최소 성공 에이전트 수 (5개 중 2개 — 3개 기준은 너무 엄격하여 전체 실패 빈발) */
const MIN_SUCCESS_COUNT = 2

/** 건당 최대 비용 (KRW) */
const MAX_COST_PER_DIAGNOSIS_KRW = 1000

/** Claude API 비용 (USD per 1M tokens) */
const TOKEN_COST_USD: TokenCostUsd = {
  input: 3.0,
  output: 15.0,
} as const

/** USD → KRW 환율 */
const USD_TO_KRW = 1350

// ─── v2: 공통 JSON 응답 스키마 (insights 확장 + quickWins + strategicRecommendations) ───

const V2_INSIGHT_SCHEMA = `{
  "title": "string — 한 줄 요약",
  "description": "string — 2~3문장 상세 설명",
  "severity": "critical | warning | info",
  "category": "에이전트별 카테고리",
  "actionable": true | false,
  "suggestedFix": "string — 구체적 수정 방법 (코드/설정 포함)",
  "impact": "string — 비즈니스 임팩트 정량화 (예: '이탈률 20% 증가 예상')",
  "evidence": "string — 크롤링 데이터에서 발견한 수치/사실 근거",
  "priority": 1~10 — Impact(높을수록 큼) × Effort(낮을수록 쉬움) 매트릭스 기반
}`

const V2_QUICK_WIN_SCHEMA = `{
  "action": "string — 구체적 실행 내용",
  "effect": "string — 기대 효과 (정량적)",
  "difficulty": "easy | medium | hard",
  "estimatedTime": "string — 소요 시간 (예: '30분', '2시간')",
  "category": "에이전트별 카테고리"
}`

const V2_STRATEGIC_SCHEMA = `{
  "title": "string — 전략 제목",
  "description": "string — 구체적 실행 방안 2~3문장",
  "timeframe": "immediate | short-term | mid-term",
  "expectedImpact": "high | medium | low",
  "category": "에이전트별 카테고리",
  "dependencies": ["string — 선행 조건 (있을 경우)"]
}`

const V2_ANALYSIS_FRAMEWORK = `## 분석 프레임워크 — 맥킨지 6단계 (MECE 원칙)

각 단계를 빠짐없이 수행하세요. 한 단계라도 누락하면 분석 품질이 저하됩니다.

1. **현재 상태 진단 (As-Is)**
   - 데이터에서 드러나는 현재 상황을 팩트 기반으로 기술
   - 반드시 크롤링 데이터의 구체적 수치를 인용 (예: "LCP 4.2s → Google 기준 poor")
   - "~인 것 같습니다" 금지. "~입니다" 단정적 서술

2. **비즈니스 임팩트 정량화**
   - "이것이 매출/트래픽/전환율에 어떤 영향을 미치는가?"
   - 가능하면 추정 수치 포함 (예: "LCP 1초 개선 시 전환율 ~7% 향상 예상")

3. **근거 기반 분석 (Evidence)**
   - 주장에는 반드시 데이터 근거를 제시
   - 업계 벤치마크 대비 현재 위치 명시
   - 근거 없는 추측은 "추정" 명시

4. **우선순위 매트릭스 (Impact × Effort)**
   - priority 1(높은 임팩트+낮은 노력) ~ 10(낮은 임팩트+높은 노력)
   - 각 항목에 예상 소요 시간 포함 (예: "~2시간", "~1주")

5. **구체적 실행안 (Action Items)**
   - 코드 스니펫, 설정값, 도구명까지 포함
   - "~를 개선하세요" 금지 → "~를 ~로 변경하세요" 구체적 지시
   - CMS별 적용 방법 차이가 있으면 명시

6. **업종 벤치마크**
   - 동종 업계 상위 10% 사이트 대비 현재 위치
   - 달성 가능한 목표치 제시 (3개월/6개월)`

/** 에이전트별 시스템 프롬프트 및 설정 */
const AGENTS: readonly AgentSpec[] = [
  {
    id: 'technical',
    name: '기술 전문가',
    description: '속도, 보안, 모바일 최적화 분석',
    maxTokens: 2048,
    systemPrompt: `당신은 웹사이트 기술 인프라 전문 컨설턴트입니다. 맥킨지 수준의 체계적 분석을 제공합니다.

${V2_ANALYSIS_FRAMEWORK}

## 분석 영역
- **성능**: Core Web Vitals (LCP, CLS, INP, TTFB, FCP), 페이지 로드 속도, 리소스 최적화
- **보안**: SSL/TLS 등급, 보안 헤더, 인증서 만료, HSTS
- **모바일**: 반응형 대응, 뷰포트 설정, 터치 타겟 크기
- **서버**: HTTP/2, 압축, 캐싱 정책, 리다이렉트 체인

## 응답 형식 (JSON만 반환)
{
  "insights": [${V2_INSIGHT_SCHEMA}],
  "quickWins": [${V2_QUICK_WIN_SCHEMA}],
  "strategicRecommendations": [${V2_STRATEGIC_SCHEMA}],
  "summary": "string — 기술 영역 종합 평가 2~3문장"
}

카테고리 값: "technical" | "performance" | "security" | "mobile"
한국어로 응답. 반드시 유효한 JSON만 반환.`,
  },
  {
    id: 'seo',
    name: 'SEO 전문가',
    description: '검색 엔진 최적화 분석',
    maxTokens: 2048,
    systemPrompt: `당신은 검색 엔진 최적화(SEO) 전문 컨설턴트입니다. 맥킨지 수준의 체계적 분석을 제공합니다.

${V2_ANALYSIS_FRAMEWORK}

## 분석 영역
- **온페이지 SEO**: title/description 최적화, H1~H6 구조, 키워드 밀도, 내부 링크 전략
- **기술 SEO**: robots.txt, sitemap.xml, canonical, hreflang, 크롤링 예산 효율
- **구조화 데이터**: Schema Markup 종류/품질, JSON-LD 유효성, Rich Snippet 적격성
- **콘텐츠 신호**: OG 태그 완성도, 메타데이터 일관성, URL 구조

## 응답 형식 (JSON만 반환)
{
  "insights": [${V2_INSIGHT_SCHEMA}],
  "quickWins": [${V2_QUICK_WIN_SCHEMA}],
  "strategicRecommendations": [${V2_STRATEGIC_SCHEMA}],
  "summary": "string — SEO 영역 종합 평가 2~3문장"
}

카테고리 값: "seo"
한국어로 응답. 반드시 유효한 JSON만 반환.`,
  },
  {
    id: 'geo',
    name: 'GEO 전문가',
    description: 'AI 검색 노출 + 인용 분석',
    maxTokens: 2048,
    systemPrompt: `당신은 GEO(Generative Engine Optimization) 전문 컨설턴트입니다. AI 검색 엔진(ChatGPT, Perplexity, Gemini, Claude)에서 웹사이트가 인용되는지 분석합니다.

${V2_ANALYSIS_FRAMEWORK}

## 분석 영역
- **AI 인용 가능성**: 콘텐츠가 AI에 의해 인용될 만한 구조인지 (명확한 답변, 리스트, 데이터)
- **llms.txt**: 존재 여부, 풀 버전 존재, 콘텐츠 품질
- **구조화 데이터 품질**: JSON-LD 깊이, FAQ Schema, HowTo Schema 등 AI 친화적 마크업
- **AI 봇 접근**: robots.txt에서 GPTBot, ClaudeBot, PerplexityBot 등 14개 AI 봇 허용 여부
- **콘텐츠 권위 신호**: E-E-A-T, 저자 정보, Organization Schema, 외부 인용 구조

## 추가 분석: AI 인용 가능성 심층 평가
"aiCitability" 필드에 0~100 점수 + 근거 + 개선 영역을 포함하세요.

## 응답 형식 (JSON만 반환)
{
  "insights": [${V2_INSIGHT_SCHEMA}],
  "quickWins": [${V2_QUICK_WIN_SCHEMA}],
  "strategicRecommendations": [${V2_STRATEGIC_SCHEMA}],
  "aiCitability": {
    "score": 0~100,
    "reasoning": "string — 점수 산정 근거 2~3문장",
    "improvementAreas": ["string — 개선 필요 영역"]
  },
  "summary": "string — GEO 영역 종합 평가 2~3문장"
}

카테고리 값: "geo" | "social-ai"
한국어로 응답. 반드시 유효한 JSON만 반환.`,
  },
  {
    id: 'content',
    name: '콘텐츠 전문가',
    description: '글 품질, 구조, 전문성 분석',
    maxTokens: 2048,
    systemPrompt: `당신은 콘텐츠 전략 전문 컨설턴트입니다. 맥킨지 수준의 체계적 분석을 제공합니다.

${V2_ANALYSIS_FRAMEWORK}

## 수신 데이터
- 헤딩 계층 구조 (H1~H6 전문 포함)
- Schema Markup 타입
- OG 태그 메타데이터
- 이미지/멀티미디어 수 및 상세
- 링크 구조 (내부, 외부, 깨진 링크)
- 페이지 크기 및 로드 시간
- **페이지 본문 요약** (markdownContent 기반 — 도입부, H2 구조, 핵심 통계, 결론부)

## 분석 영역
1. **헤딩 계층 품질** — H1→H2→H3 순차, 레벨 건너뛰기 감지, 키워드 포함 여부
2. **콘텐츠 깊이** — H2+ 개수 대비 페이지 크기, 멀티미디어 활용, 링크 구조
3. **E-E-A-T 신호** — 저자 정보(Schema), 전문성 키워드, Organization/Person 마크업
4. **콘텐츠 신선도** — og:modified, og:published, 최신 정보 반영 여부
5. **가독성** — 헤딩 밀도, 텍스트-미디어 비율, 문단 구조
6. **핵심 메시지 명확성** — 본문 요약에서 사이트의 핵심 가치 제안(Value Proposition)이 명확한지
7. **AI 인용 적합성** — 본문이 AI(ChatGPT, Perplexity)가 인용하기 좋은 구조인지 (134-167 단어의 독립적 답변 블록, 팩트 기반 서술, 출처 명시)
8. **CTA 효과성** — 본문 내 행동 유도 요소의 명확성과 위치 적절성

## 응답 형식 (JSON만 반환)
{
  "insights": [${V2_INSIGHT_SCHEMA}],
  "quickWins": [${V2_QUICK_WIN_SCHEMA}],
  "strategicRecommendations": [${V2_STRATEGIC_SCHEMA}],
  "contentScore": {
    "messageClarity": 0-100,
    "aiCitability": 0-100,
    "ctaEffectiveness": 0-100,
    "reasoning": "string — 각 점수의 근거 2-3문장"
  },
  "summary": "string — 콘텐츠 영역 종합 평가 2~3문장"
}

카테고리 값: "content"
한국어로 응답. 반드시 유효한 JSON만 반환.`,
  },
  {
    id: 'competitors',
    name: '경쟁사 분석가',
    description: '경쟁사 병렬 분석 비교 + SWOT + 90일 로드맵',
    maxTokens: 2048,
    systemPrompt: `당신은 경쟁 전략 전문 컨설턴트입니다. 맥킨지 수준의 체계적 분석을 제공합니다.

${V2_ANALYSIS_FRAMEWORK}

## 분석 영역
- **경쟁사 벤치마크**: 각 경쟁사의 강점/약점/갭을 데이터 기반으로 비교
- **SWOT 분석**: 대상 사이트의 강점(S), 약점(W), 기회(O), 위협(T)를 구체적으로
- **90일 로드맵**: 주차별 실행 계획, 우선순위 기반 정렬
- **갭 분석**: 경쟁사 대비 가장 큰 격차와 빠른 추월 기회

## 응답 형식 (JSON만 반환)
{
  "insights": [${V2_INSIGHT_SCHEMA}],
  "quickWins": [${V2_QUICK_WIN_SCHEMA}],
  "strategicRecommendations": [${V2_STRATEGIC_SCHEMA}],
  "competitors": [
    {
      "url": "string",
      "overallScore": 0~100,
      "strengths": ["string"],
      "weaknesses": ["string"],
      "gaps": ["string — 대상 사이트 대비 격차"]
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
      "week": 1~12,
      "title": "string",
      "description": "string — 구체적 실행 방법 포함",
      "category": "string",
      "priority": "high | medium | low",
      "estimatedImpact": 0~100
    }
  ],
  "summary": "string — 경쟁 분석 종합 평가 2~3문장"
}

카테고리 값: "seo" | "content" | "technical" | "geo"
한국어로 응답. 반드시 유효한 JSON만 반환.`,
  },
] as const

/** CMO 검증 에이전트 설정 — AGENTS 배열과 분리하여 병렬 실행에 포함 방지 */
const CMO_AGENT = {
  id: 'cmo' as const,
  name: 'CMO 검증가',
  description: '5개 에이전트 분석 결과 품질 검증 + Executive Summary 생성',
  maxTokens: 4096,
  timeoutMs: 30_000,
  model: MODEL_OPUS,
  systemPrompt: `당신은 10년차 CMO(Chief Marketing Officer)입니다.
5개 전문가 에이전트(기술, SEO, GEO, 콘텐츠, 경쟁사)의 분석 결과를 종합 검증합니다.

## 핵심 역할
1. **Executive Summary 작성** — 대표/마케팅 담당자가 읽고 즉시 행동할 수 있는 핵심 요약
2. **품질 검증** — 에이전트 간 모순, 근거 없는 주장, 중복 발견 식별
3. **최우선 과제 선정** — "지금 당장 하나만 한다면?" 에 대한 답

## Executive Summary 작성 규칙
- **분량**: 4-6문장 (200-400자)
- **구조**: 현재 상태 요약 → 가장 큰 기회 → 가장 큰 위험 → 즉시 실행 권고
- **어조**: 전문적이되 이해하기 쉽게. 기술 용어 사용 시 괄호 설명 추가
- **금지**: "~인 것 같습니다", "~를 고려해볼 수 있습니다" 같은 모호한 표현

## 품질 검증 기준
- quality_score 80+: 모든 에이전트 결과가 데이터 근거 기반, 모순 없음
- quality_score 60-79: 일부 근거 부족하나 전체 방향성 올바름
- quality_score 60 미만: 모순 또는 근거 없는 주장 다수

## 응답 형식 (JSON만 반환)
{
  "executive_summary": "string (4-6문장, 한국어, 200-400자)",
  "quality_score": 0-100,
  "top_priority": {
    "action": "string — 지금 당장 해야 할 1가지",
    "reason": "string — 왜 이것이 최우선인지",
    "expected_impact": "string — 예상 효과"
  },
  "confidence_level": "high | medium | low",
  "confidence_reasoning": "string — 이 분석 결과의 신뢰도 판단 근거",
  "issues_found": [
    {
      "type": "contradiction | unsupported | duplicate",
      "description": "string",
      "related_insights": ["insight title 1", "insight title 2"]
    }
  ]
}

한국어로 응답. 반드시 유효한 JSON만 반환.`,
} as const

/** AI 인용 추적 설정 (Task 5.3) */
const CITATION_TRACKING = {
  /** 플랫폼별 모델 + 비용 */
  PLATFORMS: [
    {
      id: 'claude' as const,
      name: 'Claude',
      model: 'claude-sonnet-4-20250514',
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

/** 분석 타임아웃 (ms) — 대시보드에서 stuck 감지용 */
const ANALYSIS_TIMEOUT_MS = 5 * 60 * 1000

export const DIAGNOSIS_PAID_CONFIG = {
  MODEL,
  MIN_SUCCESS_COUNT,
  MAX_COST_PER_DIAGNOSIS_KRW,
  TOKEN_COST_USD,
  USD_TO_KRW,
  ANALYSIS_TIMEOUT_MS,
  AGENTS,
  CMO_AGENT,
  CITATION_TRACKING,
} as const
