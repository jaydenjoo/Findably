import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardContent } from './_components/DashboardContent'
import { PaidAnalyzingState } from './_components/PaidAnalyzingState'
import { PaidRecoveryState } from './_components/PaidRecoveryState'
import { AnalysisTimeoutState } from './_components/AnalysisTimeoutState'
import { EmptyState } from '@/components/shared/EmptyState'
import { AlertCircle, BarChart3 } from 'lucide-react'
import {
  parseAnalysisData,
  parsePartialInfo,
} from '@/lib/utils/diagnosis-parser'
import type { UserTier } from '@/lib/access-control/get-user-tier'
import { DIAGNOSIS_PAID_CONFIG } from '@/config/diagnosis-paid'

export const metadata: Metadata = {
  title: '대시보드',
  description: 'SEO + GEO 종합 마케팅 진단 결과를 확인하세요.',
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}): Promise<React.JSX.Element> {
  const supabase = await createClient()
  const { id: diagnosisId } = await searchParams

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // ?id= 쿼리가 있으면 해당 진단 직접 조회
  if (diagnosisId) {
    const { data: diagnosis, error } = await supabase
      .from('diagnoses')
      .select(
        'id, analysis_data, total_score, grade, status, crawl_data, tier, updated_at'
      )
      .eq('id', diagnosisId)
      .eq('user_id', user.id)
      .single()

    if (error || !diagnosis) {
      return (
        <EmptyState
          icon={AlertCircle}
          title="진단을 찾을 수 없습니다"
          description="잘못된 링크이거나 삭제된 진단입니다."
          action={{ label: '대시보드로 →', href: '/dashboard' }}
        />
      )
    }

    return renderDiagnosis(supabase, user.id, diagnosis)
  }

  // 1순위: 진행 중인 진단 (pending/crawling/analyzing) — 있으면 진행 화면 표시
  const { data: activeDiagnosis } = await supabase
    .from('diagnoses')
    .select(
      'id, analysis_data, total_score, grade, status, crawl_data, tier, updated_at'
    )
    .eq('user_id', user.id)
    .in('status', ['pending', 'crawling', 'analyzing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (activeDiagnosis) {
    const isPaid = activeDiagnosis.tier === 'paid'
    const updatedAt = activeDiagnosis.updated_at
      ? new Date(activeDiagnosis.updated_at as string)
      : null
    const now = new Date()
    const isTimedOut =
      updatedAt !== null &&
      now.getTime() - updatedAt.getTime() >
        DIAGNOSIS_PAID_CONFIG.ANALYSIS_TIMEOUT_MS

    if (isTimedOut) {
      return (
        <AnalysisTimeoutState
          diagnosisId={activeDiagnosis.id}
          isPaid={isPaid}
        />
      )
    }

    return (
      <PaidAnalyzingState diagnosisId={activeDiagnosis.id} isPaid={isPaid} />
    )
  }

  // 2순위: 최신 completed 진단 — 메인 결과 표시
  const { data: completedDiagnosis, error } = await supabase
    .from('diagnoses')
    .select(
      'id, analysis_data, total_score, grade, status, crawl_data, tier, updated_at'
    )
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[dashboard] DB error:', error.message, error.code)
    return (
      <EmptyState
        icon={AlertCircle}
        title="데이터를 불러올 수 없습니다"
        description="잠시 후 다시 시도해주세요."
        action={{ label: '새로고침 →', href: '/dashboard' }}
      />
    )
  }

  if (completedDiagnosis) {
    return renderDiagnosis(supabase, user.id, completedDiagnosis)
  }

  // 3순위: failed만 있는 경우 — 새 진단 유도
  const { data: failedDiagnosis } = await supabase
    .from('diagnoses')
    .select('id, tier')
    .eq('user_id', user.id)
    .eq('status', 'failed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (failedDiagnosis) {
    const isPaidFailed = failedDiagnosis.tier === 'paid'
    return (
      <EmptyState
        icon={AlertCircle}
        title={
          isPaidFailed
            ? '상세 분석에 문제가 발생했습니다'
            : '이전 진단에 실패했습니다'
        }
        description={
          isPaidFailed
            ? '결제는 정상 처리되었습니다. 새 진단을 시작하거나, support@findably.co.kr로 문의해주세요.'
            : '새 URL로 다시 진단을 시작해보세요.'
        }
        action={{ label: '새 진단 시작 →', href: '/onboarding/url' }}
      />
    )
  }

  // 진단 없음
  return (
    <EmptyState
      icon={BarChart3}
      title="아직 진단 결과가 없어요"
      description="URL을 입력하고 무료 진단을 시작해보세요."
      action={{ label: '진단 시작 →', href: '/onboarding/url' }}
    />
  )
}

/** 진단 데이터 렌더링 (completed 상태) */
async function renderDiagnosis(
  _supabase: Awaited<ReturnType<typeof createClient>>,
  _userId: string,
  diagnosis: {
    id: string
    analysis_data: unknown
    status: string
    crawl_data: unknown
    tier: string | null
    updated_at: unknown
  }
): Promise<React.JSX.Element> {
  // 진행 중이면 분석 화면
  if (diagnosis.status !== 'completed' && diagnosis.status !== 'failed') {
    const isPaid = diagnosis.tier === 'paid'
    return <PaidAnalyzingState diagnosisId={diagnosis.id} isPaid={isPaid} />
  }

  // 실패면 에러
  if (diagnosis.status === 'failed') {
    return (
      <EmptyState
        icon={AlertCircle}
        title="이 진단은 실패했습니다"
        description="새 URL로 다시 진단을 시작해보세요."
        action={{ label: '새 진단 시작 →', href: '/onboarding/url' }}
      />
    )
  }

  const analysisData = parseAnalysisData(diagnosis.analysis_data)

  if (!analysisData) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="진단 데이터를 읽을 수 없습니다"
        description="다시 진단을 시작해보세요."
        action={{ label: '다시 진단하기 →', href: '/onboarding/url' }}
      />
    )
  }

  // 유료 데이터 누락 감지: tier='paid' + status='completed'인데 AI 분석 결과 없음
  // 레이스 컨디션(결제 ↔ 크롤링 콜백 겹침)으로 유료 분석이 실행되지 않은 경우
  const isPaid = diagnosis.tier === 'paid'
  const rawData = diagnosis.analysis_data as Record<string, unknown> | null
  const hasPaidInsights =
    rawData !== null && 'aiInsights' in rawData && rawData.aiInsights !== null

  if (isPaid && !hasPaidInsights) {
    return <PaidRecoveryState diagnosisId={diagnosis.id} />
  }

  const partialInfo = parsePartialInfo(diagnosis.crawl_data)
  const tier: UserTier = isPaid ? 'paid' : 'free'

  return (
    <DashboardContent
      overallScore={analysisData.overallScore}
      citation={analysisData.aiCitation}
      isPartial={partialInfo.isPartial}
      blockedReason={partialInfo.blockedReason}
      diagnosisId={diagnosis.id}
      tier={tier}
    />
  )
}
