import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BlurOverlay } from '@/components/shared/BlurOverlay'

export const metadata: Metadata = {
  title: '내 리포트 | Findably',
  description: '진단 리포트 목록을 확인하세요.',
}

export default async function ReportsMyPage(): Promise<React.JSX.Element> {
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
        <h1 className="text-2xl font-bold text-slate-900">내 리포트</h1>
        <p className="text-slate-500">생성된 리포트 목록입니다.</p>

        {/* Skeleton: report list items */}
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-1 flex-col gap-2">
                  <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
                </div>
                <div className="h-8 w-16 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </BlurOverlay>
  )
}
