'use client'

import { useState } from 'react'
import type { CategoryScore, RuleResult } from '@/features/diagnosis-free/types'
import type { ParsedAIInsight } from '@/lib/utils/diagnosis-parser'
import { SCORING } from '@/config/scoring'
import { ScoreGauge } from '@/components/shared/ScoreGauge'
import { RuleListItem } from '@/components/dashboard/RuleListItem'
import { BlurOverlay } from '@/components/shared/BlurOverlay'
import type { UserTier } from '@/lib/access-control/get-user-tier'
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  Info,
} from 'lucide-react'

/** SEO 상세 = technical + performance + security + mobile 카테고리 */
const SEO_CATEGORY_IDS = [
  'technical',
  'performance',
  'security',
  'mobile',
] as const

interface SeoRuleListProps {
  categories: CategoryScore[]
  tier: UserTier
  aiInsights?: ParsedAIInsight[]
}

/** 심각도별 그룹 */
interface SeverityGroup {
  severity: 'critical' | 'warning' | 'info'
  label: string
  icon: React.ReactNode
  color: string
  rules: RuleResult[]
}

function buildSeverityGroups(rules: RuleResult[]): SeverityGroup[] {
  const failed = rules.filter((r) => !r.passed && !r.skipped)
  const groups: SeverityGroup[] = []

  const critical = failed.filter((r) => r.severity === 'critical')
  if (critical.length > 0) {
    groups.push({
      severity: 'critical',
      label: `치명적 (${critical.length}건)`,
      icon: <AlertTriangle className="size-4 text-danger-500" />,
      color: 'border-danger-200 bg-danger-50',
      rules: critical,
    })
  }

  const warning = failed.filter((r) => r.severity === 'warning')
  if (warning.length > 0) {
    groups.push({
      severity: 'warning',
      label: `주의 (${warning.length}건)`,
      icon: <AlertCircle className="size-4 text-warning-500" />,
      color: 'border-warning-200 bg-warning-50',
      rules: warning,
    })
  }

  const info = failed.filter((r) => r.severity === 'info')
  if (info.length > 0) {
    groups.push({
      severity: 'info',
      label: `참고 (${info.length}건)`,
      icon: <Info className="size-4 text-primary-500" />,
      color: 'border-primary-200 bg-primary-50',
      rules: info,
    })
  }

  return groups
}

/** AI 인사이트를 룰에 매칭 (카테고리 + 제목 유사도) */
function matchInsight(
  rule: RuleResult,
  insights: ParsedAIInsight[]
): ParsedAIInsight | undefined {
  return insights.find(
    (ins) =>
      ins.category === rule.category &&
      (ins.title.includes(rule.name) ||
        rule.name.includes(ins.title) ||
        ins.title.toLowerCase().includes(rule.name.toLowerCase().slice(0, 10)))
  )
}

function SeveritySection({
  group,
  insights,
  defaultOpen,
}: {
  group: SeverityGroup
  insights: ParsedAIInsight[]
  defaultOpen: boolean
}): React.JSX.Element {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={`rounded-lg border ${group.color}`}>
      <button
        type="button"
        className="flex w-full items-center gap-2 px-4 py-3 text-left cursor-pointer"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {group.icon}
        <span className="text-sm font-semibold text-slate-900">
          {group.label}
        </span>
        <span className="ml-auto">
          {open ? (
            <ChevronDown className="size-4 text-slate-400" />
          ) : (
            <ChevronRight className="size-4 text-slate-400" />
          )}
        </span>
      </button>
      {open && (
        <div className="flex flex-col gap-2 px-3 pb-3">
          {group.rules.map((rule) => (
            <RuleListItem
              key={rule.id}
              rule={rule}
              insight={matchInsight(rule, insights)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CategorySection({
  category,
  rules,
  tier,
  insights,
}: {
  category: CategoryScore
  rules: RuleResult[]
  tier: UserTier
  insights: ParsedAIInsight[]
}): React.JSX.Element {
  const color = SCORING.getScoreColor(category.score)
  const isFree = tier === 'free'

  const severityGroups = buildSeverityGroups(rules)
  const passedRules = rules.filter((r) => r.passed)
  const skippedRules = rules.filter((r) => r.skipped)

  // 가장 시급한 항목 (critical 중 점수 가장 높은 것)
  const mostUrgent = rules
    .filter((r) => !r.passed && !r.skipped && r.severity === 'critical')
    .sort((a, b) => b.maxPoints - a.maxPoints)[0]

  const allRulesContent = (
    <>
      {/* 가장 시급한 항목 하이라이트 */}
      {mostUrgent && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3">
          <p className="text-xs font-semibold text-danger-600 mb-1">
            가장 시급한 항목
          </p>
          <p className="text-sm font-medium text-slate-900">
            {mostUrgent.name}
          </p>
        </div>
      )}

      {/* 심각도별 그룹 */}
      {severityGroups.map((group) => (
        <SeveritySection
          key={group.severity}
          group={group}
          insights={insights}
          defaultOpen={group.severity === 'critical'}
        />
      ))}

      {/* 통과 항목 (접혀있음) */}
      {passedRules.length > 0 && (
        <CollapsibleSection
          label={`통과 (${passedRules.length}건)`}
          defaultOpen={false}
        >
          {passedRules.map((rule) => (
            <RuleListItem key={rule.id} rule={rule} />
          ))}
        </CollapsibleSection>
      )}

      {/* 스킵 항목 */}
      {skippedRules.length > 0 && (
        <CollapsibleSection
          label={`데이터 없음 (${skippedRules.length}건)`}
          defaultOpen={false}
        >
          {skippedRules.map((rule) => (
            <RuleListItem key={rule.id} rule={rule} />
          ))}
        </CollapsibleSection>
      )}
    </>
  )

  return (
    <section
      className="flex flex-col gap-3"
      aria-label={`${category.name} 상세`}
    >
      {/* 카테고리 헤더 */}
      <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <ScoreGauge score={category.score} size="sm" showLabel={false} />
        <div className="flex flex-1 flex-col gap-1">
          <h3 className="text-base font-semibold text-slate-900">
            {category.name}
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${color.bg} ${color.text}`}
            >
              {SCORING.getScoreLabel(category.score)}
            </span>
            <span>
              통과 {category.passedCount}/{category.totalCount}
            </span>
          </div>
        </div>
      </div>

      {/* 룰 콘텐츠 */}
      {isFree ? (
        <>
          <div className="flex flex-col gap-2">
            {severityGroups.slice(0, 1).map((group) => (
              <SeveritySection
                key={group.severity}
                group={group}
                insights={insights}
                defaultOpen
              />
            ))}
          </div>
          {severityGroups.length > 1 && (
            <BlurOverlay visiblePercent={10}>
              <div className="flex flex-col gap-2">
                {severityGroups.slice(1).map((group) => (
                  <SeveritySection
                    key={group.severity}
                    group={group}
                    insights={insights}
                    defaultOpen={false}
                  />
                ))}
              </div>
            </BlurOverlay>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-3">{allRulesContent}</div>
      )}
    </section>
  )
}

function CollapsibleSection({
  label,
  defaultOpen,
  children,
}: {
  label: string
  defaultOpen: boolean
  children: React.ReactNode
}): React.JSX.Element {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-4 py-3 text-left cursor-pointer"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <span className="ml-auto">
          {open ? (
            <ChevronDown className="size-4 text-slate-400" />
          ) : (
            <ChevronRight className="size-4 text-slate-400" />
          )}
        </span>
      </button>
      {open && <div className="flex flex-col gap-2 px-3 pb-3">{children}</div>}
    </div>
  )
}

export function SeoRuleList({
  categories,
  tier,
  aiInsights = [],
}: SeoRuleListProps): React.JSX.Element {
  const seoCategories = categories.filter((c) =>
    (SEO_CATEGORY_IDS as readonly string[]).includes(c.id)
  )

  const totalWeight = seoCategories.reduce((sum, c) => sum + c.weight, 0)
  const weightedScore =
    totalWeight > 0
      ? Math.round(
          seoCategories.reduce((sum, c) => sum + c.score * c.weight, 0) /
            totalWeight
        )
      : 0

  // SEO 카테고리에 해당하는 인사이트 필터
  const seoInsights = aiInsights.filter((ins) =>
    (SEO_CATEGORY_IDS as readonly string[]).includes(ins.category)
  )

  return (
    <div className="flex flex-col gap-6">
      <section
        className="flex flex-col items-center gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        aria-label="SEO 종합 점수"
      >
        <h2 className="self-start text-lg font-semibold text-slate-900">
          SEO 종합 분석
        </h2>
        <ScoreGauge score={weightedScore} size="lg" />
        <p className="max-w-md text-center text-sm text-slate-500">
          기술 SEO, 성능, 보안, 모바일 4개 카테고리의 가중 평균 점수입니다.
        </p>
      </section>

      {seoCategories.map((category) => (
        <CategorySection
          key={category.id}
          category={category}
          rules={category.rules}
          tier={tier}
          insights={seoInsights}
        />
      ))}
    </div>
  )
}
