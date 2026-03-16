import { Text, View } from '@react-pdf/renderer'

import type { CompetitorAnalysis } from '@/features/diagnosis-paid'

import { colors, styles } from '../styles'

interface PdfCompetitorsProps {
  competitors: CompetitorAnalysis[]
}

function getScoreColor(score: number): string {
  if (score >= 70) return colors.success500
  if (score >= 40) return colors.warning500
  return colors.danger500
}

export function PdfCompetitors({
  competitors,
}: PdfCompetitorsProps): React.JSX.Element {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>경쟁사 비교 분석</Text>

      {competitors.map((comp, idx) => {
        const domain = (() => {
          try {
            return new URL(comp.url).hostname
          } catch {
            return comp.url
          }
        })()

        const isBenchmark = idx === 0

        return (
          <View
            key={comp.url}
            style={[
              styles.card,
              ...(isBenchmark
                ? [
                    {
                      backgroundColor: colors.primary50,
                      borderColor: colors.primary500,
                    },
                  ]
                : []),
            ]}
          >
            {/* 헤더 */}
            <View
              style={[
                styles.row,
                { justifyContent: 'space-between', marginBottom: 8 },
              ]}
            >
              <View style={[styles.row, { gap: 6 }]}>
                <Text style={styles.h3}>{domain}</Text>
                {isBenchmark && (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: colors.primary500 },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 7,
                        color: colors.white,
                        fontWeight: 600,
                      }}
                    >
                      벤치마크
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: getScoreColor(comp.overallScore),
                }}
              >
                {comp.overallScore}점
              </Text>
            </View>

            {/* 3열: 강점 / 약점 / 갭 */}
            <View style={[styles.row, { gap: 8, alignItems: 'flex-start' }]}>
              {/* 강점 */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: colors.success700,
                    marginBottom: 4,
                  }}
                >
                  강점
                </Text>
                {comp.strengths.map((s, i) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={[styles.bullet, { color: colors.success500 }]}>
                      •
                    </Text>
                    <Text style={[styles.listText, { fontSize: 8 }]}>{s}</Text>
                  </View>
                ))}
              </View>

              {/* 약점 */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: colors.danger700,
                    marginBottom: 4,
                  }}
                >
                  약점
                </Text>
                {comp.weaknesses.map((w, i) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={[styles.bullet, { color: colors.danger500 }]}>
                      •
                    </Text>
                    <Text style={[styles.listText, { fontSize: 8 }]}>{w}</Text>
                  </View>
                ))}
              </View>

              {/* 갭 */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: colors.warning700,
                    marginBottom: 4,
                  }}
                >
                  개선 기회
                </Text>
                {comp.gaps.map((g, i) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={[styles.bullet, { color: colors.warning500 }]}>
                      •
                    </Text>
                    <Text style={[styles.listText, { fontSize: 8 }]}>{g}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )
      })}
    </View>
  )
}
