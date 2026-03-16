import { Lightbulb } from 'lucide-react'
import type { CmsGuide } from '@/features/actions'

interface CmsGuideSectionProps {
  guide: CmsGuide
}

export function CmsGuideSection({
  guide,
}: CmsGuideSectionProps): React.JSX.Element {
  return (
    <section className="flex flex-col gap-3" aria-label="CMS 적용 가이드">
      <h2 className="text-lg font-semibold text-slate-900">
        {guide.displayName} 적용 가이드
      </h2>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {guide.codeLocation && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">
              삽입 위치:
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
              {guide.codeLocation}
            </span>
          </div>
        )}

        <ol className="flex flex-col gap-3">
          {guide.steps.map((step, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700">
                {index + 1}
              </span>
              <p className="pt-0.5 text-sm leading-relaxed text-slate-700">
                {step}
              </p>
            </li>
          ))}
        </ol>

        {guide.pluginRecommendation && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-primary-50 p-4">
            <Lightbulb
              className="mt-0.5 size-4 shrink-0 text-primary-600"
              aria-hidden="true"
            />
            <p className="text-sm text-primary-800">
              <span className="font-semibold">Tip: </span>
              {guide.pluginRecommendation}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
