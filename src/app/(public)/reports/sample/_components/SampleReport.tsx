import { SAMPLE_OVERALL_SCORE, SAMPLE_AI_CITATION } from '@/features/sample'
import { SCORING } from '@/config/scoring'
import { ScoreGauge } from '@/components/shared/ScoreGauge'
import { CategoryScoreCard } from '@/app/(dashboard)/dashboard/_components/CategoryScoreCard'
import { AICitationCard } from '@/components/dashboard/AICitationCard'
import { QuickWinCard } from '@/components/dashboard/QuickWinCard'
import { RuleListItem } from '@/components/dashboard/RuleListItem'
import { CtaBanner } from './CtaBanner'
import { Badge } from 'lucide-react'

export function SampleReport(): React.JSX.Element {
  const overall = SAMPLE_OVERALL_SCORE
  const citation = SAMPLE_AI_CITATION
  const color = SCORING.getScoreColor(overall.score)
  // Sample diagnosis ID for sample report navigation
  const sampleDiagnosisId = 'sample-greentech'

  /** 카테고리별 실패 항목 상위 2개 추출 */
  const categoryFailHighlights = overall.categories
    .map((cat) => {
      const failures = cat.rules
        .filter((r) => !r.passed && !r.skipped)
        .sort((a, b) => b.maxPoints - a.maxPoints)
        .slice(0, 2)
      return { category: cat, failures }
    })
    .filter((g) => g.failures.length > 0)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-10 sm:py-16">
      {/* 헤더 */}
      <header className="flex flex-col items-center gap-3 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600">
          <Badge className="h-3 w-3" />
          샘플 리포트
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Green Tech Solutions 진단 리포트
        </h1>
        <p className="max-w-lg text-sm text-slate-500">
          가상 회사 &quot;그린테크&quot;의 전체 진단 결과입니다. 실제 유료
          리포트와 동일한 형태로 제공됩니다.
        </p>
      </header>

      {/* 종합 점수 */}
      <section
        className="flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        aria-label="종합 마케팅 점수"
      >
        <h2 className="self-start text-lg font-semibold text-slate-900">
          종합 마케팅 점수
        </h2>
        <ScoreGauge score={overall.score} size="lg" />
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${color.bg} ${color.text}`}
        >
          {SCORING.getScoreLabel(overall.score)}
        </span>
        <div className="flex gap-6 text-sm text-slate-500">
          <span>
            전체 룰{' '}
            <strong className="font-semibold text-slate-700">
              {overall.totalRules}
            </strong>
          </span>
          <span>
            통과{' '}
            <strong className="font-semibold text-slate-700">
              {overall.passedRules}
            </strong>
          </span>
          <span>
            실패{' '}
            <strong className="font-semibold text-slate-700">
              {overall.failedRules}
            </strong>
          </span>
        </div>
      </section>

      {/* 카테고리 점수 그리드 */}
      <section className="flex flex-col gap-4" aria-label="카테고리별 점수">
        <h2 className="text-lg font-semibold text-slate-900">
          카테고리별 분석
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {overall.categories.map((cat) => (
            <CategoryScoreCard
              key={cat.id}
              category={cat}
              diagnosisId={sampleDiagnosisId}
            />
          ))}
        </div>
      </section>

      {/* AI 인용 가능성 */}
      <section className="flex flex-col gap-4" aria-label="AI 인용 가능성">
        <h2 className="text-lg font-semibold text-slate-900">AI 인용 가능성</h2>
        <AICitationCard citation={citation} />
      </section>

      {/* CTA 중간 */}
      <CtaBanner variant="mid" />

      {/* Quick Win */}
      <section className="flex flex-col gap-4" aria-label="Quick Win 처방전">
        <h2 className="text-lg font-semibold text-slate-900">
          Quick Win 처방전
        </h2>
        <p className="text-sm text-slate-500">
          가장 적은 노력으로 가장 큰 효과를 볼 수 있는 개선 항목입니다.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {overall.quickWins.map((qw) => (
            <QuickWinCard
              key={qw.ruleId}
              quickWin={qw}
              diagnosisId={sampleDiagnosisId}
            />
          ))}
        </div>
      </section>

      {/* 카테고리별 주요 실패 항목 */}
      <section
        className="flex flex-col gap-6"
        aria-label="카테고리별 주요 개선 항목"
      >
        <h2 className="text-lg font-semibold text-slate-900">주요 개선 항목</h2>
        <p className="text-sm text-slate-500">
          카테고리별로 영향이 큰 실패 항목을 요약했습니다.
        </p>
        {categoryFailHighlights.map(({ category, failures }) => (
          <div key={category.id} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-slate-700">
              {category.name}
            </h3>
            <div className="flex flex-col gap-2">
              {failures.map((rule) => (
                <RuleListItem key={rule.id} rule={rule} />
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* CTA 하단 */}
      <CtaBanner variant="bottom" />
    </div>
  )
}
