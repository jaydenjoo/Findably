import { Document, Page } from '@react-pdf/renderer'

import type { PaidAnalysisData } from '@/features/diagnosis-paid'

import { PdfCitationTracking } from './sections/PdfCitationTracking'
import { PdfCmoSummary } from './sections/PdfCmoSummary'
import { PdfCompetitors } from './sections/PdfCompetitors'
import { PdfHeader } from './sections/PdfHeader'
import { PdfInsights } from './sections/PdfInsights'
import { PdfRoadmap } from './sections/PdfRoadmap'
import { PdfSwot } from './sections/PdfSwot'
import { styles } from './styles'

interface ReportDocumentProps {
  data: PaidAnalysisData
  url: string
  createdAt: string
}

export function ReportDocument({
  data,
  url,
  createdAt,
}: ReportDocumentProps): React.JSX.Element {
  return (
    <Document
      title={`Findably 분석 리포트`}
      author="Findably"
      subject="AI 마케팅 종합 분석 리포트"
    >
      <Page size="A4" style={styles.page} wrap>
        <PdfHeader url={url} createdAt={createdAt} />
        <PdfCmoSummary summary={data.cmoSummary} />
        <PdfSwot swot={data.swot} />
        <PdfRoadmap roadmap={data.roadmap} />
        <PdfCitationTracking tracking={data.aiCitationTracking} />
        <PdfCompetitors competitors={data.competitors} />
        <PdfInsights insights={data.aiInsights} />
      </Page>
    </Document>
  )
}
