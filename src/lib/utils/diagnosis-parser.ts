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

/** analysis_data JSON 구조 */
export interface AnalysisData {
  overallScore: OverallScore
  aiCitation: AICitationPossibilityScore
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

  return {
    overallScore,
    aiCitation: normalizeAICitation(rawCitation),
  }
}

/** crawl_data → partial 정보 추출 */
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
