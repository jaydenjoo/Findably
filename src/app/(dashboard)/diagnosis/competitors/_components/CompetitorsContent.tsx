import type {
  ComparisonMatrix,
  GapAnalysisResult,
} from '@/features/competitors'
import { BlurOverlay } from '@/components/shared/BlurOverlay'
import { ComparisonMatrixTable } from './ComparisonMatrixTable'
import { GapAnalysisSection } from './GapAnalysisSection'

interface CompetitorsContentProps {
  matrix: ComparisonMatrix
  gapAnalysis: GapAnalysisResult
  isPaid: boolean
}

export function CompetitorsContent({
  matrix,
  gapAnalysis,
  isPaid,
}: CompetitorsContentProps): React.JSX.Element {
  const content = (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          경쟁사 비교 분석
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {matrix.competitors.length > 0
            ? `${matrix.competitors.length}개 경쟁사와의 카테고리별 비교 분석입니다.`
            : '경쟁사 데이터가 아직 없습니다. 상세 분석을 통해 경쟁사를 추가하세요.'}
        </p>
      </div>

      {/* Comparison Matrix Table */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          카테고리별 비교
        </h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <ComparisonMatrixTable matrix={matrix} />
        </div>
      </section>

      {/* Gap Analysis */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-800">격차 분석</h2>
        <GapAnalysisSection gapAnalysis={gapAnalysis} />
      </section>
    </div>
  )

  if (!isPaid) {
    return (
      <BlurOverlay
        visiblePercent={20}
        ctaLabel="상세 분석 받기 — 9.9만원"
        ctaHref="/pricing"
        sampleLabel="샘플 먼저 보기 →"
        sampleHref="/reports/sample"
      >
        {content}
      </BlurOverlay>
    )
  }

  return content
}
