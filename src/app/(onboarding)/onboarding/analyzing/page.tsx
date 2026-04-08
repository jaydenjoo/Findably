import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AnalyzingScreen } from './_components/AnalyzingScreen'

export const metadata: Metadata = {
  title: '분석 중',
  description: 'AI가 사이트를 분석하고 있습니다. 잠시만 기다려주세요.',
}

/**
 * 분석 대기 페이지 (/onboarding/analyzing)
 *
 * F-001 흐름: URL 입력 → 선택 정보 → [분석 대기] → 대시보드
 *
 * searchParams.id 있으면 해당 진단 조회
 * 없으면 fallback: 가장 최근 pending/crawling/analyzing 진단 자동 조회
 * (페이지 이탈 후 재방문, 직접 URL 접근 등 비정상 경로 대응)
 */
export default async function OnboardingAnalyzingPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; wwwFallback?: string }>
}): Promise<React.JSX.Element> {
  const { id, wwwFallback } = await searchParams
  const usedWwwFallback = wwwFallback === '1'

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // id가 있으면 해당 진단 조회, 없으면 최근 진행 중 진단 fallback
  let diagnosis: { id: string; status: string; url: string } | null = null

  if (id) {
    const { data } = await supabase
      .from('diagnoses')
      .select('id, status, url')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    diagnosis = data
  } else {
    const { data } = await supabase
      .from('diagnoses')
      .select('id, status, url')
      .eq('user_id', user.id)
      .in('status', ['pending', 'crawling', 'analyzing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    diagnosis = data
  }

  // 이미 완료된 진단이면 대시보드로 이동
  if (diagnosis?.status === 'completed') {
    redirect('/dashboard')
  }

  // 진단을 찾을 수 없는 경우 (잘못된 id, 진행 중인 분석 없음)
  if (!diagnosis) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-xl tracking-[-0.02em]">
            진행 중인 분석이 없습니다
          </CardTitle>
          <CardDescription>
            URL을 입력하여 새로운 분석을 시작해주세요.
          </CardDescription>
        </CardHeader>
        <div className="px-6 pb-6 text-center">
          <Link
            href="/onboarding/url"
            className="text-sm font-medium text-primary-500 hover:text-primary-600"
          >
            URL 입력으로 이동 →
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {usedWwwFallback && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-800"
        >
          <p className="font-medium">
            입력하신 도메인 대신 <span className="font-mono">www</span> 버전으로
            분석 중입니다
          </p>
          <p className="mt-1 text-xs text-primary-700/80">
            <span className="break-all font-mono">{diagnosis.url}</span>으로
            자동 연결했어요. 원본 도메인에 DNS 레코드가 없어 이 버전을
            사용합니다.
          </p>
        </div>
      )}
      <AnalyzingScreen diagnosisId={diagnosis.id} url={diagnosis.url} />
    </div>
  )
}
