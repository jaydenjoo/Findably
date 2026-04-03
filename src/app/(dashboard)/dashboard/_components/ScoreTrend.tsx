import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface ScoreTrendProps {
  currentScore: number
  previousScore: number
  previousDate: string
}

/**
 * 점수 변화 트렌드 표시
 * "이전 대비 +12점 ↑" 또는 "-5점 ↓" 또는 "변화 없음"
 */
export function ScoreTrend({
  currentScore,
  previousScore,
  previousDate,
}: ScoreTrendProps): React.JSX.Element {
  const diff = currentScore - previousScore
  const absDiff = Math.abs(diff)

  const dateStr = new Date(previousDate).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  })

  if (diff === 0) {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1">
        <Minus className="size-3.5 text-slate-500" />
        <span className="text-xs font-medium text-slate-500">
          이전과 동일 ({dateStr} 대비)
        </span>
      </div>
    )
  }

  const isUp = diff > 0

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 ${
        isUp ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'
      }`}
    >
      {isUp ? (
        <TrendingUp className="size-3.5" />
      ) : (
        <TrendingDown className="size-3.5" />
      )}
      <span className="text-xs font-semibold">
        {isUp ? '+' : '-'}
        {absDiff}점
      </span>
      <span className="text-xs font-normal opacity-75">{dateStr} 대비</span>
    </div>
  )
}
