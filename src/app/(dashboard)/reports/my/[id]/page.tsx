import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { isPaidAnalysisData } from '@/features/diagnosis-paid'
import { createClient } from '@/lib/supabase/server'

import { DetailedReportContent } from './_components/DetailedReportContent'

export const metadata: Metadata = {
  title: '상세 리포트',
  description: '상세 진단 리포트를 확인하세요.',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ReportDetailPage({
  params,
}: PageProps): Promise<React.JSX.Element> {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: diagnosis, error } = await supabase
    .from('diagnoses')
    .select('id, url, status, tier, analysis_data, created_at, industry')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !diagnosis) notFound()

  if (diagnosis.status !== 'completed') {
    return (
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 py-20 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary-50">
          <svg
            className="size-8 animate-spin text-primary-500"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-slate-900">
          분석이 진행 중입니다
        </h1>
        <p className="text-sm text-slate-500">
          AI가 사이트를 분석하고 있습니다. 잠시만 기다려 주세요.
        </p>
      </div>
    )
  }

  const isPaid = diagnosis.tier === 'paid'

  if (!isPaidAnalysisData(diagnosis.analysis_data)) notFound()
  const analysisData = diagnosis.analysis_data

  return (
    <DetailedReportContent
      diagnosisId={diagnosis.id}
      url={diagnosis.url}
      createdAt={diagnosis.created_at}
      analysisData={analysisData}
      isPaid={isPaid}
      industry={diagnosis.industry}
    />
  )
}
