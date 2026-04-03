import type {
  CategoryId,
  CategoryScore,
  OverallScore,
  QuickWin,
} from '@/features/diagnosis-free'
import type {
  AIAgentResult,
  AIInsight,
  CompetitorAnalysis,
  RoadmapItem,
} from '../types'

/** 주차별 최대 항목 수 */
const MAX_ITEMS_PER_WEEK = 3

/** 전체 최대 항목 수 */
const MAX_TOTAL_ITEMS = 24

/** 카테고리별 최대 인사이트 수 */
const MAX_INSIGHTS_PER_CATEGORY = 3

/** 낮은 점수 기준 (Phase 1 대상) */
const LOW_SCORE_THRESHOLD = 40

/** 중간 점수 기준 (Phase 2 대상) */
const MID_SCORE_THRESHOLD = 70

/** estimatedImpact 매핑 — severity 기반 */
const IMPACT_BY_SEVERITY = {
  critical: 9,
  warning: 7,
  info: 4,
} as const

/** Quick Win Phase 1 폴백 임팩트 (severity 매핑 미스 시) */
const QUICK_WIN_PHASE1_FALLBACK_IMPACT = 7

/** Quick Win Phase 2 폴백 임팩트 (overflow 항목) */
const QUICK_WIN_PHASE2_FALLBACK_IMPACT = 5

/** 로드맵 생성 시 사용하는 카테고리 ID 상수 */
const ROADMAP_CATEGORIES = {
  technical: 'technical' as const satisfies CategoryId,
  content: 'content' as const satisfies CategoryId,
  socialAI: 'social-ai' as const satisfies CategoryId,
} as const

/** 로드맵 생성 입력 파라미터 */
export interface GenerateRoadmapParams {
  agentResults: AIAgentResult[]
  categoryScores: CategoryScore[]
  overallScore: OverallScore
  quickWins: QuickWin[]
  /** competitors 에이전트에서 파싱한 로드맵 (빈 배열 가능) */
  competitorRoadmap: RoadmapItem[]
  /** competitors 에이전트에서 파싱한 경쟁사 분석 결과 */
  competitorAnalyses?: CompetitorAnalysis[]
}

/**
 * 5개 에이전트 결과 + Quick Win + 카테고리 점수를 종합하여 90일 로드맵 생성.
 * Rule-based — 추가 AI API 호출 없음 (비용 0원).
 *
 * 전략:
 * 1. competitors 로드맵이 있으면 베이스로 사용
 * 2. Quick Win → Phase 1 (week 1–2)
 * 3. critical 인사이트 → Phase 1 (week 2–4)
 * 4. 낮은 카테고리 점수 → Phase 1 (week 3–4)
 * 5. warning+actionable → Phase 2 (week 5–6)
 * 6. 경쟁사 갭 → Phase 2 (week 7–8)
 * 7. 중간 카테고리 점수 → Phase 2 (week 5–8)
 * 8. info+actionable → Phase 3 (week 9–10)
 * 9. 경쟁사 강점 대응 → Phase 3 (week 11–12)
 * 10. 전체 점수 총평 → Phase 3 (week 12)
 * 11. 한국 시장 전략 → Phase 1–3 (네이버/카카오/한국 생태계)
 */
export function generateRoadmap(params: GenerateRoadmapParams): RoadmapItem[] {
  const {
    agentResults,
    categoryScores,
    overallScore,
    quickWins,
    competitorRoadmap,
    competitorAnalyses,
  } = params

  // 베이스: competitors 로드맵이 있으면 복사하여 사용
  const items: RoadmapItem[] = competitorRoadmap.map((item) => ({ ...item }))

  const completedResults = agentResults.filter(
    (r) => r.status === 'completed' && r.insights.length > 0
  )

  // Phase 1: 즉시 실행 (Week 1–4)
  enrichFromQuickWins(items, quickWins)
  enrichFromCriticalInsights(items, completedResults)
  enrichFromLowScoreCategories(items, categoryScores)

  // Phase 2: 단기 개선 (Week 5–8)
  enrichFromWarningInsights(items, completedResults)
  enrichFromCompetitorGaps(items, competitorAnalyses)
  enrichFromMidScoreCategories(items, categoryScores)

  // Phase 3: 중장기 최적화 (Week 9–12)
  enrichFromInfoInsights(items, completedResults)
  enrichFromCompetitorStrengths(items, competitorAnalyses)
  enrichOverallSummary(items, overallScore)

  // 한국 시장 전략: Phase 1–3에 걸쳐 한국 플랫폼/생태계 항목 추가
  enrichKoreaMarketItems(items, categoryScores)

  // Phase 라벨 + howTo 매핑
  assignPhaseLabels(items)
  assignHowToFromInsights(items, completedResults)

  // 중복 제거 + 주차별/전체 제한 적용
  return applyLimits(deduplicateItems(items))
}

// ─── Phase 1: 즉시 실행 (Week 1–4) ───

/** Quick Win → week 1–2, priority: high */
function enrichFromQuickWins(
  items: RoadmapItem[],
  quickWins: QuickWin[]
): void {
  // 상위 3개만 Phase 1, 나머지 Phase 2로
  const phase1 = quickWins.slice(0, MAX_INSIGHTS_PER_CATEGORY)
  const phase2 = quickWins.slice(MAX_INSIGHTS_PER_CATEGORY)

  for (const qw of phase1) {
    items.push({
      week: qw.severity === 'critical' ? 1 : 2,
      title: qw.ruleName,
      description: qw.message,
      category: qw.category,
      priority: 'high',
      estimatedImpact:
        IMPACT_BY_SEVERITY[qw.severity] ?? QUICK_WIN_PHASE1_FALLBACK_IMPACT,
    })
  }

  for (const qw of phase2) {
    items.push({
      week: 5,
      title: qw.ruleName,
      description: qw.message,
      category: qw.category,
      priority: 'medium',
      estimatedImpact:
        IMPACT_BY_SEVERITY[qw.severity] ?? QUICK_WIN_PHASE2_FALLBACK_IMPACT,
    })
  }
}

/** critical 인사이트 → week 2–4, priority: high */
function enrichFromCriticalInsights(
  items: RoadmapItem[],
  completedResults: AIAgentResult[]
): void {
  const criticals = collectInsightsBySeverity(completedResults, 'critical')

  for (const { insight, agentId } of criticals) {
    items.push({
      week: 3,
      title: `[${agentId}] ${insight.title}`,
      description: insight.description,
      category: insight.category,
      priority: 'high',
      estimatedImpact: IMPACT_BY_SEVERITY.critical,
    })
  }
}

/** 점수 < 40 카테고리 → week 3–4, priority: high */
function enrichFromLowScoreCategories(
  items: RoadmapItem[],
  categoryScores: CategoryScore[]
): void {
  const lowCategories = categoryScores
    .filter((c) => c.score < LOW_SCORE_THRESHOLD)
    .sort((a, b) => a.score - b.score)

  for (const cat of lowCategories) {
    items.push({
      week: 4,
      title: `${cat.name} 영역 긴급 개선`,
      description: `${cat.name} 점수 ${cat.score}점 — 즉시 개선이 필요합니다`,
      category: cat.id,
      priority: 'high',
      estimatedImpact: 9,
    })
  }
}

// ─── Phase 2: 단기 개선 (Week 5–8) ───

/** warning + actionable 인사이트 → week 5–6, priority: medium */
function enrichFromWarningInsights(
  items: RoadmapItem[],
  completedResults: AIAgentResult[]
): void {
  const warnings = collectInsightsBySeverity(
    completedResults,
    'warning'
  ).filter(({ insight }) => insight.actionable)

  for (const { insight, agentId } of warnings) {
    items.push({
      week: 6,
      title: `[${agentId}] ${insight.title}`,
      description: insight.description,
      category: insight.category,
      priority: 'medium',
      estimatedImpact: IMPACT_BY_SEVERITY.warning,
    })
  }
}

/** 경쟁사 갭 → week 7–8, priority: medium */
function enrichFromCompetitorGaps(
  items: RoadmapItem[],
  competitorAnalyses?: CompetitorAnalysis[]
): void {
  if (!competitorAnalyses?.length) return

  for (const comp of competitorAnalyses) {
    for (const gap of comp.gaps) {
      items.push({
        week: 7,
        title: `경쟁사 대비 기회: ${gap}`,
        description: `경쟁사(${comp.url}) 대비 개선 가능한 영역`,
        category: 'technical',
        priority: 'medium',
        estimatedImpact: 6,
      })
    }
  }
}

/** 점수 40–69 카테고리 → week 5–8, priority: medium */
function enrichFromMidScoreCategories(
  items: RoadmapItem[],
  categoryScores: CategoryScore[]
): void {
  const midCategories = categoryScores
    .filter(
      (c) => c.score >= LOW_SCORE_THRESHOLD && c.score < MID_SCORE_THRESHOLD
    )
    .sort((a, b) => a.score - b.score)

  for (const cat of midCategories) {
    items.push({
      week: 8,
      title: `${cat.name} 영역 개선`,
      description: `${cat.name} 점수 ${cat.score}점 — 단기 개선으로 효과를 볼 수 있습니다`,
      category: cat.id,
      priority: 'medium',
      estimatedImpact: 6,
    })
  }
}

// ─── Phase 3: 중장기 최적화 (Week 9–12) ───

/** info + actionable 인사이트 → week 9–10, priority: low */
function enrichFromInfoInsights(
  items: RoadmapItem[],
  completedResults: AIAgentResult[]
): void {
  const infos = collectInsightsBySeverity(completedResults, 'info').filter(
    ({ insight }) => insight.actionable
  )

  for (const { insight, agentId } of infos) {
    items.push({
      week: 10,
      title: `[${agentId}] ${insight.title}`,
      description: insight.description,
      category: insight.category,
      priority: 'low',
      estimatedImpact: IMPACT_BY_SEVERITY.info,
    })
  }
}

/** 경쟁사 강점 대응 → week 11–12, priority: low */
function enrichFromCompetitorStrengths(
  items: RoadmapItem[],
  competitorAnalyses?: CompetitorAnalysis[]
): void {
  if (!competitorAnalyses?.length) return

  for (const comp of competitorAnalyses) {
    for (const strength of comp.strengths) {
      items.push({
        week: 11,
        title: `경쟁사 강점 대응: ${strength}`,
        description: `경쟁사(${comp.url})의 강점에 대한 장기 대응 전략`,
        category: 'technical',
        priority: 'low',
        estimatedImpact: 5,
      })
    }
  }
}

/** 전체 점수 기반 총평 → week 12, priority: low */
function enrichOverallSummary(
  items: RoadmapItem[],
  overallScore: OverallScore
): void {
  items.push({
    week: 12,
    title: '마케팅 최적화 성과 점검',
    description: `현재 종합 ${overallScore.score}점(${overallScore.gradeLabel}) — 12주 실행 후 재진단으로 개선 효과를 측정하세요`,
    category: ROADMAP_CATEGORIES.technical,
    priority: 'low',
    estimatedImpact: 3,
  })
}

// ─── 한국 시장 전략 (Phase 1–3) ───

/** 한국 시장 전략 항목 — 점수가 낮은 카테고리에 해당하는 항목만 추가 */
function enrichKoreaMarketItems(
  items: RoadmapItem[],
  categoryScores: CategoryScore[]
): void {
  const scoreMap = new Map(categoryScores.map((c) => [c.id, c.score]))

  // Phase 1 (week 3–4): 즉시 실행 가능한 한국 플랫폼 등록
  const seoScore = scoreMap.get(ROADMAP_CATEGORIES.technical) ?? 100
  const contentScore = scoreMap.get(ROADMAP_CATEGORIES.content) ?? 100
  const geoScore = scoreMap.get(ROADMAP_CATEGORIES.socialAI) ?? 100

  if (seoScore < MID_SCORE_THRESHOLD) {
    items.push({
      week: 3,
      title: '네이버 서치어드바이저 등록',
      description:
        '네이버 검색 노출의 전제 조건. 사이트맵 제출 + 소유 확인으로 네이버 검색 인덱싱 시작',
      category: ROADMAP_CATEGORIES.technical,
      priority: 'high',
      estimatedImpact: 8,
    })
  }

  if (seoScore < MID_SCORE_THRESHOLD) {
    items.push({
      week: 4,
      title: 'robots.txt 네이버 봇(Yeti) 허용 확인',
      description:
        'Yeti(네이버 크롤러) 차단 시 네이버 검색 노출 불가. User-agent: Yeti Allow: / 확인',
      category: ROADMAP_CATEGORIES.technical,
      priority: 'high',
      estimatedImpact: 8,
    })
  }

  if (geoScore < MID_SCORE_THRESHOLD) {
    items.push({
      week: 4,
      title: '카카오톡 채널 개설 및 사이트 연동',
      description:
        '한국 메신저 점유율 1위 카카오톡 채널 — 고객 소통 채널 확보 + 사이트 내 채널 추가 버튼 배치',
      category: ROADMAP_CATEGORIES.socialAI,
      priority: 'high',
      estimatedImpact: 7,
    })
  }

  // Phase 2 (week 5–8): 중기 한국 시장 최적화
  if (contentScore < MID_SCORE_THRESHOLD) {
    items.push({
      week: 6,
      title: '한국어 콘텐츠 톤 앤 매너 통일',
      description:
        'B2B는 존댓말(격식체), B2C는 해요체로 통일. 타겟에 맞지 않는 문체는 신뢰도 하락 유발',
      category: ROADMAP_CATEGORIES.content,
      priority: 'medium',
      estimatedImpact: 6,
    })
  }

  if (seoScore < MID_SCORE_THRESHOLD) {
    items.push({
      week: 7,
      title: '네이버 플레이스/스마트스토어 등록',
      description:
        '지역 비즈니스는 네이버 플레이스, 이커머스는 스마트스토어 입점으로 네이버 검색 내 별도 노출 확보',
      category: ROADMAP_CATEGORIES.technical,
      priority: 'medium',
      estimatedImpact: 7,
    })
  }

  if (contentScore < MID_SCORE_THRESHOLD) {
    items.push({
      week: 8,
      title: '네이버 블로그/카페 전략 수립',
      description:
        '네이버는 자체 콘텐츠(블로그, 카페) 우선 노출 — 자사 사이트 콘텐츠와 연계한 네이버 블로그 운영 계획',
      category: ROADMAP_CATEGORIES.content,
      priority: 'medium',
      estimatedImpact: 6,
    })
  }

  // Phase 3 (week 9–12): 장기 한국 생태계 통합
  if (geoScore < MID_SCORE_THRESHOLD) {
    items.push({
      week: 10,
      title: '한국 AI 플랫폼 대응 (클로바X, 뤼튼)',
      description:
        '글로벌 AI(ChatGPT, Claude) 외 한국 자체 AI 서비스에서도 인용되도록 한국어 FAQ/HowTo Schema 강화',
      category: ROADMAP_CATEGORIES.socialAI,
      priority: 'low',
      estimatedImpact: 5,
    })
  }

  if (contentScore < MID_SCORE_THRESHOLD) {
    items.push({
      week: 11,
      title: '한국 시장 E-E-A-T 신호 강화',
      description:
        '사업자등록번호, 전문자격 표시, 정부 인증 마크, 언론 보도 링크 등 한국에서 통용되는 권위 신호 추가',
      category: ROADMAP_CATEGORIES.content,
      priority: 'low',
      estimatedImpact: 5,
    })
  }
}

// ─── Phase + HowTo 매핑 ───

/** week 번호 → Phase 라벨 */
function assignPhaseLabels(items: RoadmapItem[]): void {
  for (const item of items) {
    if (item.week <= 4) {
      item.phase = 'Phase 1: 즉시 실행 (1-4주)'
    } else if (item.week <= 8) {
      item.phase = 'Phase 2: 단기 개선 (5-8주)'
    } else {
      item.phase = 'Phase 3: 중장기 최적화 (9-12주)'
    }
  }
}

/**
 * 로드맵 항목의 title과 매칭되는 AI insight의 suggestedFix를 howTo에 매핑
 * "[agentId] insight_title" 형식에서 insight_title로 매칭
 */
function assignHowToFromInsights(
  items: RoadmapItem[],
  completedResults: AIAgentResult[]
): void {
  const allInsights = completedResults.flatMap((r) => r.insights)

  for (const item of items) {
    if (item.howTo) continue // 이미 있으면 스킵

    // "[agentId] title" 에서 title 부분 추출
    const titlePart = item.title.replace(/^\[[^\]]+\]\s*/, '')

    const matched = allInsights.find(
      (ins) =>
        ins.title === titlePart ||
        ins.title === item.title ||
        item.title.includes(ins.title)
    )

    if (matched?.suggestedFix) {
      item.howTo = matched.suggestedFix
    }
  }
}

// ─── 유틸리티 ───

interface InsightWithAgent {
  insight: AIInsight
  agentId: string
}

/** severity별 인사이트 수집 (competitors 에이전트 제외, 카테고리별 최대 3개) */
function collectInsightsBySeverity(
  completedResults: AIAgentResult[],
  severity: AIInsight['severity']
): InsightWithAgent[] {
  const categoryCounts = new Map<string, number>()
  const result: InsightWithAgent[] = []

  for (const agentResult of completedResults) {
    // competitors 에이전트는 이미 competitorRoadmap으로 반영됨 → 스킵
    if (agentResult.agentId === 'competitors') continue

    for (const insight of agentResult.insights) {
      if (insight.severity !== severity) continue

      const count = categoryCounts.get(insight.category) ?? 0
      if (count >= MAX_INSIGHTS_PER_CATEGORY) continue

      categoryCounts.set(insight.category, count + 1)
      result.push({ insight, agentId: agentResult.agentId })
    }
  }

  return result
}

/**
 * 중복 제거: title 기반 유사도 비교
 * 한쪽이 다른 쪽을 포함하면 먼저 등장한 쪽 유지
 */
function deduplicateItems(items: RoadmapItem[]): RoadmapItem[] {
  const unique: RoadmapItem[] = []

  for (const item of items) {
    const trimmedTitle = item.title.trim()
    if (!trimmedTitle) continue

    const isDuplicate = unique.some(
      (existing) =>
        existing.title === trimmedTitle ||
        existing.title.includes(trimmedTitle) ||
        trimmedTitle.includes(existing.title)
    )

    if (!isDuplicate) {
      unique.push(item)
    }
  }

  return unique
}

/** 주차별 최대 3개 + 전체 최대 24개 제한 */
function applyLimits(items: RoadmapItem[]): RoadmapItem[] {
  // 우선순위순 정렬: high > medium > low, 그 안에서 week순
  const priorityOrder = { high: 0, medium: 1, low: 2 } as const
  const sorted = [...items].sort((a, b) => {
    if (a.week !== b.week) return a.week - b.week
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  const weekCounts = new Map<number, number>()
  const limited: RoadmapItem[] = []

  for (const item of sorted) {
    const count = weekCounts.get(item.week) ?? 0
    if (count >= MAX_ITEMS_PER_WEEK) continue
    if (limited.length >= MAX_TOTAL_ITEMS) break

    weekCounts.set(item.week, count + 1)
    limited.push(item)
  }

  return limited
}
