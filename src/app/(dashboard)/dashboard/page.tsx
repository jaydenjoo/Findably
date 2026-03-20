import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardContent } from './_components/DashboardContent'
import { EmptyState } from '@/components/shared/EmptyState'
import { AlertCircle, BarChart3 } from 'lucide-react'
import {
  parseAnalysisData,
  parsePartialInfo,
} from '@/lib/utils/diagnosis-parser'
import type { UserTier } from '@/lib/access-control/get-user-tier'
import { DIAGNOSIS_PAID_CONFIG } from '@/config/diagnosis-paid'

export const metadata: Metadata = {
  title: '대시보드 | Findably',
  description: 'SEO + GEO 종합 마케팅 진단 결과를 확인하세요.',
}

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 가장 최근 진단 조회 (완료 우선, 없으면 진행 중)
  const { data: diagnosis, error } = await supabase
    .from('diagnoses')
    .select(
      'id, analysis_data, total_score, grade, status, crawl_data, tier, updated_at'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // DB 에러
  if (error) {
    console.error(
      '[dashboard] DB error:',
      error.message,
      error.code,
      error.hint
    )
    return (
      <EmptyState
        icon={AlertCircle}
        title="데이터를 불러올 수 없습니다"
        description="잠시 후 다시 시도해주세요."
        action={{ label: '새로고침 →', href: '/dashboard' }}
      />
    )
  }

  // 진단 없음
  if (!diagnosis) {
    return (
      <EmptyState
        icon={BarChart3}
        title="아직 진단 결과가 없어요"
        description="URL을 입력하고 무료 진단을 시작해보세요."
        action={{ label: '진단 시작 →', href: '/onboarding/url' }}
      />
    )
  }

  const isPaid = diagnosis.tier === 'paid'

  // 진행 중 (pending / crawling / analyzing)
  if (diagnosis.status !== 'completed' && diagnosis.status !== 'failed') {
    // 타임아웃 감지: updated_at이 5분 이상 지났으면 분석 실패로 간주
    const updatedAt = diagnosis.updated_at
      ? new Date(diagnosis.updated_at as string)
      : null
    const now = new Date()
    const isTimedOut =
      updatedAt !== null &&
      now.getTime() - updatedAt.getTime() >
        DIAGNOSIS_PAID_CONFIG.ANALYSIS_TIMEOUT_MS

    if (isTimedOut) {
      return (
        <EmptyState
          icon={AlertCircle}
          title="분석이 예상보다 오래 걸리고 있습니다"
          description="분석 중 일시적 문제가 발생한 것 같습니다. 새로고침을 시도해주세요. 문제가 계속되면 support@findably.co.kr로 문의해주세요."
          action={{ label: '새로고침 →', href: '/dashboard' }}
        />
      )
    }

    return (
      <EmptyState
        icon={BarChart3}
        title={
          isPaid ? '유료 상세 분석이 진행 중입니다' : '분석이 진행 중입니다'
        }
        description={
          isPaid
            ? '5개 AI 전문가가 심층 분석 중입니다 (약 1분 소요). 잠시 후 새로고침해주세요.'
            : '잠시 후 자동으로 결과가 표시됩니다. 페이지를 새로고침해보세요.'
        }
        action={{ label: '새로고침 →', href: '/dashboard' }}
      />
    )
  }

  // 실패 — 유료/무료 분기
  if (diagnosis.status === 'failed') {
    if (isPaid) {
      return (
        <EmptyState
          icon={AlertCircle}
          title="상세 분석에 일시적 문제가 발생했습니다"
          description="결제는 정상 처리되었습니다. 새로고침하면 분석이 재시도됩니다. 문제가 계속되면 support@findably.co.kr로 문의해주세요."
          action={{ label: '새로고침 →', href: '/dashboard' }}
        />
      )
    }
    return (
      <EmptyState
        icon={AlertCircle}
        title="진단에 실패했습니다"
        description="다시 진단을 시작해보세요. 문제가 계속되면 support@findably.co.kr로 문의해주세요."
        action={{ label: '다시 진단하기 →', href: '/onboarding/url' }}
      />
    )
  }

  // 완료 — analysis_data 파싱
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

  const partialInfo = parsePartialInfo(diagnosis.crawl_data)
  const tier: UserTier = diagnosis.tier === 'paid' ? 'paid' : 'free'

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
