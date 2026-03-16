import { Copy, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BlurOverlay } from '@/components/shared/BlurOverlay'
import { BLUR_OVERLAY_CTA } from '@/config/report'
import type { RecommendedSchema } from '@/features/actions'

interface CopyState {
  index: number
  success: boolean
}

interface RecommendedSchemaSectionProps {
  recommendations: RecommendedSchema[]
  isPaid: boolean
  copyState: CopyState | null
  onCopy: (code: string, index: number) => void
}

const PRIORITY_STYLES = {
  high: {
    bg: 'bg-danger-50',
    text: 'text-danger-700',
    label: '높음',
  },
  medium: {
    bg: 'bg-warning-50',
    text: 'text-warning-700',
    label: '보통',
  },
  low: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    label: '낮음',
  },
} as const

export function RecommendedSchemaSection({
  recommendations,
  isPaid,
  copyState,
  onCopy,
}: RecommendedSchemaSectionProps): React.JSX.Element {
  if (recommendations.length === 0) {
    return (
      <section className="flex flex-col gap-3" aria-label="추천 Schema Markup">
        <h2 className="text-lg font-semibold text-slate-900">
          추천 Schema Markup
        </h2>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-success-50">
              <Check className="size-5 text-success-600" />
            </div>
            <p className="text-sm text-slate-700">
              모든 기본 Schema Markup이 이미 적용되어 있습니다.
            </p>
          </div>
        </div>
      </section>
    )
  }

  const content = (
    <section className="flex flex-col gap-3" aria-label="추천 Schema Markup">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          추천 Schema Markup
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          사이트에 맞는 JSON-LD 코드를 복사하여 적용하세요.
        </p>
      </div>
      <div className="flex flex-col gap-4">
        {recommendations.map((rec, index) => {
          const priority = PRIORITY_STYLES[rec.priority]
          const isCopied = copyState?.index === index && copyState.success
          const isCopyError = copyState?.index === index && !copyState.success

          return (
            <div
              key={rec.type}
              className="rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 p-5 pb-3">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                      {rec.type}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${priority.bg} ${priority.text}`}
                    >
                      우선순위: {priority.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{rec.description}</p>
                </div>
              </div>

              {/* Code block */}
              <div className="relative mx-5 mb-5 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-4 py-2">
                  <span className="font-mono text-xs text-slate-500">
                    application/ld+json
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCopy(rec.code, index)}
                    aria-label={`${rec.type} Schema Markup 코드 복사`}
                    className="h-7 gap-1.5 px-2 text-xs"
                  >
                    {isCopied ? (
                      <>
                        <Check className="size-3.5 text-success-600" />
                        <span className="text-success-600">복사됨</span>
                      </>
                    ) : isCopyError ? (
                      <>
                        <AlertCircle className="size-3.5 text-danger-500" />
                        <span className="text-danger-500">실패</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        <span>복사</span>
                      </>
                    )}
                  </Button>
                </div>
                <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-slate-700">
                  <code className="font-mono">{rec.code}</code>
                </pre>
              </div>
            </div>
          )
        })}
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
