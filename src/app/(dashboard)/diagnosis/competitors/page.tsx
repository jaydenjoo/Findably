import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BlurOverlay } from '@/components/shared/BlurOverlay'

export const metadata: Metadata = {
  title: '경쟁사 비교 분석 | Findably',
  description: '경쟁사와 비교한 마케팅 점수를 확인하세요.',
}

export default async function DiagnosisCompetitorsPage(): Promise<React.JSX.Element> {
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
        <h1 className="text-2xl font-bold text-slate-900">경쟁사 비교 분석</h1>
        <p className="text-slate-500">
          경쟁사 3개사의 마케팅 점수를 비교 분석합니다.
        </p>

        {/* Skeleton: 3 competitor cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 h-5 w-32 animate-pulse rounded bg-slate-200" />
              <div className="mb-2 h-12 w-20 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
              <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>

        {/* Skeleton: comparison table */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 h-5 w-40 animate-pulse rounded bg-slate-200" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 border-b border-slate-100 py-3">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </BlurOverlay>
  )
}
