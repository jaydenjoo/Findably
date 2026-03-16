import type { MetaTagItem } from './meta-tag-utils'
import { STATUS_STYLES } from './meta-tag-utils'

interface CurrentMetaTagsSectionProps {
  items: MetaTagItem[]
}

export function CurrentMetaTagsSection({
  items,
}: CurrentMetaTagsSectionProps): React.JSX.Element {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-slate-800">
        현재 메타태그 분석
      </h2>
      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const style = STATUS_STYLES[item.status]

          return (
            <div
              key={item.tag}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              {/* Header: tag label + status badge + length */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-semibold text-slate-900">
                    {item.label}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${style.bg} ${style.text}`}
                  >
                    {style.label}
                  </span>
                </div>
                {item.maxLength != null && (
                  <span className="text-xs tabular-nums text-slate-400">
                    {item.currentLength}/{item.maxLength}자
                  </span>
                )}
              </div>

              {/* Current value */}
              <div className="mt-3">
                {item.current != null ? (
                  <p className="break-all rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
                    {item.current}
                  </p>
                ) : (
                  <p className="text-sm italic text-slate-400">값이 없습니다</p>
                )}
              </div>

              {/* Issue description */}
              {item.issue != null && (
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  {item.issue}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
