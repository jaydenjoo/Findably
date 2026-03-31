import { BlurOverlay } from '@/components/shared/BlurOverlay'
import { BLUR_OVERLAY_CTA } from '@/config/report'
import type { RoadmapItem } from '@/features/diagnosis-paid'

interface RoadmapSectionProps {
  roadmap: RoadmapItem[]
  isPaid: boolean
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
    bg: 'bg-success-50',
    text: 'text-success-700',
    label: '낮음',
  },
} as const

/** 주차별 그룹핑 */
function groupByWeek(items: RoadmapItem[]): Map<number, RoadmapItem[]> {
  const groups = new Map<number, RoadmapItem[]>()
  for (const item of items) {
    const existing = groups.get(item.week)
    if (existing) {
      existing.push(item)
    } else {
      groups.set(item.week, [item])
    }
  }
  return groups
}

export function RoadmapSection({
  roadmap,
  isPaid,
}: RoadmapSectionProps): React.JSX.Element {
  const safeRoadmap = roadmap ?? []
  const weekGroups = groupByWeek(safeRoadmap)
  const sortedWeeks = [...weekGroups.keys()].sort((a, b) => a - b)

  const content = (
    <section className="flex flex-col gap-4" aria-label="90일 실행 로드맵">
      <h2 className="text-lg font-semibold text-slate-900">90일 실행 로드맵</h2>
      <p className="text-sm text-slate-500">
        우선순위와 영향도를 고려한 주차별 실행 계획입니다.
      </p>

      <div className="relative ml-4 border-l-2 border-primary-200 pl-6">
        {sortedWeeks.map((week, weekIdx) => {
          const items = weekGroups.get(week) ?? []
          return (
            <div
              key={week}
              className="relative pb-8 last:pb-0"
              style={{
                animationDelay: `${weekIdx * 0.1}s`,
              }}
            >
              {/* 타임라인 도트 */}
              <div className="absolute -left-[31px] top-0.5 flex size-5 items-center justify-center rounded-full border-2 border-primary-500 bg-white">
                <div className="size-2 rounded-full bg-primary-500" />
              </div>

              {/* 주차 라벨 */}
              <span className="mb-3 inline-block rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                {week}주차
              </span>

              {/* 항목들 */}
              <div className="mt-2 flex flex-col gap-3">
                {items.map((item, itemIdx) => {
                  const priority = PRIORITY_STYLES[item.priority]
                  return (
                    <div
                      key={itemIdx}
                      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">
                          {item.title}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${priority.bg} ${priority.text}`}
                        >
                          {priority.label}
                        </span>
                      </div>
                      <p className="mb-2 text-sm text-slate-600">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>카테고리: {item.category}</span>
                        <span>
                          예상 영향:{' '}
                          <strong className="text-slate-600">
                            +{item.estimatedImpact}점
                          </strong>
                        </span>
                      </div>
                    </div>
                  )
                })}
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
