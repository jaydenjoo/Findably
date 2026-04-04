import { BlurOverlay } from '@/components/shared/BlurOverlay'
import { BLUR_OVERLAY_CTA } from '@/config/report'
import { SCORING } from '@/config/scoring'
import type { CategoryScore } from '@/features/diagnosis-free'
import type { AIInsight } from '@/features/diagnosis-paid'

import { TotalLeakageCard } from './TotalLeakageCard'

interface BridgeSectionProps {
  categoryScores: CategoryScore[]
  aiInsights?: AIInsight[]
  isPaid: boolean
}

/** 카테고리 ID → 브릿지 테이블에 표시할 4개 영역 매핑 */
const BRIDGE_ROWS: {
  ids: string[]
  label: string
  meaning: string
}[] = [
  {
    ids: ['technical', 'content', 'mobile'],
    label: 'SEO (검색 최적화)',
    meaning: 'Google에서 고객이 당신을 찾을 수 있는가',
  },
  {
    ids: ['geo', 'social-ai'],
    label: 'GEO (AI 검색 최적화)',
    meaning: 'ChatGPT, Perplexity가 당신을 추천하는가',
  },
  {
    ids: ['performance'],
    label: '기술 인프라',
    meaning: '고객이 떠나지 않을 만큼 빠르고 안정적인가',
  },
  {
    ids: ['security'],
    label: '보안',
    meaning: '사이트가 안전하고 신뢰할 수 있는가',
  },
]

/** 여러 카테고리의 가중 평균 점수 계산 */
function calculateGroupScore(
  categoryScores: CategoryScore[],
  ids: string[]
): number | null {
  const matched = categoryScores.filter((c) => ids.includes(c.id))
  if (matched.length === 0) return null
  const totalWeight = matched.reduce((sum, c) => sum + c.weight, 0)
  if (totalWeight === 0) return null
  return Math.round(
    matched.reduce((sum, c) => sum + c.score * c.weight, 0) / totalWeight
  )
}

export function BridgeSection({
  categoryScores,
  aiInsights,
  isPaid,
}: BridgeSectionProps): React.JSX.Element {
  const safeScores = categoryScores ?? []

  const rows = BRIDGE_ROWS.map((row) => ({
    ...row,
    score: calculateGroupScore(safeScores, row.ids),
  }))

  const content = (
    <section
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-label="마케팅 누수 브릿지"
    >
      <h2 className="mb-4 text-lg font-semibold text-slate-900">
        🔍 마케팅 비용이 새는 곳을 찾았습니다
      </h2>

      <p className="mb-6 text-sm leading-relaxed text-slate-600">
        광고를 돌려도, SNS를 해도, 콘텐츠를 만들어도 —{' '}
        <br className="hidden sm:block" />
        고객이 당신의 웹사이트를{' '}
        <strong className="text-slate-800">
          검색에서 찾을 수 없거나
        </strong>,{' '}
        <strong className="text-slate-800">찾았는데 느려서 떠나거나</strong>,{' '}
        <strong className="text-slate-800">
          AI에게 물어봤는데 추천받지 못하면
        </strong>
        , 모든 마케팅 비용이 새고 있는 겁니다.
      </p>

      <p className="mb-4 text-sm text-slate-600">
        이 리포트는{' '}
        <strong className="text-slate-800">
          웹사이트에서 새고 있는 마케팅 비용의 구멍
        </strong>
        을 찾아서,{' '}
        <strong className="text-slate-800">어디를 먼저 막아야 하는지</strong>{' '}
        알려드립니다.
      </p>

      {safeScores.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="py-3 pr-4 font-semibold text-slate-700">
                  진단 영역
                </th>
                <th className="py-3 pr-4 font-semibold text-slate-700">
                  마케팅에서의 의미
                </th>
                <th className="py-3 text-center font-semibold text-slate-700">
                  점수
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const score = row.score
                const scoreColor =
                  score !== null ? SCORING.getScoreColor(score) : null
                return (
                  <tr
                    key={row.label}
                    className="border-b border-slate-100 last:border-b-0"
                  >
                    <td className="py-3 pr-4 font-medium text-slate-800">
                      {row.label}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{row.meaning}</td>
                    <td className="py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                          scoreColor
                            ? `${scoreColor.bg} ${scoreColor.text}`
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {score !== null ? `${score}/100` : '-'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate-400">진단 데이터 준비 중...</p>
      )}

      {aiInsights && aiInsights.length > 0 && (
        <div className="mt-4">
          <TotalLeakageCard insights={aiInsights} />
        </div>
      )}

      <p className="mt-4 text-xs text-slate-400">
        * 업종 평균 벤치마크 기준 추정치이며, 실제 결과와 다를 수 있습니다.
      </p>
    </section>
  )

  if (isPaid) return content

  return (
    <BlurOverlay
      visiblePercent={BLUR_OVERLAY_CTA.visiblePercent}
      ctaLabel={BLUR_OVERLAY_CTA.ctaLabel}
      ctaHref={BLUR_OVERLAY_CTA.ctaHref}
      sampleLabel={BLUR_OVERLAY_CTA.sampleLabel}
      sampleHref={BLUR_OVERLAY_CTA.sampleHref}
    >
      {content}
    </BlurOverlay>
  )
}
