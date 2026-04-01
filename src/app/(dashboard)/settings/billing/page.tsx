import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: '결제 내역',
}

export default async function SettingsBillingPage(): Promise<React.JSX.Element> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 결제 내역 조회
  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount, status, created_at, diagnosis_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  type PaymentRow = {
    id: string
    amount: number
    status: string
    created_at: string
    diagnosis_id: string | null
  }

  const typedPayments = (payments ?? []) as PaymentRow[]
  const hasPayments = typedPayments.length > 0

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">결제 내역</h1>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        {hasPayments ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    날짜
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    금액
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    상태
                  </th>
                </tr>
              </thead>
              <tbody>
                {typedPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-slate-100 last:border-b-0"
                  >
                    <td className="px-4 py-3 text-slate-700">
                      {new Date(payment.created_at).toLocaleDateString(
                        'ko-KR',
                        {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {payment.amount.toLocaleString('ko-KR')}원
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          payment.status === 'completed'
                            ? 'bg-success-50 text-success-600'
                            : payment.status === 'pending'
                              ? 'bg-warning-50 text-warning-600'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {payment.status === 'completed'
                          ? '완료'
                          : payment.status === 'pending'
                            ? '대기'
                            : payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-12">
            <p className="text-sm text-slate-500">아직 결제 내역이 없습니다.</p>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">환불 안내</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          결제일로부터 7일 이내, 리포트를 열람하지 않은 경우 전액 환불이
          가능합니다. 환불 요청은{' '}
          <a
            href="mailto:support@findably.co.kr"
            className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            support@findably.co.kr
          </a>
          로 문의해 주세요.
        </p>
      </section>
    </div>
  )
}
