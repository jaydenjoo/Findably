import { Button } from '@/components/ui/button'
import { BlurOverlay } from '@/components/shared/BlurOverlay'
import { BLUR_OVERLAY_CTA } from '@/config/report'
import type { MetaTagRecommendation } from './meta-tag-utils'
import { PRIORITY_STYLES } from './meta-tag-utils'

interface CopyState {
  index: number
  success: boolean
}

interface RecommendedMetaTagsSectionProps {
  recommendations: MetaTagRecommendation[]
  isPaid: boolean
  copyState: CopyState | null
  onCopy: (code: string, index: number) => Promise<void>
}

export function RecommendedMetaTagsSection({
  recommendations,
  isPaid,
  copyState,
  onCopy,
}: RecommendedMetaTagsSectionProps): React.JSX.Element {
  if (recommendations.length === 0) {
    return (
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          최적화 추천
        </h2>
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-success-50">
            <span className="text-sm text-success-600" aria-hidden="true">
              ✓
            </span>
          </div>
          <p className="mt-3 text-sm font-medium text-slate-700">
            모든 메타태그가 양호합니다
          </p>
          <p className="mt-1 text-xs text-slate-500">
            현재 설정된 메타태그가 SEO 기준에 부합합니다.
          </p>
        </div>
      </section>
    )
  }

  const content = (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-slate-800">최적화 추천</h2>
      <div className="flex flex-col gap-4">
        {recommendations.map((rec, idx) => {
          const priorityStyle = PRIORITY_STYLES[rec.priority]
          const isCopied = copyState?.index === idx && copyState.success
          const isCopyFailed = copyState?.index === idx && !copyState.success

          return (
            <div
              key={rec.tag}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              {/* Header */}
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    {rec.label}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${priorityStyle.bg} ${priorityStyle.text}`}
                  >
                    {priorityStyle.label}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                  {rec.reason}
                </p>
              </div>

              {/* Current vs Recommended comparison */}
              <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
                {/* Current */}
                <div className="rounded-lg border border-danger-100 bg-danger-50/50 p-3">
                  <span className="text-xs font-semibold text-danger-600">
                    현재값
                  </span>
                  <p className="mt-1.5 break-all text-xs text-slate-700">
                    {rec.current ?? '(없음)'}
                  </p>
                </div>
                {/* Recommended */}
                <div className="rounded-lg border border-success-100 bg-success-50/50 p-3">
                  <span className="text-xs font-semibold text-success-600">
                    추천값
                  </span>
                  <p className="mt-1.5 break-all text-xs text-slate-700">
                    {rec.recommended}
                  </p>
                </div>
              </div>

              {/* Code + Copy button */}
              <div className="border-t border-slate-100 px-5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <code className="flex-1 overflow-x-auto text-xs text-slate-600">
                    {rec.code}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCopy(rec.code, idx)}
                    aria-label={`${rec.label} 코드 복사`}
                    className="shrink-0"
                  >
                    {isCopied
                      ? '복사됨!'
                      : isCopyFailed
                        ? '복사 실패'
                        : '코드 복사'}
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )

  if (!isPaid) {
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

  return content
}
