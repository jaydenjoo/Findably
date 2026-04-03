import { Text, View } from '@react-pdf/renderer'

import { colors, styles } from '../styles'

interface PdfCoverPageProps {
  url: string
  createdAt: string
  totalScore: number
  gradeLabel: string
  cmoSummary: string
}

export function PdfCoverPage({
  url,
  createdAt,
  totalScore,
  gradeLabel,
  cmoSummary,
}: PdfCoverPageProps): React.JSX.Element {
  const domain = (() => {
    try {
      return new URL(url).hostname
    } catch {
      return url
    }
  })()

  const dateStr = new Date(createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const scoreColor =
    totalScore >= 70
      ? colors.success500
      : totalScore >= 40
        ? colors.warning500
        : colors.danger500

  return (
    <View style={styles.section}>
      {/* 브랜딩 헤더 */}
      <View
        style={[
          styles.row,
          { justifyContent: 'space-between', marginBottom: 32 },
        ]}
      >
        <Text
          style={{ fontSize: 20, fontWeight: 700, color: colors.primary500 }}
        >
          Findably
        </Text>
        <Text style={{ fontSize: 9, color: colors.slate500 }}>
          AI 마케팅 종합 진단 리포트 · {dateStr}
        </Text>
      </View>

      {/* 메인 타이틀 */}
      <Text
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: colors.slate900,
          marginBottom: 8,
        }}
      >
        {domain}
      </Text>
      <Text style={{ fontSize: 10, color: colors.slate500, marginBottom: 32 }}>
        {url}
      </Text>

      {/* 종합 점수 카드 */}
      <View
        style={{
          backgroundColor: colors.slate50,
          borderRadius: 12,
          padding: 24,
          alignItems: 'center',
          marginBottom: 24,
          borderWidth: 1,
          borderColor: colors.slate200,
        }}
      >
        <Text
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: scoreColor,
            marginBottom: 4,
          }}
        >
          {totalScore}
        </Text>
        <Text style={{ fontSize: 11, fontWeight: 600, color: colors.slate700 }}>
          종합 마케팅 점수 · {gradeLabel} 등급
        </Text>
      </View>

      {/* 경영진 요약 */}
      <View
        style={{
          backgroundColor: colors.primary50,
          borderRadius: 8,
          padding: 16,
          borderLeftWidth: 4,
          borderLeftColor: colors.primary500,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: colors.slate900,
            marginBottom: 6,
          }}
        >
          경영진 요약
        </Text>
        <Text
          style={{
            fontSize: 10,
            color: colors.slate700,
            lineHeight: 1.8,
          }}
        >
          {cmoSummary}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* 리포트 목차 안내 */}
      <Text
        style={{
          fontSize: 9,
          color: colors.slate500,
          lineHeight: 1.6,
          marginTop: 8,
        }}
      >
        이 리포트에는 SWOT 분석, 90일 실행 로드맵, AI 인용 추적, 경쟁사 비교, AI
        인사이트(개선 방법 포함), 실행 체크리스트가 포함되어 있습니다.
      </Text>
    </View>
  )
}
