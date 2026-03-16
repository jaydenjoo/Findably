import { Text, View } from '@react-pdf/renderer'

import type { RoadmapItem } from '@/features/diagnosis-paid'

import { colors, styles } from '../styles'

interface PdfRoadmapProps {
  roadmap: RoadmapItem[]
}

const PRIORITY_STYLES = {
  high: { bg: colors.danger50, text: colors.danger700, label: '높음' },
  medium: { bg: colors.warning50, text: colors.warning700, label: '보통' },
  low: { bg: colors.success50, text: colors.success700, label: '낮음' },
} as const

function groupByWeek(items: RoadmapItem[]): Map<number, RoadmapItem[]> {
  const groups = new Map<number, RoadmapItem[]>()
  for (const item of items) {
    const existing = groups.get(item.week)
    if (existing) {
      existing.push(item)
    } else {
      groups.set(item.week, [item])
    }
  }
  return groups
}

export function PdfRoadmap({ roadmap }: PdfRoadmapProps): React.JSX.Element {
  const weekGroups = groupByWeek(roadmap)
  const sortedWeeks = [...weekGroups.keys()].sort((a, b) => a - b)

  return (
    <View style={styles.section}>
      <Text style={styles.h2}>90일 실행 로드맵</Text>
      <Text style={{ fontSize: 9, color: colors.slate500, marginBottom: 12 }}>
        우선순위와 영향도를 고려한 주차별 실행 계획입니다.
      </Text>

      {sortedWeeks.map((week) => {
        const items = weekGroups.get(week) ?? []
        return (
          <View key={week} style={{ marginBottom: 12 }}>
            {/* 주차 헤더 */}
            <View
              style={{
                backgroundColor: colors.primary50,
                borderRadius: 4,
                paddingHorizontal: 8,
                paddingVertical: 3,
                alignSelf: 'flex-start',
                marginBottom: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: colors.primary500,
                }}
              >
                {week}주차
              </Text>
            </View>

            {/* 항목들 */}
            {items.map((item, idx) => {
              const priority = PRIORITY_STYLES[item.priority]
              return (
                <View key={idx} style={[styles.card, { marginBottom: 4 }]}>
                  <View style={[styles.row, { marginBottom: 4, gap: 6 }]}>
                    <Text style={styles.h3}>{item.title}</Text>
                    <View
                      style={[styles.badge, { backgroundColor: priority.bg }]}
                    >
                      <Text
                        style={{
                          fontSize: 7,
                          color: priority.text,
                          fontWeight: 600,
                        }}
                      >
                        {priority.label}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.body}>{item.description}</Text>
                  <View style={[styles.row, { marginTop: 4, gap: 12 }]}>
                    <Text style={styles.caption}>
                      카테고리: {item.category}
                    </Text>
                    <Text style={styles.caption}>
                      예상 영향: +{item.estimatedImpact}점
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        )
      })}
    </View>
  )
}
