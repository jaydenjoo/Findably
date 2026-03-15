import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BlurOverlay } from '@/components/shared/BlurOverlay'

export const metadata: Metadata = {
  title: '90일 실행 계획 | Findably',
  description: '90일 SEO/GEO 실행 계획을 확인하세요.',
}

export default async function ActionsRoadmapPage(): Promise<React.JSX.Element> {
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
        <h1 className="text-2xl font-bold text-slate-900">90일 실행 계획</h1>
        <p className="text-slate-500">90일 SEO/GEO 실행 계획입니다.</p>

        {/* Skeleton: timeline with 3 phases */}
        <div className="space-y-6">
          {['1주차-30일', '31일-60일', '61일-90일'].map((phase) => (
            <div
              key={phase}
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                  <div className="h-5 w-5 animate-pulse rounded-full bg-slate-200" />
                </div>
                <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
              </div>

              {/* Task items */}
              <div className="space-y-3">
                {[1, 2, 3].map((task) => (
                  <div key={task} className="flex gap-3 pl-11">
                    <div className="h-4 w-4 animate-pulse rounded bg-slate-100" />
                    <div className="flex-1">
                      <div className="mb-1 h-4 w-full animate-pulse rounded bg-slate-100" />
                      <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </BlurOverlay>
  )
}
