import { Skeleton } from '@/components/ui/skeleton'

export default function ActionsMetaTagsLoading(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>

      {/* Score summary */}
      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Skeleton className="size-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>

      {/* Current meta tags section */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-44" />
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-3 w-3/4" />
          </div>
        ))}
      </div>

      {/* Recommendations section */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-40" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="p-5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="mt-3 h-4 w-64" />
            </div>
            <div className="grid grid-cols-1 gap-4 px-5 pb-5 md:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="mt-2 h-4 w-full" />
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="mt-2 h-4 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
