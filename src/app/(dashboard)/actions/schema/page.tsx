import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BlurOverlay } from '@/components/shared/BlurOverlay'

export const metadata: Metadata = {
  title: 'Schema Markup | Findably',
  description: 'Schema Markup 코드를 자동 생성합니다.',
}

export default async function ActionsSchemaPage(): Promise<React.JSX.Element> {
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
        <h1 className="text-2xl font-bold text-slate-900">Schema Markup</h1>
        <p className="text-slate-500">
          Schema Markup 코드 생성 및 적용 가이드입니다.
        </p>

        {/* Skeleton: code block placeholder */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <div className="mb-4 h-5 w-32 animate-pulse rounded bg-slate-200" />
          <div className="space-y-2 font-mono text-sm">
            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-3/5 animate-pulse rounded bg-slate-100" />
          </div>
        </div>

        {/* Skeleton: CMS guide section */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 h-5 w-48 animate-pulse rounded bg-slate-200" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-1 h-5 w-5 animate-pulse rounded bg-slate-100" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BlurOverlay>
  )
}
