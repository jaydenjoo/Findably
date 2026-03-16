import type {
  CompetitivePosition,
  EstimatedImpact,
  GapAnalysisResult,
  GapSeverity,
} from '@/features/competitors'

interface GapAnalysisSectionProps {
  gapAnalysis: GapAnalysisResult
}

const SEVERITY_STYLES: Record<
  GapSeverity,
  { bg: string; text: string; label: string }
> = {
  critical: { bg: 'bg-danger-50', text: 'text-danger-700', label: '심각' },
  warning: { bg: 'bg-warning-50', text: 'text-warning-700', label: '주의' },
  info: { bg: 'bg-primary-50', text: 'text-primary-700', label: '정보' },
}

const POSITION_STYLES: Record<
  CompetitivePosition,
  { bg: string; text: string; label: string }
> = {
  leading: { bg: 'bg-success-50', text: 'text-success-700', label: '선두' },
  competitive: {
    bg: 'bg-warning-50',
    text: 'text-warning-700',
    label: '경쟁적',
  },
  lagging: { bg: 'bg-danger-50', text: 'text-danger-700', label: '후발' },
}

const IMPACT_LABELS: Record<EstimatedImpact, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
}

export function GapAnalysisSection({
  gapAnalysis,
}: GapAnalysisSectionProps): React.JSX.Element {
  const { gaps, competitivePosition, summary } = gapAnalysis
  const posStyle = POSITION_STYLES[competitivePosition]

  return (
    <div className="space-y-6">
      {/* Competitive Position + Summary */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-500">
            경쟁 포지션
          </span>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${posStyle.bg} ${posStyle.text}`}
          >
            {posStyle.label}
          </span>
        </div>
        <p className="text-sm text-slate-500">{summary}</p>
      </div>

      {/* Gap Items */}
      {gaps.length === 0 ? (
        <div className="rounded-xl border border-success-200 bg-success-50 p-6 text-center">
          <p className="font-medium text-success-700">
            모든 카테고리에서 경쟁사 대비 우위를 점하고 있습니다.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {gaps.map((gap) => {
            const sevStyle = SEVERITY_STYLES[gap.severity]

            return (
              <div
                key={gap.category}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">
                        {gap.categoryLabel}
                      </h3>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${sevStyle.bg} ${sevStyle.text}`}
                      >
                        {sevStyle.label}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                        영향: {IMPACT_LABELS[gap.estimatedImpact]}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600">
                      {gap.description}
                    </p>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="mb-1 text-xs font-medium text-slate-400">
                        개선 방법
                      </p>
                      <p className="text-sm text-slate-700">
                        {gap.suggestedAction}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="font-display text-2xl font-bold tabular-nums text-danger-500">
                      {gap.gap}
                    </span>
                    <p className="text-xs text-slate-400">점 차이</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
