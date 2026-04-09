import type { AIInsight } from '@/features/diagnosis-paid'
import {
  getBaseMonthlyRevenueForIndustry,
  getIndustryLabel,
} from '@/config/revenue'
import { distributeRevenueLeakage } from '@/lib/utils/insight-aggregation'

interface TotalLeakageCardProps {
  insights: AIInsight[]
  /** 업종 ID (diagnoses.industry) — null/undefined/미등록 값은 fallback */
  industry?: string | null
}

/**
 * 💡 마케팅 기회비용 카드 — Phase A (2026-04-06) + Phase D (2026-04-09)
 *
 * Phase A: 8개 영향 카테고리 가중 분배 + 매출 20% 캡
 * Phase D:
 *  - 업종별 baseMonthlyRevenue 동적 주입
 *  - 언어 톤다운: "손실" → "기회비용" / "새는 곳" → "개선 여지"
 *  - 퍼센트 지표 병행: 카테고리별 "매출 대비 X%" 표기
 *
 * 지시문: docs/paid-report-audit-v1.md Task 1 + Task 3
 */
export function TotalLeakageCard({
  insights,
  industry,
}: TotalLeakageCardProps): React.JSX.Element | null {
  const safeInsights = insights ?? []
  const baseMonthlyRevenue = getBaseMonthlyRevenueForIndustry(industry)
  const industryLabel = getIndustryLabel(industry)

  const dist = distributeRevenueLeakage(safeInsights, { baseMonthlyRevenue })

  if (dist.byCategory.length === 0) return null

  const baseManwon = Math.round(dist.baseMonthlyRevenue / 10_000)
  const leakagePercent = Math.round(dist.leakageRatio * 100)

  return (
    <div className="rounded-lg border border-primary-200 bg-primary-50/30 p-5">
      {/* 헤더 */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold text-slate-700">
          💡 현재 추정되는 월 마케팅 기회비용
        </p>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
          {industryLabel ? `업종: ${industryLabel}` : '업종 평균 기준'}
        </span>
      </div>

      {/* 메인 지표 — 매출 대비 % + 월 금액 */}
      <p className="mb-1 text-2xl font-bold font-display text-slate-900">
        매출 대비 약 {leakagePercent}% 규모 · 월 약{' '}
        {dist.totalMonthlyManwon.toLocaleString('ko-KR')}만원
      </p>

      {/* 기준 매출 병기 (지시문 Task 1-5) */}
      <p className="mb-4 text-xs text-slate-500">
        월매출 {baseManwon.toLocaleString('ko-KR')}만원 기준 추정 · 연간 약{' '}
        {dist.totalAnnualManwon.toLocaleString('ko-KR')}만원
      </p>

      {/* 카테고리별 내역 + 퍼센트 지표 병행 (Phase D Option C) */}
      <ul
        className="mb-4 flex flex-col gap-2"
        aria-label="영향 카테고리별 기회비용 내역"
      >
        {dist.byCategory.map((cat) => {
          const categoryRatio =
            dist.baseMonthlyRevenue > 0
              ? (
                  ((cat.monthlyLossManwon * 10_000) / dist.baseMonthlyRevenue) *
                  100
                ).toFixed(1)
              : '0'
          return (
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
                규모
              </span>
              <span className="text-[11px] text-slate-500">
                (매출 대비 {categoryRatio}%)
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
          )
        })}
      </ul>

      {/* 중복 영향 보정 안내 (지시문 Task 1-4) */}
      <p className="mb-2 rounded-md bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-600">
        ℹ️ {dist.note}
      </p>

      {/* 출처 (검증 체크리스트 7번) */}
      <p className="text-[10px] text-slate-400">
        {industryLabel
          ? `* 업종별 평균 매출 벤치마크 출처: 중기부·통계청 소상공인실태조사 2023 잠정결과`
          : `* 소상공인 월 평균 매출 벤치마크 출처: 중기부·통계청 소상공인실태조사 2023 (전산업 평균)`}
      </p>
    </div>
  )
}
