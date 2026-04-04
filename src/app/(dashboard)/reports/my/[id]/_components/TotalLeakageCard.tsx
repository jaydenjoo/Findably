import { calculateRevenueImpact } from '@/config/revenue'
import type { AIInsight } from '@/features/diagnosis-paid'

interface TotalLeakageCardProps {
  insights: AIInsight[]
}

export function TotalLeakageCard({
  insights,
}: TotalLeakageCardProps): React.JSX.Element | null {
  const safeInsights = insights ?? []

  // critical/warning만 원화 환산
  let immediateTotal = 0
  let mediumTotal = 0

  for (const insight of safeInsights) {
    const revenue = calculateRevenueImpact({ severity: insight.severity })
    if (!revenue) continue

    const priority = insight.priority ?? 5
    if (priority <= 3) {
      immediateTotal += revenue.monthlyLoss
    } else {
      mediumTotal += revenue.monthlyLoss
    }
  }

  const totalMonthly = immediateTotal + mediumTotal
  if (totalMonthly === 0) return null

  const totalAnnual = totalMonthly * 12

  return (
    <div className="rounded-lg border border-primary-200 bg-primary-50/30 p-5">
      <p className="mb-1 text-sm font-semibold text-slate-700">
        💧 현재 매월 새고 있는 마케팅 비용 (추정)
      </p>

      <p className="mb-3 text-2xl font-bold font-display text-slate-900">
        약 {totalMonthly}만원
        <span className="ml-2 text-sm font-normal text-slate-500">
          / 연간 약 {totalAnnual}만원
        </span>
      </p>

      <div className="flex flex-col gap-1.5 text-sm">
        {immediateTotal > 0 && (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-danger-50 px-2 py-0.5 text-[11px] font-semibold text-danger-700">
              🔴 즉시 해결
            </span>
            <span className="text-slate-600">
              회복 가능: <strong>{immediateTotal}만원</strong>/월
            </span>
          </div>
        )}
        {mediumTotal > 0 && (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-warning-50 px-2 py-0.5 text-[11px] font-semibold text-warning-700">
              🟡 1~2개월 내
            </span>
            <span className="text-slate-600">
              +<strong>{mediumTotal}만원</strong>/월
            </span>
          </div>
        )}
      </div>

      <p className="mt-3 text-[10px] text-slate-400">
        * 업종 평균 벤치마크 기준 추정치이며, 실제 결과와 다를 수 있습니다.
      </p>
    </div>
  )
}
