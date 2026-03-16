import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-5 w-20" />
      </div>

      {/* 1행: 종합 점수 + AI 인용 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* 종합 점수 카드 */}
        <div className="flex flex-col items-center gap-4 rounded-lg border border-slate-200 bg-white p-6">
          <Skeleton className="h-5 w-36 self-start" />
          <Skeleton className="size-40 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-14" />
          </div>
        </div>

        {/* AI 인용 카드 */}
        <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-1.5 flex-1 rounded-full" />
                <Skeleton className="h-4 w-10" />
              </div>
            ))}
          </div>
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </div>

      {/* 2행: Quick Win */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-52" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex min-w-[260px] flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-1 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* 3행: 카테고리별 점수 */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-36" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-14" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
