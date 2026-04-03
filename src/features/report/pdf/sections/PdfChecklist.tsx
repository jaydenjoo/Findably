import { Text, View } from '@react-pdf/renderer'

import type { AIInsight } from '@/features/diagnosis-paid'

import { colors, styles } from '../styles'

interface PdfChecklistProps {
  insights: AIInsight[]
}

const SEVERITY_ICON = {
  critical: '!',
  warning: '△',
  info: '○',
} as const

/**
 * 실행 체크리스트 — 리포트 마지막 페이지
 * 고객이 출력해서 하나씩 체크하며 실행할 수 있는 형식
 */
export function PdfChecklist({
  insights,
}: PdfChecklistProps): React.JSX.Element {
  // 실행 가능한 항목만, 심각도순 정렬
  const actionable = insights
    .filter((i) => i.actionable || i.severity === 'critical')
    .sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 }
      return order[a.severity] - order[b.severity]
    })
    .slice(0, 15) // 최대 15개

  if (actionable.length === 0) return <View />

  return (
    <View style={styles.section} break>
      <Text style={styles.h2}>실행 체크리스트</Text>
      <Text
        style={{
          fontSize: 9,
          color: colors.slate500,
          marginBottom: 12,
          lineHeight: 1.5,
        }}
      >
        아래 항목을 우선순위대로 실행하세요. 출력해서 하나씩 체크하며 진행하면
        효과적입니다.
      </Text>

      {actionable.map((insight, idx) => {
        const icon = SEVERITY_ICON[insight.severity]
        const severityColor =
          insight.severity === 'critical'
            ? colors.danger700
            : insight.severity === 'warning'
              ? colors.warning700
              : colors.slate500

        return (
          <View
            key={idx}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              paddingVertical: 6,
              borderBottomWidth: 1,
              borderBottomColor: colors.slate100,
            }}
          >
            {/* 체크박스 */}
            <View
              style={{
                width: 14,
                height: 14,
                borderWidth: 1.5,
                borderColor: colors.slate300,
                borderRadius: 3,
                marginRight: 8,
                marginTop: 1,
              }}
            />

            {/* 심각도 아이콘 */}
            <Text
              style={{
                width: 16,
                fontSize: 10,
                fontWeight: 700,
                color: severityColor,
                marginRight: 4,
              }}
            >
              {icon}
            </Text>

            {/* 내용 */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: colors.slate900,
                  marginBottom: 1,
                }}
              >
                {idx + 1}. {insight.title}
              </Text>
              {insight.suggestedFix && (
                <Text
                  style={{
                    fontSize: 8,
                    color: colors.slate500,
                    lineHeight: 1.4,
                  }}
                >
                  {insight.suggestedFix.split('\n')[0]}
                </Text>
              )}
            </View>
          </View>
        )
      })}

      {/* 푸터 */}
      <View style={{ marginTop: 24, alignItems: 'center' }}>
        <Text
          style={{
            fontSize: 8,
            color: colors.slate500,
          }}
        >
          Findably — AI 마케팅 진단 · findably.vercel.app
        </Text>
      </View>
    </View>
  )
}
