import { Text, View } from '@react-pdf/renderer'

import type { AIInsight } from '@/features/diagnosis-paid'

import { colors, styles } from '../styles'

interface PdfInsightsProps {
  insights: AIInsight[]
}

const SEVERITY_CONFIG = {
  critical: {
    label: '심각',
    bg: colors.danger50,
    text: colors.danger700,
    border: colors.danger500,
    order: 0,
  },
  warning: {
    label: '주의',
    bg: colors.warning50,
    text: colors.warning700,
    border: colors.warning500,
    order: 1,
  },
  info: {
    label: '정보',
    bg: colors.primary50,
    text: colors.primary500,
    border: colors.primary500,
    order: 2,
  },
} as const

export function PdfInsights({ insights }: PdfInsightsProps): React.JSX.Element {
  const sorted = [...insights].sort(
    (a, b) =>
      SEVERITY_CONFIG[a.severity].order - SEVERITY_CONFIG[b.severity].order
  )

  return (
    <View style={styles.section}>
      <Text style={styles.h2}>AI 인사이트</Text>

      {sorted.map((insight, idx) => {
        const severity = SEVERITY_CONFIG[insight.severity]
        return (
          <View
            key={idx}
            style={{
              borderRadius: 8,
              border: `1px solid ${colors.slate200}`,
              borderLeftWidth: 4,
              borderLeftColor: severity.border,
              padding: 12,
              marginBottom: 8,
              backgroundColor: colors.white,
            }}
          >
            {/* 헤더: 뱃지 + 제목 */}
            <View style={[styles.row, { gap: 6, marginBottom: 4 }]}>
              <View style={[styles.badge, { backgroundColor: severity.bg }]}>
                <Text
                  style={{ fontSize: 7, color: severity.text, fontWeight: 600 }}
                >
                  {severity.label}
                </Text>
              </View>
              <Text style={styles.h3}>{insight.title}</Text>
            </View>

            {/* 설명 */}
            <Text style={styles.body}>{insight.description}</Text>

            {/* 메타: 카테고리 + actionable */}
            <View style={[styles.row, { gap: 8, marginTop: 4 }]}>
              <Text style={styles.caption}>카테고리: {insight.category}</Text>
              {insight.actionable && (
                <View
                  style={[styles.badge, { backgroundColor: colors.success50 }]}
                >
                  <Text
                    style={{
                      fontSize: 7,
                      color: colors.success700,
                      fontWeight: 600,
                    }}
                  >
                    실행 가능
                  </Text>
                </View>
              )}
            </View>

            {/* 개선 방법 */}
            {insight.suggestedFix && (
              <View
                style={{
                  backgroundColor: colors.slate50,
                  borderRadius: 4,
                  padding: 8,
                  marginTop: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 8,
                    fontWeight: 600,
                    color: colors.slate900,
                    marginBottom: 2,
                  }}
                >
                  개선 방법
                </Text>
                <Text
                  style={{
                    fontSize: 9,
                    color: colors.slate700,
                    lineHeight: 1.5,
                  }}
                >
                  {insight.suggestedFix}
                </Text>
              </View>
            )}
          </View>
        )
      })}
    </View>
  )
}
