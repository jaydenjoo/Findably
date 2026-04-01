import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { CrawlData } from '@/features/crawling'
import { parseAnalysisData } from '@/lib/utils/diagnosis-parser'
import { BlurOverlay } from '@/components/shared/BlurOverlay'
import { EmptyState } from '@/components/shared/EmptyState'
import { Code2, AlertCircle } from 'lucide-react'
import { SchemaContent } from './_components/SchemaContent'

export const metadata: Metadata = {
  title: 'Schema Markup',
  description: 'Schema Markup 코드를 자동 생성합니다.',
}

export default async function ActionsSchemaPage(): Promise<React.JSX.Element> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: diagnosis, error } = await supabase
    .from('diagnoses')
    .select('id, url, tier, crawl_data, analysis_data')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[schema] DB error:', error.message)
    return (
      <EmptyState
        icon={AlertCircle}
        title="데이터를 불러올 수 없습니다"
        description="잠시 후 다시 시도해주세요."
        action={{ label: '새로고침 →', href: '/actions/schema' }}
      />
    )
  }

  if (!diagnosis) {
    return (
      <EmptyState
        icon={Code2}
        title="아직 진단 결과가 없어요"
        description="URL을 입력하고 무료 진단을 시작해보세요."
        action={{ label: '진단 시작 →', href: '/onboarding/url' }}
      />
    )
  }

  const isPaid = diagnosis.tier === 'paid'

  // Free 사용자 — BlurOverlay + 스켈레톤
  if (!isPaid) {
    return (
      <BlurOverlay
        visiblePercent={20}
        ctaLabel="상세 분석 받기 — 9.9만원"
        ctaHref="/pricing"
        sampleLabel="샘플 먼저 보기 →"
        sampleHref="/reports/sample"
      >
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Schema Markup</h1>
            <p className="mt-2 text-sm text-slate-500">
              사이트의 구조화 데이터를 분석하고, 추천 Schema 코드를 생성합니다.
            </p>
          </div>
          {/* 기존 Schema 스켈레톤 */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 h-5 w-40 animate-pulse rounded bg-slate-200" />
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-lg border border-slate-100 p-4">
                  <div className="mb-2 h-4 w-32 animate-pulse rounded bg-slate-100" />
                  <div className="h-24 w-full animate-pulse rounded bg-slate-50" />
                </div>
              ))}
            </div>
          </div>
          {/* 추천 Schema 스켈레톤 */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 h-5 w-48 animate-pulse rounded bg-slate-200" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg border border-slate-100 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
                    <div className="h-7 w-16 animate-pulse rounded bg-slate-100" />
                  </div>
                  <div className="h-32 w-full animate-pulse rounded bg-slate-50" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </BlurOverlay>
    )
  }

  const crawlData = diagnosis.crawl_data as CrawlData | null
  const analysisData = parseAnalysisData(diagnosis.analysis_data)
  const failedRules = analysisData?.overallScore.quickWins ?? []

  return (
    <SchemaContent
      crawlData={crawlData}
      url={diagnosis.url}
      isPaid={isPaid}
      failedItems={failedRules}
    />
  )
}
