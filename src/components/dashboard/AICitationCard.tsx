import type {
  AICitationPossibilityScore,
  PlatformCitationScore,
} from '@/features/diagnosis-free/types'
import type { ScoreGrade } from '@/types/ui'
import { SCORING } from '@/config/scoring'

/** 등급 → 프로그레스 바 색상 */
const GRADE_BAR_COLORS: Record<ScoreGrade, string> = {
  excellent: 'bg-success-500',
  good: 'bg-primary-500',
  warning: 'bg-warning-500',
  critical: 'bg-danger-500',
} as const

interface AICitationCardProps {
  citation: AICitationPossibilityScore
}

/** 플랫폼별 점수 행 */
function PlatformRow({
  platform,
}: {
  platform: PlatformCitationScore
}): React.JSX.Element {
  const grade = SCORING.getScoreGrade(platform.score)
  const color = SCORING.getScoreColor(platform.score)
  const barColor = GRADE_BAR_COLORS[grade]

  return (
    <div className="flex items-center gap-3">
      {/* 플랫폼 이름 */}
      <span className="w-28 shrink-0 text-sm font-medium text-slate-700">
        {platform.platformLabel}
      </span>

      {/* 차단 뱃지 또는 점수 바 */}
      {platform.blocked ? (
        <div className="flex flex-1 items-center gap-2">
          <span className="rounded-full bg-danger-50 px-2 py-0.5 text-xs font-semibold text-danger-600">
            차단됨
          </span>
          <span className="text-xs text-slate-400">
            robots.txt에서 봇 차단 중
          </span>
        </div>
      ) : (
        <div className="flex flex-1 items-center gap-2">
          <div
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"
            role="meter"
            aria-valuenow={platform.score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${platform.platformLabel} 인용 가능성 ${platform.score}점`}
          >
            <div
              className={`h-full rounded-full ${barColor} transition-all`}
              style={{ width: `${Math.min(platform.score, 100)}%` }}
            />
          </div>
          <span
            className={`w-10 text-right text-sm font-semibold ${color.text}`}
          >
            {platform.score}
          </span>
        </div>
      )}
    </div>
  )
}

export function AICitationCard({
  citation,
}: AICitationCardProps): React.JSX.Element {
  const overallColor = SCORING.getScoreColor(citation.overallScore)
  const overallLabel = SCORING.getScoreLabel(citation.overallScore)

  return (
    <section
      className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      aria-label="AI 인용 가능성"
    >
      {/* 헤더: 제목 + 종합 뱃지 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">AI 인용 가능성</h2>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${overallColor.bg} ${overallColor.text}`}
        >
          {citation.overallScore}점 · {overallLabel}
        </span>
      </div>

      {/* 플랫폼별 행 */}
      <div className="flex flex-col gap-3">
        {citation.platforms.map((platform) => (
          <PlatformRow key={platform.platform} platform={platform} />
        ))}
      </div>

      {/* 추천 메시지 */}
      <div className="rounded-lg bg-slate-50 p-3">
        <p className="text-sm leading-relaxed text-slate-600">
          {citation.recommendation}
        </p>
      </div>
    </section>
  )
}
