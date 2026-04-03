import type { CategoryScore } from '@/features/diagnosis-free/types'
import { SCORING } from '@/config/scoring'

interface RiskHeatmapProps {
  categories: CategoryScore[]
}

/**
 * 카테고리별 점수를 색상 블록으로 한눈에 표시
 * 빨강(0-39) / 노랑(40-69) / 초록(70-100)
 * Semrush 스타일 리스크 히트맵
 */
export function RiskHeatmap({
  categories,
}: RiskHeatmapProps): React.JSX.Element {
  // 점수 오름차순 정렬 (위험한 것 먼저)
  const sorted = [...categories].sort((a, b) => a.score - b.score)

  return (
    <section className="flex flex-col gap-3" aria-label="리스크 히트맵">
      <h2 className="text-lg font-semibold text-slate-900">
        리스크 히트맵 — 한눈에 보는 건강 상태
      </h2>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {sorted.map((cat) => {
          const color = SCORING.getScoreColor(cat.score)
          const grade = SCORING.getScoreLabel(cat.score)
          const failedCount =
            cat.totalCount - cat.passedCount - cat.skippedCount

          return (
            <div
              key={cat.id}
              className={`flex flex-col gap-1.5 rounded-lg border p-3 ${color.bg} ${color.border ?? 'border-slate-200'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 truncate">
                  {cat.name}
                </span>
                <span
                  className={`font-display text-lg font-bold tabular-nums ${color.text}`}
                >
                  {cat.score}
                </span>
              </div>

              {/* 미니 프로그레스바 */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/50">
                <div
                  className={`h-full rounded-full ${color.bar}`}
                  style={{
                    width: `${Math.max(0, Math.min(100, cat.score))}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${color.text}`}>{grade}</span>
                {failedCount > 0 && (
                  <span className="text-slate-500">
                    {failedCount}건 개선필요
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
