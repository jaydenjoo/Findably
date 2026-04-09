import { Document, Page, Text, View } from '@react-pdf/renderer'

import type { PaidAnalysisData } from '@/features/diagnosis-paid'

import { PdfBridgeSection } from './sections/PdfBridgeSection'
import { PdfCoverPage } from './sections/PdfCoverPage'
import { PdfCitationTracking } from './sections/PdfCitationTracking'
import { PdfCompetitors } from './sections/PdfCompetitors'
import { PdfInsights } from './sections/PdfInsights'
import { PdfRoadmap } from './sections/PdfRoadmap'
import { PdfSwot } from './sections/PdfSwot'
import { PdfChecklist } from './sections/PdfChecklist'
import { colors, styles } from './styles'

interface ReportDocumentProps {
  data: PaidAnalysisData
  url: string
  createdAt: string
  totalScore?: number
  gradeLabel?: string
  /** 업종 ID (diagnoses.industry) — Phase D 동적 baseMonthlyRevenue용 */
  industry?: string | null
}

export function ReportDocument({
  data,
  url,
  createdAt,
  totalScore = 0,
  gradeLabel = '—',
  industry,
}: ReportDocumentProps): React.JSX.Element {
  return (
    <Document
      title="Findably AI 마케팅 분석 리포트"
      author="Findably"
      subject="AI 마케팅 종합 분석 리포트"
    >
      {/* 1페이지: 커버 (종합 점수 + 경영진 요약) */}
      <Page size="A4" style={styles.page}>
        <PdfCoverPage
          url={url}
          createdAt={createdAt}
          totalScore={totalScore}
          gradeLabel={gradeLabel}
          cmoSummary={data.cmoSummary}
        />
      </Page>

      {/* 2페이지: 브릿지 + SWOT + 로드맵 */}
      <Page size="A4" style={styles.page} wrap>
        <PageHeader />
        <PdfBridgeSection
          categoryScores={data.categoryScores ?? []}
          aiInsights={data.aiInsights ?? []}
          industry={industry}
        />
        <PdfSwot swot={data.swot} />
        <PdfRoadmap roadmap={data.roadmap} />
      </Page>

      {/* AI 인용 + 경쟁사 */}
      <Page size="A4" style={styles.page} wrap>
        <PageHeader />
        <PdfCitationTracking tracking={data.aiCitationTracking} />
        <PdfCompetitors competitors={data.competitors} />
      </Page>

      {/* AI 인사이트 상세 */}
      <Page size="A4" style={styles.page} wrap>
        <PageHeader />
        <PdfInsights insights={data.aiInsights} />
      </Page>

      {/* 마지막: 실행 체크리스트 */}
      <Page size="A4" style={styles.page} wrap>
        <PageHeader />
        <PdfChecklist insights={data.aiInsights} />
      </Page>
    </Document>
  )
}

/** 각 페이지 상단 미니 헤더 */
function PageHeader(): React.JSX.Element {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.slate200,
      }}
    >
      <Text style={{ fontSize: 9, fontWeight: 600, color: colors.primary500 }}>
        Findably
      </Text>
      <Text style={{ fontSize: 8, color: colors.slate500 }}>
        AI 마케팅 분석 리포트
      </Text>
    </View>
  )
}
