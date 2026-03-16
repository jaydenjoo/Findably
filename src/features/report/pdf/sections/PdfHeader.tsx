import { Text, View } from '@react-pdf/renderer'

import { colors, styles } from '../styles'

interface PdfHeaderProps {
  url: string
  createdAt: string
}

export function PdfHeader({
  url,
  createdAt,
}: PdfHeaderProps): React.JSX.Element {
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

  return (
    <View style={styles.section}>
      {/* 로고 영역 */}
      <View
        style={[
          styles.row,
          { justifyContent: 'space-between', marginBottom: 16 },
        ]}
      >
        <Text
          style={{ fontSize: 16, fontWeight: 700, color: colors.primary500 }}
        >
          Findably
        </Text>
        <Text style={styles.caption}>{dateStr}</Text>
      </View>

      {/* 제목 */}
      <Text style={styles.h1}>{domain} 종합 분석 리포트</Text>
      <Text style={{ fontSize: 10, color: colors.slate500, marginTop: 4 }}>
        {url}
      </Text>

      {/* 구분선 */}
      <View style={styles.divider} />
    </View>
  )
}
