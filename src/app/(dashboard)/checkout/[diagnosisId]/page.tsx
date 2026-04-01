import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PRICING } from '@/config/pricing'
import { CheckoutContent } from './_components/CheckoutContent'

export const metadata = {
  title: '결제하기',
  description: '상세 마케팅 진단 결제 페이지',
}

interface CheckoutPageProps {
  params: Promise<{ diagnosisId: string }>
}

/**
 * /checkout/[diagnosisId] — 결제 페이지
 *
 * Server Component: 인증 + 진단 소유권 확인 후 CheckoutContent 렌더
 */
export default async function CheckoutPage({
  params,
}: CheckoutPageProps): Promise<React.JSX.Element> {
  const { diagnosisId } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // 진단 조회 (RLS가 user_id 자동 필터)
  const { data: diagnosis, error: diagError } = await supabase
    .from('diagnoses')
    .select('id, url, status, tier')
    .eq('id', diagnosisId)
    .single()

  if (diagError || !diagnosis) {
    redirect('/dashboard')
  }

  // 이미 결제 완료 → 대시보드로
  if (diagnosis.tier === 'paid') {
    redirect('/dashboard')
  }

  return (
    <CheckoutContent
      diagnosisId={diagnosis.id}
      url={diagnosis.url}
      amount={PRICING.DIAGNOSIS_AMOUNT}
      amountLabel={PRICING.DIAGNOSIS_AMOUNT_LABEL}
    />
  )
}
