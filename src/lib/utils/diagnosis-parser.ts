import type {
  OverallScore,
  AICitationPossibilityScore,
  CategoryScore,
  CategoryId,
  PlatformCitationScore,
  AIPlatform,
  AICitationSignals,
} from '@/features/diagnosis-free/types'
import { SCORING } from '@/config/scoring'

/** AI 인사이트 (유료 분석 결과) */
export interface ParsedAIInsight {
  title: string
  description: string
  severity: 'critical' | 'warning' | 'info'
  category: string
  suggestedFix?: string
  impact?: string
  evidence?: string
  actionable?: boolean
  priority?: number
}

/** SWOT 분석 (파서용) */
export interface ParsedSwot {
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  threats: string[]
}

/** 로드맵 항목 (파서용) */
export interface ParsedRoadmapItem {
  week: number
  title: string
  description: string
  category: string
  priority: string
  estimatedImpact: number
  phase?: string
  howTo?: string
}

/** 경쟁사 분석 (파서용) */
export interface ParsedCompetitor {
  url: string
  strengths: string[]
  weaknesses: string[]
  gaps: string[]
}

/** analysis_data JSON 구조 */
export interface AnalysisData {
  overallScore: OverallScore
  aiCitation: AICitationPossibilityScore
  /** 유료 AI 인사이트 (paid tier만) */
  aiInsights?: ParsedAIInsight[]
  /** CMO 경영진 요약 */
  cmoSummary?: string
  /** SWOT 분석 */
  swot?: ParsedSwot
  /** 90일 로드맵 */
  roadmap?: ParsedRoadmapItem[]
  /** 경쟁사 분석 */
  competitors?: ParsedCompetitor[]
}

/** crawl_data → partial 정보 */
export interface PartialInfo {
  isPartial: boolean
  blockedReason?: string
}

// ─── 내부 헬퍼: DB 원시 데이터 → 타입 정규화 ───

/** DB 카테고리 원시 형태 (aggregateResults 출력) */
interface RawCategory {
  id?: string
  name?: string
  label?: string
  score?: number
  weight?: number
  rules?: unknown[]
  passedCount?: number
  totalCount?: number
  skippedCount?: number
  passedRules?: number
  failedRules?: number
  skippedRules?: number
}

/** DB 플랫폼 원시 형태 */
interface RawPlatform {
  platform?: string
  platformLabel?: string
  label?: string
  score?: number
  blocked?: boolean
  status?: string
  signals?: AICitationSignals
}

/** DB aiCitation 원시 형태 */
interface RawAICitation {
  overallScore?: number
  score?: number
  passed?: boolean
  label?: string
  platforms?: RawPlatform[]
  recommendation?: string
}

/** 카테고리 ID 유효성 검사 — 알려진 ID가 아니면 매핑 */
const CATEGORY_ID_MAP: Record<string, CategoryId> = {
  technical: 'technical',
  content: 'content',
  'social-ai': 'social-ai',
  performance: 'performance',
  security: 'security',
  mobile: 'mobile',
  geo: 'geo',
  // 유료 분석에서 사용하는 대체 ID
  authority: 'security',
}

/** 카테고리 기본 가중치 */
const DEFAULT_CATEGORY_WEIGHTS: Record<CategoryId, number> = {
  technical: 20,
  content: 20,
  'social-ai': 15,
  performance: 15,
  security: 10,
  mobile: 10,
  geo: 10,
}

/** 플랫폼 status 문자열 → blocked boolean 변환 */
function isBlocked(status: string | undefined): boolean {
  if (!status) return false
  return status === 'blocked' || status === 'none'
}

/** severity 문자열 → 숫자 impact 변환 (fallback용) */
const SEVERITY_TO_IMPACT: Record<string, number> = {
  critical: 15,
  high: 10,
  medium: 5,
  low: 2,
}

/** DB 원시 QuickWin 형태 (엔진 버전에 따라 필드명 차이 가능) */
interface RawQuickWin {
  ruleId?: string
  ruleName?: string
  id?: string
  name?: string
  category?: string
  severity?: string
  message?: string
  impact?: unknown
  points?: number
  maxPoints?: number
  source?: string
}

/** 원시 impact/severity/points → 숫자 impact 변환 */
function resolveImpact(item: RawQuickWin): number {
  if (typeof item.impact === 'number') return item.impact
  if (item.maxPoints != null) return item.maxPoints
  if (item.points != null) return item.points
  if (typeof item.impact === 'string')
    return SEVERITY_TO_IMPACT[item.impact] ?? 5
  if (typeof item.severity === 'string')
    return SEVERITY_TO_IMPACT[item.severity] ?? 5
  return 5
}

/** 원시 quickWins 배열 → QuickWin[] 정규화 (BUG 1·3 수정) */
function normalizeQuickWins(raw: unknown): OverallScore['quickWins'] {
  if (!Array.isArray(raw)) return []

  return raw.map((item: RawQuickWin) => ({
    ruleId: item.ruleId ?? item.id ?? 'unknown',
    ruleName: item.ruleName ?? item.name ?? '알 수 없는 항목',
    category: (item.category ?? 'technical') as CategoryId,
    severity: (item.severity ??
      'medium') as OverallScore['quickWins'][number]['severity'],
    message: item.message ?? '',
    impact: resolveImpact(item),
    source: (item.source === 'ai' ? 'ai' : 'rule') as 'rule' | 'ai',
  }))
}

/** 점수 기반 AI 인용 추천 메시지 생성 */
function generateCitationRecommendation(score: number): string {
  if (score >= 70) {
    return 'AI 인용 가능성이 높습니다. 현재 상태를 유지하면서 구조화 데이터를 보강하세요.'
  }
  if (score >= 40) {
    return 'AI 인용 가능성을 높이려면 llms.txt 추가와 Schema Markup 보강을 권장합니다.'
  }
  return 'AI 인용 가능성이 낮습니다. robots.txt에서 AI 봇 허용, llms.txt 생성, 구조화 데이터 추가가 시급합니다.'
}

/** 원시 카테고리 배열 → CategoryScore[] 정규화 */
function normalizeCategories(rawCategories: unknown): CategoryScore[] {
  if (!Array.isArray(rawCategories)) return []

  return rawCategories.map((raw: RawCategory) => {
    const rawId = raw.id ?? 'technical'
    const categoryId: CategoryId = CATEGORY_ID_MAP[rawId] ?? 'technical'

    const passedCount = raw.passedCount ?? raw.passedRules ?? 0
    const failedRules = raw.failedRules ?? 0
    const skippedCount = raw.skippedCount ?? raw.skippedRules ?? 0
    const totalCount =
      raw.totalCount ?? passedCount + failedRules + skippedCount

    return {
      id: categoryId,
      name: raw.name ?? raw.label ?? categoryId,
      score: raw.score ?? 0,
      weight: raw.weight ?? DEFAULT_CATEGORY_WEIGHTS[categoryId] ?? 10,
      rules: Array.isArray(raw.rules)
        ? (raw.rules as CategoryScore['rules'])
        : [],
      passedCount,
      totalCount,
      skippedCount,
    }
  })
}

/** 원시 플랫폼 배열 → PlatformCitationScore[] 정규화 */
function normalizePlatforms(rawPlatforms: unknown): PlatformCitationScore[] {
  if (!Array.isArray(rawPlatforms)) return []

  return rawPlatforms.map((raw: RawPlatform) => ({
    platform: (raw.platform ?? 'chatgpt') as AIPlatform,
    platformLabel: raw.platformLabel ?? raw.label ?? raw.platform ?? '',
    score: raw.score ?? 0,
    blocked: raw.blocked ?? isBlocked(raw.status),
    signals: raw.signals ?? {
      botAccess: 0,
      contentDiscoverability: 0,
      trustSignals: 0,
    },
  }))
}

/** 원시 aiCitation → AICitationPossibilityScore 정규화 */
function normalizeAICitation(raw: RawAICitation): AICitationPossibilityScore {
  const overallScore = raw.overallScore ?? raw.score ?? 0
  return {
    overallScore,
    passed: raw.passed ?? overallScore >= 50,
    platforms: normalizePlatforms(raw.platforms),
    recommendation:
      raw.recommendation ?? generateCitationRecommendation(overallScore),
  }
}

/** analysis_data JSON → 타입 안전 파싱 + 필드 정규화 */
export function parseAnalysisData(raw: unknown): AnalysisData | null {
  if (
    typeof raw !== 'object' ||
    raw === null ||
    !('overallScore' in raw) ||
    !('aiCitation' in raw)
  ) {
    return null
  }

  const data = raw as Record<string, unknown>
  const rawOverall = data.overallScore as Record<string, unknown> | undefined
  const rawCitation = data.aiCitation as RawAICitation | undefined

  if (!rawOverall || !rawCitation) return null

  // overallScore 정규화
  const score = typeof rawOverall.score === 'number' ? rawOverall.score : 0
  const grade =
    typeof rawOverall.grade === 'string'
      ? (rawOverall.grade as OverallScore['grade'])
      : SCORING.getScoreGrade(score)
  const gradeLabel =
    typeof rawOverall.gradeLabel === 'string'
      ? rawOverall.gradeLabel
      : SCORING.getScoreLabel(score)

  const overallScore: OverallScore = {
    score,
    grade,
    gradeLabel,
    categories: normalizeCategories(rawOverall.categories),
    quickWins: normalizeQuickWins(rawOverall.quickWins),
    totalRules:
      typeof rawOverall.totalRules === 'number' ? rawOverall.totalRules : 0,
    passedRules:
      typeof rawOverall.passedRules === 'number'
        ? rawOverall.passedRules
        : typeof rawOverall.passedCount === 'number'
          ? (rawOverall.passedCount as number)
          : 0,
    failedRules:
      typeof rawOverall.failedRules === 'number'
        ? rawOverall.failedRules
        : typeof rawOverall.failedCount === 'number'
          ? (rawOverall.failedCount as number)
          : 0,
    skippedRules:
      typeof rawOverall.skippedRules === 'number'
        ? rawOverall.skippedRules
        : typeof rawOverall.skippedCount === 'number'
          ? (rawOverall.skippedCount as number)
          : 0,
    evaluatedAt:
      typeof rawOverall.evaluatedAt === 'string'
        ? rawOverall.evaluatedAt
        : new Date().toISOString(),
  }

  // aiInsights 파싱 (유료 분석 데이터)
  const rawInsights = data.aiInsights
  const aiInsights: ParsedAIInsight[] | undefined = Array.isArray(rawInsights)
    ? rawInsights
        .filter(
          (item: unknown): item is Record<string, unknown> =>
            typeof item === 'object' && item !== null && 'title' in item
        )
        .map((item) => ({
          title: String(item.title ?? ''),
          description: String(item.description ?? ''),
          severity: (['critical', 'warning', 'info'].includes(
            String(item.severity)
          )
            ? String(item.severity)
            : 'info') as ParsedAIInsight['severity'],
          category: String(item.category ?? 'technical'),
          suggestedFix: item.suggestedFix
            ? String(item.suggestedFix)
            : undefined,
          impact: item.impact ? String(item.impact) : undefined,
          evidence: item.evidence ? String(item.evidence) : undefined,
          actionable: item.actionable === true,
          priority:
            typeof item.priority === 'number' ? item.priority : undefined,
        }))
    : undefined

  // 유료 전용 필드 파싱 (있으면 포함, 없으면 생략)
  const cmoSummary =
    typeof data.cmoSummary === 'string' && data.cmoSummary.length > 0
      ? data.cmoSummary
      : undefined

  const swot = parseSwot(data.swot)
  const roadmap = parseRoadmap(data.roadmap)
  const competitors = parseCompetitors(data.competitors)

  return {
    overallScore,
    aiCitation: normalizeAICitation(rawCitation),
    ...(aiInsights && aiInsights.length > 0 ? { aiInsights } : {}),
    ...(cmoSummary ? { cmoSummary } : {}),
    ...(swot ? { swot } : {}),
    ...(roadmap ? { roadmap } : {}),
    ...(competitors ? { competitors } : {}),
  }
}

/** crawl_data → partial 정보 추출 */
// ─── 유료 필드 파서 ───

function parseSwot(raw: unknown): ParsedSwot | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const obj = raw as Record<string, unknown>
  const strengths = Array.isArray(obj.strengths)
    ? obj.strengths.filter((s): s is string => typeof s === 'string')
    : []
  const weaknesses = Array.isArray(obj.weaknesses)
    ? obj.weaknesses.filter((s): s is string => typeof s === 'string')
    : []
  const opportunities = Array.isArray(obj.opportunities)
    ? obj.opportunities.filter((s): s is string => typeof s === 'string')
    : []
  const threats = Array.isArray(obj.threats)
    ? obj.threats.filter((s): s is string => typeof s === 'string')
    : []
  if (strengths.length === 0 && weaknesses.length === 0) return undefined
  return { strengths, weaknesses, opportunities, threats }
}

function parseRoadmap(raw: unknown): ParsedRoadmapItem[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined
  return raw
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === 'object' && item !== null
    )
    .map((item) => ({
      week: typeof item.week === 'number' ? item.week : 0,
      title: String(item.title ?? ''),
      description: String(item.description ?? ''),
      category: String(item.category ?? 'technical'),
      priority: String(item.priority ?? 'medium'),
      estimatedImpact:
        typeof item.estimatedImpact === 'number' ? item.estimatedImpact : 5,
      phase: typeof item.phase === 'string' ? item.phase : undefined,
      howTo: typeof item.howTo === 'string' ? item.howTo : undefined,
    }))
}

function parseCompetitors(raw: unknown): ParsedCompetitor[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined
  return raw
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === 'object' && item !== null
    )
    .map((item) => ({
      url: String(item.url ?? ''),
      strengths: Array.isArray(item.strengths)
        ? item.strengths.filter((s): s is string => typeof s === 'string')
        : [],
      weaknesses: Array.isArray(item.weaknesses)
        ? item.weaknesses.filter((s): s is string => typeof s === 'string')
        : [],
      gaps: Array.isArray(item.gaps)
        ? item.gaps.filter((s): s is string => typeof s === 'string')
        : [],
    }))
}

export function parsePartialInfo(raw: unknown): PartialInfo {
  if (typeof raw === 'object' && raw !== null && 'is_partial' in raw) {
    const data = raw as Record<string, unknown>
    return {
      isPartial: data.is_partial === true,
      blockedReason:
        typeof data.blocked_reason === 'string'
          ? data.blocked_reason
          : undefined,
    }
  }
  return { isPartial: false }
}
