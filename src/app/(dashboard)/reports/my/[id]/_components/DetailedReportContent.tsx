import type { PaidAnalysisData } from '@/features/diagnosis-paid'

import { AIInsightsSection } from './AIInsightsSection'
import { CitationTrackingSection } from './CitationTrackingSection'
import { CmoSummarySection } from './CmoSummarySection'
import { CompetitorSection } from './CompetitorSection'
import { ReportHeader } from './ReportHeader'
import { RoadmapSection } from './RoadmapSection'
import { SwotSection } from './SwotSection'

interface DetailedReportContentProps {
  url: string
  createdAt: string
  analysisData: PaidAnalysisData
  isPaid: boolean
}

export function DetailedReportContent({
  url,
  createdAt,
  analysisData,
  isPaid,
}: DetailedReportContentProps): React.JSX.Element {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <ReportHeader url={url} createdAt={createdAt} />

      <CmoSummarySection summary={analysisData.cmoSummary} isPaid={isPaid} />

      <SwotSection swot={analysisData.swot} isPaid={isPaid} />

      <RoadmapSection roadmap={analysisData.roadmap} isPaid={isPaid} />

      <CitationTrackingSection
        tracking={analysisData.aiCitationTracking}
        isPaid={isPaid}
      />

      <CompetitorSection
        competitors={analysisData.competitors}
        isPaid={isPaid}
      />

      <AIInsightsSection insights={analysisData.aiInsights} isPaid={isPaid} />
    </div>
  )
}
