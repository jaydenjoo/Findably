import { BlurOverlay } from '@/components/shared/BlurOverlay'
import { BLUR_OVERLAY_CTA } from '@/config/report'
import type {
  AICitationTrackingResult,
  CitationStatus,
} from '@/features/diagnosis-paid'

interface CitationTrackingSectionProps {
  tracking: AICitationTrackingResult
  isPaid: boolean
}

const STATUS_CONFIG: Record<
  CitationStatus,
  { label: string; symbol: string; bg: string; text: string }
> = {
  mentioned: {
    label: '언급됨',
    symbol: 'Y',
    bg: 'bg-success-50',
    text: 'text-success-700',
  },
  similar: {
    label: '유사',
    symbol: '△',
    bg: 'bg-warning-50',
    text: 'text-warning-700',
  },
  not_mentioned: {
    label: '미언급',
    symbol: 'N',
    bg: 'bg-danger-50',
    text: 'text-danger-700',
  },
}

export function CitationTrackingSection({
  tracking,
  isPaid,
}: CitationTrackingSectionProps): React.JSX.Element {
  const mentionRate = Math.round((tracking.overallMentionRate ?? 0) * 100)
  const results = tracking.results ?? []
  const platformSummary = tracking.platformSummary ?? []
  const keywords = tracking.keywords ?? []

  // O(1) 룩업 맵: "keyword::platform" → CitationStatus
  const resultMap = new Map<string, CitationStatus>()
  for (const r of results) {
    resultMap.set(`${r.keyword}::${r.platform}`, r.status)
  }

  const content = (
    <section className="flex flex-col gap-4" aria-label="AI 인용 추적">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-slate-900">AI 인용 추적</h2>
        <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
          전체 인용률 {mentionRate}%
        </span>
      </div>

      <p className="text-sm text-slate-500">
        타겟 키워드를 AI에 질문했을 때, 우리 사이트가 답변에 언급되는지 확인한
        결과입니다. 미언급(N) 항목은 콘텐츠 보강이나 구조화 데이터 추가로 개선할
        수 있습니다.
      </p>

      {/* 플랫폼별 요약 카드 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {platformSummary.map((platform) => (
          <div
            key={platform.platform}
            className="flex flex-col items-center gap-1 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <span className="text-xs font-medium text-slate-500">
              {platform.platformLabel}
            </span>
            <span className="font-display text-xl font-bold text-slate-900">
              {platform.mentionedCount}
              <span className="text-sm font-normal text-slate-400">
                /{platform.totalKeywords}
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* 키워드 × 플랫폼 매트릭스 */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm" aria-label="키워드별 AI 인용 현황">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                키워드
              </th>
              {platformSummary.map((p) => (
                <th
                  key={p.platform}
                  className="px-4 py-3 text-center text-xs font-semibold text-slate-600"
                >
                  {p.platformLabel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keywords.map((keyword) => (
              <tr
                key={keyword}
                className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50"
              >
                <td className="px-4 py-3 font-medium text-slate-700">
                  {keyword}
                </td>
                {platformSummary.map((p) => {
                  const status =
                    resultMap.get(`${keyword}::${p.platform}`) ??
                    'not_mentioned'
                  const config = STATUS_CONFIG[status]
                  return (
                    <td key={p.platform} className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex size-7 items-center justify-center rounded-full text-xs font-bold ${config.bg} ${config.text}`}
                        title={`${keyword} — ${p.platformLabel}: ${config.label}`}
                        aria-label={`${keyword} — ${p.platformLabel}: ${config.label}`}
                      >
                        {config.symbol}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
