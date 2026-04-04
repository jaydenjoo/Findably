import { Text, View } from '@react-pdf/renderer'

import type { CategoryScore } from '@/features/diagnosis-free'

import { colors, styles } from '../styles'

interface PdfBridgeSectionProps {
  categoryScores: CategoryScore[]
}

const BRIDGE_ROWS = [
  {
    ids: ['technical', 'content', 'mobile'],
    label: 'SEO (검색 최적화)',
    meaning: 'Google에서 고객이 당신을 찾을 수 있는가',
  },
  {
    ids: ['geo', 'social-ai'],
    label: 'GEO (AI 검색 최적화)',
    meaning: 'ChatGPT, Perplexity가 당신을 추천하는가',
  },
  {
    ids: ['performance'],
    label: '기술 인프라',
    meaning: '고객이 떠나지 않을 만큼 빠르고 안정적인가',
  },
  {
    ids: ['security'],
    label: '보안',
    meaning: '사이트가 안전하고 신뢰할 수 있는가',
  },
]

function calculateGroupScore(
  categoryScores: CategoryScore[],
  ids: string[]
): number | null {
  const matched = categoryScores.filter((c) => ids.includes(c.id))
  if (matched.length === 0) return null
  const totalWeight = matched.reduce((sum, c) => sum + c.weight, 0)
  if (totalWeight === 0) return null
  return Math.round(
    matched.reduce((sum, c) => sum + c.score * c.weight, 0) / totalWeight
  )
}

function getScoreColor(score: number): string {
  if (score >= 70) return colors.success700
  if (score >= 40) return colors.warning700
  return colors.danger700
}

export function PdfBridgeSection({
  categoryScores,
}: PdfBridgeSectionProps): React.JSX.Element {
  const rows = BRIDGE_ROWS.map((row) => ({
    ...row,
    score: calculateGroupScore(categoryScores, row.ids),
  }))

  return (
    <View style={styles.section}>
      <Text style={styles.h2}>마케팅 비용이 새는 곳을 찾았습니다</Text>

      <Text
        style={{
          fontSize: 9,
          color: colors.slate700,
          marginBottom: 12,
          lineHeight: 1.6,
        }}
      >
        고객이 당신의 웹사이트를 검색에서 찾을 수 없거나, 찾았는데 느려서
        떠나거나, AI에게 물어봤는데 추천받지 못하면 — 모든 마케팅 비용이 새고
        있는 겁니다.
      </Text>

      {/* 테이블 헤더 */}
      <View style={[styles.tableHeader, { flexDirection: 'row' }]}>
        <Text
          style={{
            width: '30%',
            fontSize: 8,
            fontWeight: 600,
            color: colors.slate700,
          }}
        >
          진단 영역
        </Text>
        <Text
          style={{
            width: '50%',
            fontSize: 8,
            fontWeight: 600,
            color: colors.slate700,
          }}
        >
          마케팅에서의 의미
        </Text>
        <Text
          style={{
            width: '20%',
            fontSize: 8,
            fontWeight: 600,
            color: colors.slate700,
            textAlign: 'center',
          }}
        >
          점수
        </Text>
      </View>

      {/* 테이블 행 */}
      {rows.map((row) => (
        <View
          key={row.label}
          style={[styles.tableRow, { flexDirection: 'row' }]}
        >
          <Text
            style={{
              width: '30%',
              fontSize: 9,
              fontWeight: 600,
              color: colors.slate900,
            }}
          >
            {row.label}
          </Text>
          <Text style={{ width: '50%', fontSize: 9, color: colors.slate700 }}>
            {row.meaning}
          </Text>
          <Text
            style={{
              width: '20%',
              fontSize: 9,
              fontWeight: 700,
              textAlign: 'center',
              color:
                row.score !== null ? getScoreColor(row.score) : colors.slate300,
            }}
          >
            {row.score !== null ? `${row.score}/100` : '-'}
          </Text>
        </View>
      ))}

      <Text style={{ fontSize: 7, color: colors.slate500, marginTop: 8 }}>
        * 업종 평균 벤치마크 기준 추정치이며, 실제 결과와 다를 수 있습니다.
      </Text>
    </View>
  )
}
