import { Text, View } from '@react-pdf/renderer'

import { colors, styles } from '../styles'

interface PdfCmoSummaryProps {
  summary: string
}

export function PdfCmoSummary({
  summary,
}: PdfCmoSummaryProps): React.JSX.Element {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>CMO Executive Summary</Text>
      <View
        style={{
          backgroundColor: colors.primary50,
          borderRadius: 8,
          padding: 16,
          borderLeftWidth: 4,
          borderLeftColor: colors.primary500,
        }}
      >
        <Text style={{ fontSize: 10, color: colors.slate700, lineHeight: 1.7 }}>
          {summary}
        </Text>
      </View>
    </View>
  )
}
