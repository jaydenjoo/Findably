import Link from 'next/link'
import type { QuickWin } from '@/features/diagnosis-free/types'
import { CATEGORY_CONFIG } from '@/features/diagnosis-free/constants'
import { SCORING } from '@/config/scoring'

interface QuickWinCardProps {
  quickWin: QuickWin
  diagnosisId: string
}

export function QuickWinCard({
  quickWin,
  diagnosisId,
}: QuickWinCardProps): React.JSX.Element {
  const severity = SCORING.SEVERITY_STYLES[quickWin.severity] ?? {
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    label: quickWin.severity,
  }
  const categoryName =
    CATEGORY_CONFIG[quickWin.category]?.name ?? quickWin.category
  const barColor =
    SCORING.SEVERITY_BAR_COLORS[quickWin.severity] ?? 'bg-slate-400'
  const detailUrl = `/diagnosis/overview?id=${diagnosisId}`

  return (
    <Link href={detailUrl}>
      <article
        className="flex min-w-[260px] flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-px hover:shadow-md cursor-pointer"
        aria-label={`Quick Win: ${quickWin.ruleName} — 자세히 보기`}
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
              style={{
                width: `${Math.min((quickWin.impact / 10) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      </article>
    </Link>
  )
}
