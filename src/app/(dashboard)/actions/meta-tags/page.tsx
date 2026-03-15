import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BlurOverlay } from '@/components/shared/BlurOverlay'

export const metadata: Metadata = {
  title: '메타 태그 최적화 | Findably',
  description: '메타 태그 최적화 제안을 확인하세요.',
}

export default async function ActionsMetaTagsPage(): Promise<React.JSX.Element> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <BlurOverlay
      visiblePercent={20}
      ctaLabel="상세 분석 받기 — 9.9만원"
      ctaHref="/pricing"
      sampleLabel="샘플 먼저 보기 →"
      sampleHref="/reports/sample"
    >
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-slate-900">메타 태그 최적화</h1>
        <p className="text-slate-500">
          메타 태그 최적화 제안을 확인하고 적용하세요.
        </p>

        {/* Skeleton: current vs suggested comparison */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-4 h-5 w-32 animate-pulse rounded bg-slate-200" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2 rounded border border-slate-100 bg-slate-50 p-3">
                <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
              </div>
              <div className="space-y-2 rounded border border-slate-100 bg-green-50 p-3">
                <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </BlurOverlay>
  )
}
