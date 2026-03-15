import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BlurOverlay } from '@/components/shared/BlurOverlay'

export const metadata: Metadata = {
  title: '상세 리포트 | Findably',
  description: '상세 진단 리포트를 확인하세요.',
}

export default async function ReportDetailPage(): Promise<React.JSX.Element> {
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
        <h1 className="text-2xl font-bold text-slate-900">상세 리포트</h1>
        <p className="text-slate-500">상세 진단 리포트 결과입니다.</p>

        {/* Skeleton: score gauge placeholder */}
        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="h-32 w-32 animate-pulse rounded-full bg-slate-100" />
            <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
          </div>
        </div>

        {/* Skeleton: detailed sections */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 h-5 w-32 animate-pulse rounded bg-slate-200" />
              <div className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-4/6 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </BlurOverlay>
  )
}
