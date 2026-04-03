'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { CategoryScore } from '@/features/diagnosis-free/types'
import { SCORING } from '@/config/scoring'
import { getDiagnosisDetailUrl } from '@/lib/utils/category-routing'
import { ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react'

interface CategoryScoreCardProps {
  category: CategoryScore
  diagnosisId: string
}

export function CategoryScoreCard({
  category,
  diagnosisId,
}: CategoryScoreCardProps): React.JSX.Element {
  const color = SCORING.getScoreColor(category.score)
  const percentage = Math.max(0, Math.min(100, category.score))
  const detailUrl = getDiagnosisDetailUrl(category.id, diagnosisId)
  const [expanded, setExpanded] = useState(false)

  const passedRules =
    category.rules?.filter((r) => !r.skipped && r.passed) ?? []
  const failedRules =
    category.rules?.filter((r) => !r.skipped && !r.passed) ?? []

  return (
    <div className="flex flex-col rounded-lg border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
      {/* 상단: 클릭 가능 영역 */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex flex-col gap-3 p-4 text-left cursor-pointer w-full"
        aria-expanded={expanded}
      >
        {/* 카테고리명 + 점수 */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            {category.name}
          </h3>
          <div className="flex items-center gap-2">
            <span
              className={`text-lg font-bold font-display tabular-nums ${color.text}`}
            >
              {category.score}
              <span className="text-xs font-normal text-slate-500">/100</span>
            </span>
            {expanded ? (
              <ChevronUp className="size-4 text-slate-400" />
            ) : (
              <ChevronDown className="size-4 text-slate-400" />
            )}
          </div>
        </div>

        {/* 프로그레스 바 */}
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
          role="meter"
          aria-valuenow={category.score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${category.name} 점수 ${category.score}점`}
        >
          <div
            className={`h-full rounded-full transition-all ${color.bar}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* 통과 비율 */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>
            통과 {category.passedCount}/{category.totalCount}
          </span>
          {category.skippedCount > 0 && (
            <span>({category.skippedCount}개 스킵)</span>
          )}
        </div>
      </button>

      {/* 확장 영역: 룰 목록 */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-2">
          {failedRules.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-danger-600">
                실패 항목 ({failedRules.length})
              </p>
              {failedRules.slice(0, 5).map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-start gap-2 text-xs text-slate-600"
                >
                  <XCircle className="size-3.5 shrink-0 text-danger-400 mt-0.5" />
                  <span>{rule.name}</span>
                </div>
              ))}
              {failedRules.length > 5 && (
                <p className="text-xs text-slate-400">
                  +{failedRules.length - 5}건 더
                </p>
              )}
            </div>
          )}
          {passedRules.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-success-600">
                통과 항목 ({passedRules.length})
              </p>
              {passedRules.slice(0, 3).map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-start gap-2 text-xs text-slate-500"
                >
                  <CheckCircle2 className="size-3.5 shrink-0 text-success-400 mt-0.5" />
                  <span>{rule.name}</span>
                </div>
              ))}
              {passedRules.length > 3 && (
                <p className="text-xs text-slate-400">
                  +{passedRules.length - 3}건 더
                </p>
              )}
            </div>
          )}
          <Link
            href={detailUrl}
            className="inline-block mt-2 text-xs font-medium text-primary-500 hover:text-primary-600 transition-colors"
          >
            전체 상세 보기 →
          </Link>
        </div>
      )}
    </div>
  )
}
