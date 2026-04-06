import type { AIInsight } from '@/features/diagnosis-paid'
import { distributeRevenueLeakage } from '@/lib/utils/insight-aggregation'

interface TotalLeakageCardProps {
  insights: AIInsight[]
}

/**
 * 💧 매출 누수 카드 — Phase A (2026-04-06) 재설계
 *
 * 기존 severity 기반 단순 합산(5,638만원 과장) → 8개 영향 카테고리 가중 분배
 * 로 교체. 총 누수는 반드시 매출의 20%(=328만원) 이내로 유지된다.
 *
 * 지시문: docs/paid-report-audit-v1.md Task 1 + Task 3
 */
export function TotalLeakageCard({
  insights,
}: TotalLeakageCardProps): React.JSX.Element | null {
  const safeInsights = insights ?? []
  const dist = distributeRevenueLeakage(safeInsights)

  if (dist.byCategory.length === 0) return null

  const baseManwon = Math.round(dist.baseMonthlyRevenue / 10_000)
  const leakagePercent = Math.round(dist.leakageRatio * 100)

  return (
    <div className="rounded-lg border border-primary-200 bg-primary-50/30 p-5">
      {/* 헤더 */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold text-slate-700">
          💧 현재 매월 새고 있는 마케팅 비용 (추정)
        </p>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
          개선된 추정 로직 적용
        </span>
      </div>

      {/* 메인 금액 — 매출 대비 % + 월 금액 */}
      <p className="mb-1 text-2xl font-bold font-display text-slate-900">
        매출의 약 {leakagePercent}% 수준 · 월 약{' '}
        {dist.totalMonthlyManwon.toLocaleString('ko-KR')}만원
      </p>

      {/* 기준 매출 병기 (지시문 Task 1-5) */}
      <p className="mb-4 text-xs text-slate-500">
        월매출 {baseManwon.toLocaleString('ko-KR')}만원 기준 추정 · 연간 약{' '}
        {dist.totalAnnualManwon.toLocaleString('ko-KR')}만원
      </p>

      {/* 카테고리별 내역 */}
      <ul
        className="mb-4 flex flex-col gap-2"
        aria-label="영향 카테고리별 누수 내역"
      >
        {dist.byCategory.map((cat) => (
          <li
            key={cat.categoryId}
            className="flex flex-wrap items-center gap-2 text-sm"
          >
            <span className="min-w-[88px] rounded-full bg-primary-100 px-2 py-0.5 text-[11px] font-semibold text-primary-700">
              {cat.label}
            </span>
            <span className="text-slate-700">
              월 약{' '}
              <strong className="font-semibold text-slate-900">
                {cat.monthlyLossManwon.toLocaleString('ko-KR')}만원
              </strong>{' '}
              영향
            </span>
            {cat.affectedCategories.length > 0 && (
              <span className="ml-auto flex flex-wrap gap-1">
                {cat.affectedCategories.map((c) => (
                  <span
                    key={c}
                    className="text-[10px] text-slate-400"
                    aria-label={`영향 범위 ${c}`}
                  >
                    #{c}
                  </span>
                ))}
              </span>
            )}
          </li>
        ))}
      </ul>

      {/* 중복 영향 보정 안내 (지시문 Task 1-4) */}
      <p className="mb-2 rounded-md bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-600">
        ℹ️ {dist.note}
      </p>

      {/* 출처 (검증 체크리스트 7번) */}
      <p className="text-[10px] text-slate-400">
        * 소상공인 월 평균 매출 벤치마크 출처: KCD 2025 Q4 통계 (직원 10인 이하
        사업장 기준)
      </p>
    </div>
  )
}
