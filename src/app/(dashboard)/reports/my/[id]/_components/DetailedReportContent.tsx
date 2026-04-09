import type { PaidAnalysisData } from '@/features/diagnosis-paid'

import { AIInsightsSection } from './AIInsightsSection'
import { BridgeSection } from './BridgeSection'
import { CitationTrackingSection } from './CitationTrackingSection'
import { CmoSummarySection } from './CmoSummarySection'
import { CompetitorSection } from './CompetitorSection'
import { ReportHeader } from './ReportHeader'
import { RoadmapSection } from './RoadmapSection'
import { SwotSection } from './SwotSection'

interface DetailedReportContentProps {
  diagnosisId: string
  url: string
  createdAt: string
  analysisData: PaidAnalysisData
  isPaid: boolean
  /** 업종 ID — Phase D 동적 baseMonthlyRevenue 전달용 */
  industry?: string | null
}

export function DetailedReportContent({
  diagnosisId,
  url,
  createdAt,
  analysisData,
  isPaid,
  industry,
}: DetailedReportContentProps): React.JSX.Element {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <ReportHeader
        url={url}
        createdAt={createdAt}
        diagnosisId={diagnosisId}
        isPaid={isPaid}
      />

      <BridgeSection
        categoryScores={analysisData.categoryScores ?? []}
        aiInsights={analysisData.aiInsights}
        isPaid={isPaid}
        industry={industry}
      />

      {analysisData.cmoSummary && (
        <CmoSummarySection summary={analysisData.cmoSummary} isPaid={isPaid} />
      )}

      {analysisData.swot && (
        <SwotSection swot={analysisData.swot} isPaid={isPaid} />
      )}

      {analysisData.roadmap && analysisData.roadmap.length > 0 && (
        <RoadmapSection roadmap={analysisData.roadmap} isPaid={isPaid} />
      )}

      {analysisData.aiCitationTracking && (
        <CitationTrackingSection
          tracking={analysisData.aiCitationTracking}
          isPaid={isPaid}
        />
      )}

      {analysisData.competitors && analysisData.competitors.length > 0 && (
        <CompetitorSection
          competitors={analysisData.competitors}
          isPaid={isPaid}
        />
      )}

      {analysisData.aiInsights && analysisData.aiInsights.length > 0 && (
        <AIInsightsSection insights={analysisData.aiInsights} isPaid={isPaid} />
      )}
    </div>
  )
}
