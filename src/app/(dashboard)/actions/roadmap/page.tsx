import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BlurOverlay } from '@/components/shared/BlurOverlay'
import { EmptyState } from '@/components/shared/EmptyState'
import { AlertCircle, Calendar, ArrowUpRight, Zap } from 'lucide-react'
import type { RoadmapItem } from '@/features/diagnosis-paid/types'
import { parseAnalysisData } from '@/lib/utils/diagnosis-parser'

export const metadata: Metadata = {
  title: '90일 실행 계획',
  description: '90일 SEO/GEO 실행 계획을 확인하세요.',
}

/** 주차 기반 3단계 구간 분류 */
interface RoadmapPhase {
  label: string
  weekRange: string
  items: RoadmapItem[]
}

function groupByPhase(items: RoadmapItem[]): RoadmapPhase[] {
  const phases: RoadmapPhase[] = [
    { label: '기초 세팅', weekRange: '1~4주차', items: [] },
    { label: '성장 가속', weekRange: '5~8주차', items: [] },
    { label: '성과 최적화', weekRange: '9~12주차', items: [] },
  ]

  for (const item of items) {
    if (item.week <= 4) {
      phases[0]!.items.push(item)
    } else if (item.week <= 8) {
      phases[1]!.items.push(item)
    } else {
      phases[2]!.items.push(item)
    }
  }

  return phases
}

const PRIORITY_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  high: { bg: 'bg-danger-50', text: 'text-danger-600', label: '높음' },
  medium: { bg: 'bg-warning-50', text: 'text-warning-600', label: '보통' },
  low: { bg: 'bg-success-50', text: 'text-success-600', label: '낮음' },
}

const PHASE_COLORS = [
  'bg-primary-500',
  'bg-warning-500',
  'bg-success-500',
] as const

export default async function ActionsRoadmapPage(): Promise<React.JSX.Element> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 최신 완료 진단 조회
  const { data: diagnosis, error } = await supabase
    .from('diagnoses')
    .select('id, url, tier, status, analysis_data')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[roadmap] DB error:', error.message)
    return (
      <EmptyState
        icon={AlertCircle}
        title="데이터를 불러올 수 없습니다"
        description="잠시 후 다시 시도해주세요."
        action={{ label: '새로고침 →', href: '/actions/roadmap' }}
      />
    )
  }

  if (!diagnosis) {
    return (
      <EmptyState
        icon={Calendar}
        title="아직 진단 결과가 없어요"
        description="URL을 입력하고 무료 진단을 시작해보세요."
        action={{ label: '진단 시작 →', href: '/onboarding/url' }}
      />
    )
  }

  const isPaid = diagnosis.tier === 'paid'

  // Free 사용자 — BlurOverlay + 스켈레톤
  if (!isPaid) {
    return (
      <BlurOverlay
        visiblePercent={20}
        ctaLabel="상세 분석 받기 — 9.9만원"
        ctaHref="/pricing"
        sampleLabel="샘플 먼저 보기 →"
        sampleHref="/reports/sample"
      >
        <div className="flex flex-col gap-6">
          <h1 className="text-2xl font-bold text-slate-900">90일 실행 계획</h1>
          <p className="text-slate-500">90일 SEO/GEO 실행 계획입니다.</p>
          <div className="space-y-6">
            {['1~4주차', '5~8주차', '9~12주차'].map((phase) => (
              <div
                key={phase}
                className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                    <div className="h-5 w-5 animate-pulse rounded-full bg-slate-200" />
                  </div>
                  <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
                </div>
                <div className="space-y-3">
                  {[1, 2].map((task) => (
                    <div key={task} className="flex gap-3 pl-11">
                      <div className="h-4 w-4 animate-pulse rounded bg-slate-100" />
                      <div className="flex-1">
                        <div className="mb-1 h-4 w-full animate-pulse rounded bg-slate-100" />
                        <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </BlurOverlay>
    )
  }

  // Paid 사용자 — 실제 로드맵 데이터
  const analysisData = diagnosis.analysis_data as Record<string, unknown> | null
  const rawRoadmap = analysisData?.roadmap

  if (!Array.isArray(rawRoadmap) || rawRoadmap.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="로드맵 데이터가 없습니다"
        description="분석이 완료되었지만 로드맵이 생성되지 않았습니다. 지원팀에 문의해주세요."
        action={{ label: '대시보드로 →', href: '/dashboard' }}
      />
    )
  }

  const roadmap = rawRoadmap as RoadmapItem[]
  const phases = groupByPhase(roadmap)

  // Quick Win 항목 추출 (즉시 실행 가능한 항목)
  const parsedAnalysis = parseAnalysisData(diagnosis.analysis_data)
  const quickWins = parsedAnalysis?.overallScore.quickWins ?? []

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">90일 실행 계획</h1>
        <p className="mt-2 text-sm text-slate-500">
          AI가 분석한 우선순위 기반 실행 로드맵입니다. 위에서부터 순서대로
          진행하세요.
        </p>
      </div>

      {/* 즉시 실행 섹션 — Quick Win 기반 */}
      {quickWins.length > 0 && (
        <div className="rounded-xl border-2 border-primary-200 bg-primary-50/50 shadow-sm">
          <div className="flex items-center gap-3 border-b border-primary-100 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white">
              <Zap className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                즉시 실행 — Quick Win
              </p>
              <p className="text-xs text-slate-500">
                지금 바로 개선할 수 있는 {quickWins.length}개 항목
              </p>
            </div>
          </div>
          <div className="divide-y divide-primary-50">
            {quickWins.map((qw) => (
              <div key={qw.ruleId} className="flex items-start gap-4 px-6 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100">
                  <Zap className="size-4 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {qw.ruleName}
                    </p>
                    <span className="inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 text-[11px] font-semibold text-primary-700">
                      영향도 {qw.impact}점
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                    {qw.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phases */}
      <div className="space-y-6">
        {phases.map((phase, phaseIdx) => (
          <div
            key={phase.weekRange}
            className="rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            {/* Phase header */}
            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-bold ${PHASE_COLORS[phaseIdx]}`}
              >
                {phaseIdx + 1}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {phase.weekRange} — {phase.label}
                </p>
                <p className="text-xs text-slate-500">
                  {phase.items.length}개 항목
                </p>
              </div>
            </div>

            {/* Items */}
            {phase.items.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-slate-400">
                이 구간에 해당하는 항목이 없습니다
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {phase.items.map((item, itemIdx) => {
                  const priority =
                    PRIORITY_STYLES[item.priority] ?? PRIORITY_STYLES['medium']!
                  return (
                    <div
                      key={`${item.week}-${itemIdx}`}
                      className="flex items-start gap-4 px-6 py-4 transition-colors hover:bg-slate-50"
                    >
                      {/* Week badge */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                        <span className="text-xs font-semibold text-slate-600">
                          {item.week}주
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {item.title}
                          </p>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${priority.bg} ${priority.text}`}
                          >
                            {priority.label}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                          {item.description}
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                          <span className="capitalize">{item.category}</span>
                          {item.estimatedImpact > 0 && (
                            <span className="flex items-center gap-0.5">
                              <ArrowUpRight className="size-3" />
                              영향도 {item.estimatedImpact}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
