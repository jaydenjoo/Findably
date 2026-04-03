'use client'

import { useState } from 'react'
import type { RuleResult } from '@/features/diagnosis-free/types'
import type { ParsedAIInsight } from '@/lib/utils/diagnosis-parser'
import { SCORING } from '@/config/scoring'
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  ChevronDown,
  ChevronRight,
  Wrench,
  TrendingUp,
  FileText,
} from 'lucide-react'

interface RuleListItemProps {
  rule: RuleResult
  /** 매칭된 AI 인사이트 (유료 사용자만) */
  insight?: ParsedAIInsight
}

export function RuleListItem({
  rule,
  insight,
}: RuleListItemProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false)
  const severity = SCORING.SEVERITY_STYLES[rule.severity]
  const hasDetail =
    !!insight?.suggestedFix || !!insight?.impact || !!insight?.evidence
  const isExpandable = !rule.passed && !rule.skipped && hasDetail

  return (
    <div
      className={`rounded-lg border bg-white transition-all ${
        expanded
          ? 'border-primary-200 shadow-md'
          : 'border-slate-200 hover:-translate-y-px hover:shadow-md'
      }`}
    >
      {/* 메인 행 */}
      <button
        type="button"
        className={`flex w-full items-start gap-3 p-4 text-left ${isExpandable ? 'cursor-pointer' : ''}`}
        onClick={() => isExpandable && setExpanded(!expanded)}
        aria-expanded={isExpandable ? expanded : undefined}
        disabled={!isExpandable}
      >
        {/* 아이콘 */}
        <div className="mt-0.5 shrink-0">
          {rule.skipped ? (
            <MinusCircle className="size-5 text-slate-300" aria-hidden="true" />
          ) : rule.passed ? (
            <CheckCircle2
              className="size-5 text-success-500"
              aria-hidden="true"
            />
          ) : (
            <XCircle className="size-5 text-danger-500" aria-hidden="true" />
          )}
        </div>

        {/* 콘텐츠 */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-900">
              {rule.name}
            </h4>
            {!rule.passed && !rule.skipped && (
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${severity.bg} ${severity.text}`}
              >
                {severity.label}
              </span>
            )}
            {isExpandable && (
              <span className="ml-auto shrink-0">
                {expanded ? (
                  <ChevronDown className="size-4 text-slate-400" />
                ) : (
                  <ChevronRight className="size-4 text-slate-400" />
                )}
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed text-slate-500">
            {insight?.description ?? rule.message}
          </p>
        </div>

        {/* 점수 */}
        <div className="shrink-0 text-right">
          <span className="text-sm font-semibold tabular-nums text-slate-700">
            {rule.points}
          </span>
          <span className="text-xs text-slate-400">/{rule.maxPoints}</span>
        </div>
      </button>

      {/* 펼침 영역: AI 인사이트 상세 */}
      {expanded && insight && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-4 space-y-4">
          {/* 이렇게 고치세요 */}
          {insight.suggestedFix && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary-600">
                <Wrench className="size-3.5" />
                이렇게 고치세요
              </div>
              <div className="text-sm leading-relaxed text-slate-700 whitespace-pre-line bg-white rounded-lg p-3 border border-slate-200">
                {insight.suggestedFix}
              </div>
            </div>
          )}

          {/* 영향도 */}
          {insight.impact && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-warning-600">
                <TrendingUp className="size-3.5" />
                영향도
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                {insight.impact}
              </p>
            </div>
          )}

          {/* 근거 */}
          {insight.evidence && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <FileText className="size-3.5" />
                분석 근거
              </div>
              <p className="text-sm leading-relaxed text-slate-500">
                {insight.evidence}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
