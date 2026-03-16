import { Text, View } from '@react-pdf/renderer'

import type { SwotAnalysis } from '@/features/diagnosis-paid'

import { colors, styles } from '../styles'

interface PdfSwotProps {
  swot: SwotAnalysis
}

const SWOT_CONFIG = [
  {
    key: 'strengths' as const,
    label: '강점 (Strengths)',
    bg: colors.success50,
    border: colors.success500,
    text: colors.success700,
  },
  {
    key: 'weaknesses' as const,
    label: '약점 (Weaknesses)',
    bg: colors.danger50,
    border: colors.danger500,
    text: colors.danger700,
  },
  {
    key: 'opportunities' as const,
    label: '기회 (Opportunities)',
    bg: colors.warning50,
    border: colors.warning500,
    text: colors.warning700,
  },
  {
    key: 'threats' as const,
    label: '위협 (Threats)',
    bg: colors.danger50,
    border: colors.danger500,
    text: colors.danger700,
  },
] as const

export function PdfSwot({ swot }: PdfSwotProps): React.JSX.Element {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>SWOT 분석</Text>
      <View style={styles.grid2}>
        {SWOT_CONFIG.map((config) => (
          <View
            key={config.key}
            style={[
              styles.gridItem,
              {
                backgroundColor: config.bg,
                borderRadius: 8,
                borderLeftWidth: 4,
                borderLeftColor: config.border,
                padding: 12,
                marginBottom: 8,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: config.text,
                marginBottom: 6,
              }}
            >
              {config.label}
            </Text>
            {swot[config.key].map((item, idx) => (
              <View key={idx} style={styles.listItem}>
                <Text style={[styles.bullet, { color: config.border }]}>•</Text>
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  )
}
