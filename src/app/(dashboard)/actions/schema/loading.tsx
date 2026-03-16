import { Skeleton } from '@/components/ui/skeleton'

export default function ActionsSchemaLoading(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>

      {/* Existing schema section */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-40" />
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-72" />
            </div>
          </div>
        </div>
      </div>

      {/* Code block skeleton */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-48" />
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="p-5 pb-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
          <div className="mx-5 mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="space-y-2 font-mono">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-4/5" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-3/5" />
              <Skeleton className="h-3.5 w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* CMS guide skeleton */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-44" />
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="size-6 shrink-0 rounded-full" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
