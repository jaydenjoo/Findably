import type { RuleResult } from '@/features/diagnosis-free/types'
import { SCORING } from '@/config/scoring'
import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react'

interface RuleListItemProps {
  rule: RuleResult
}

export function RuleListItem({ rule }: RuleListItemProps): React.JSX.Element {
  const severity = SCORING.SEVERITY_STYLES[rule.severity]

  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 transition-all hover:-translate-y-px hover:shadow-md">
      {/* 통과/실패/스킵 아이콘 */}
      <div className="mt-0.5 shrink-0">
        {rule.skipped ? (
          <MinusCircle className="size-5 text-slate-300" aria-hidden="true" />
        ) : rule.passed ? (
          <CheckCircle2
            className="size-5 text-success-500"
            aria-hidden="true"
          />
        ) : (
          <XCircle className="size-5 text-danger-500" aria-hidden="true" />
        )}
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-slate-900">{rule.name}</h4>
          {!rule.passed && !rule.skipped && (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${severity.bg} ${severity.text}`}
            >
              {severity.label}
            </span>
          )}
        </div>
        <p className="text-sm leading-relaxed text-slate-500">{rule.message}</p>
      </div>

      {/* 점수 */}
      <div className="shrink-0 text-right">
        <span className="text-sm font-semibold tabular-nums text-slate-700">
          {rule.points}
        </span>
        <span className="text-xs text-slate-400">/{rule.maxPoints}</span>
      </div>
    </div>
  )
}
