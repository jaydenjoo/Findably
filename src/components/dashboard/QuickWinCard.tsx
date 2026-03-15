import type { QuickWin, RuleSeverity } from '@/features/diagnosis-free/types'
import { CATEGORY_CONFIG } from '@/features/diagnosis-free/constants'

/** severity → 뱃지 스타일 매핑 */
const SEVERITY_STYLES: Record<
  RuleSeverity,
  { bg: string; text: string; label: string }
> = {
  critical: { bg: 'bg-danger-50', text: 'text-danger-600', label: '심각' },
  warning: { bg: 'bg-warning-50', text: 'text-warning-600', label: '주의' },
  info: { bg: 'bg-primary-50', text: 'text-primary-600', label: '참고' },
} as const

/** severity → impact 바 색상 */
const SEVERITY_BAR_COLORS: Record<RuleSeverity, string> = {
  critical: 'bg-danger-500',
  warning: 'bg-warning-500',
  info: 'bg-primary-500',
} as const

interface QuickWinCardProps {
  quickWin: QuickWin
}

export function QuickWinCard({
  quickWin,
}: QuickWinCardProps): React.JSX.Element {
  const severity = SEVERITY_STYLES[quickWin.severity]
  const categoryName = CATEGORY_CONFIG[quickWin.category].name
  const barColor = SEVERITY_BAR_COLORS[quickWin.severity]

  return (
    <article
      className="flex min-w-[260px] flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-px hover:shadow-md"
      aria-label={`Quick Win: ${quickWin.ruleName}`}
    >
      {/* 상단: severity 뱃지 + 카테고리 */}
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${severity.bg} ${severity.text}`}
        >
          {severity.label}
        </span>
        <span className="text-xs text-slate-400">{categoryName}</span>
      </div>

      {/* 중앙: 룰 이름 + 메시지 */}
      <div className="flex flex-1 flex-col gap-1">
        <h3 className="text-sm font-semibold text-slate-900">
          {quickWin.ruleName}
        </h3>
        <p className="line-clamp-2 text-sm text-slate-500">
          {quickWin.message}
        </p>
      </div>

      {/* 하단: impact 바 */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">영향도</span>
          <span className="text-xs font-semibold text-slate-600">
            {quickWin.impact}점
          </span>
        </div>
        <div
          className="h-1 w-full overflow-hidden rounded-full bg-slate-100"
          role="meter"
          aria-valuenow={quickWin.impact}
          aria-valuemin={0}
          aria-valuemax={10}
          aria-label={`영향도 ${quickWin.impact}점`}
        >
          <div
            className={`h-full rounded-full ${barColor} transition-all`}
            style={{ width: `${Math.min((quickWin.impact / 10) * 100, 100)}%` }}
          />
        </div>
      </div>
    </article>
  )
}
