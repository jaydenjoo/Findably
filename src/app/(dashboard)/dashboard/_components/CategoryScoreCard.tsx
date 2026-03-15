import Link from 'next/link'
import type { CategoryScore } from '@/features/diagnosis-free/types'
import { SCORING } from '@/config/scoring'
import { getDiagnosisDetailUrl } from '@/lib/utils/category-routing'

interface CategoryScoreCardProps {
  category: CategoryScore
  diagnosisId: string
}

export function CategoryScoreCard({
  category,
  diagnosisId,
}: CategoryScoreCardProps): React.JSX.Element {
  const color = SCORING.getScoreColor(category.score)
  const percentage = Math.max(0, Math.min(100, category.score))
  const detailUrl = getDiagnosisDetailUrl(category.id, diagnosisId)

  return (
    <Link href={detailUrl} className="group">
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-px hover:shadow-md cursor-pointer">
        {/* 상단: 카테고리명 + 점수 */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            {category.name}
          </h3>
          <span
            className={`text-lg font-bold font-display tabular-nums ${color.text}`}
          >
            {category.score}
            <span className="text-xs font-normal text-slate-400">/100</span>
          </span>
        </div>

        {/* 프로그레스 바 */}
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
          role="meter"
          aria-valuenow={category.score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${category.name} 점수 ${category.score}점`}
        >
          <div
            className={`h-full rounded-full transition-all ${color.bar}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* 하단: 통과 비율 + 스킵 */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>
            통과 {category.passedCount}/{category.totalCount}
          </span>
          {category.skippedCount > 0 && (
            <span className="text-slate-400">
              ({category.skippedCount}개 스킵)
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
