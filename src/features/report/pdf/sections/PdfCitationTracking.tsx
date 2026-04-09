import { Text, View } from '@react-pdf/renderer'

import { CITATION_EMPTY_INFO } from '@/config/report'
import type {
  AICitationTrackingResult,
  CitationStatus,
} from '@/features/diagnosis-paid'

import { colors, styles } from '../styles'

interface PdfCitationTrackingProps {
  tracking: AICitationTrackingResult
}

const STATUS_CONFIG: Record<
  CitationStatus,
  { label: string; bg: string; text: string }
> = {
  mentioned: { label: 'Y', bg: colors.success50, text: colors.success700 },
  similar: { label: '△', bg: colors.warning50, text: colors.warning700 },
  not_mentioned: { label: 'N', bg: colors.danger50, text: colors.danger700 },
}

export function PdfCitationTracking({
  tracking,
}: PdfCitationTrackingProps): React.JSX.Element {
  // 플랫폼 목록 추출
  const platforms = tracking.platformSummary

  // 키워드 × 플랫폼 매트릭스 구성
  const resultMap = new Map<string, CitationStatus>()
  for (const r of tracking.results) {
    resultMap.set(`${r.keyword}:${r.platform}`, r.status)
  }

  const mentionRate = Math.round(tracking.overallMentionRate * 100)

  // Task 4-2: keywords/platforms가 0개이거나 인용률 0%면 "왜 0인지 + 개선 방법" 설명으로 대체
  // (docs/paid-report-audit-v1.md — 빈 테이블 대신 진단 + 액션 연결)
  const isEmpty =
    tracking.keywords.length === 0 ||
    platforms.length === 0 ||
    mentionRate === 0

  return (
    <View style={styles.section}>
      <Text style={styles.h2}>AI 인용 추적</Text>

      {/* 전체 인용률 */}
      <View
        style={{
          backgroundColor: colors.slate50,
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 10, color: colors.slate700 }}>
          전체 AI 인용률
        </Text>
        <Text
          style={{ fontSize: 16, fontWeight: 700, color: colors.primary500 }}
        >
          {mentionRate}%
        </Text>
      </View>

      {/* 0% 상태: 원인 + 개선 방향 안내 (빈 테이블 대체) */}
      {isEmpty && (
        <View
          style={{
            backgroundColor: colors.warning50,
            borderRadius: 8,
            padding: 12,
            borderLeftWidth: 3,
            borderLeftColor: colors.warning500,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: colors.warning700,
              marginBottom: 4,
            }}
          >
            {CITATION_EMPTY_INFO.title}
          </Text>
          <Text
            style={{
              fontSize: 9,
              color: colors.slate700,
              marginBottom: 4,
              lineHeight: 1.5,
            }}
          >
            {CITATION_EMPTY_INFO.body}
          </Text>
          <Text
            style={{
              fontSize: 9,
              color: colors.primary500,
              fontWeight: 600,
              lineHeight: 1.5,
            }}
          >
            {CITATION_EMPTY_INFO.cta}
          </Text>
        </View>
      )}

      {/* 플랫폼별 요약 (0% 상태에서는 hide) */}
      {!isEmpty && (
        <View
          style={[styles.row, { gap: 8, marginBottom: 12, flexWrap: 'wrap' }]}
        >
          {platforms.map((p) => (
            <View
              key={p.platform}
              style={{
                backgroundColor: colors.white,
                borderRadius: 6,
                border: `1px solid ${colors.slate200}`,
                padding: 8,
                minWidth: 100,
              }}
            >
              <Text
                style={{ fontSize: 9, fontWeight: 600, color: colors.slate900 }}
              >
                {p.platformLabel}
              </Text>
              <Text
                style={{ fontSize: 8, color: colors.slate500, marginTop: 2 }}
              >
                {p.mentionedCount}/{p.totalKeywords} 키워드 인용
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* 키워드 × 플랫폼 매트릭스 테이블 (0% 상태에서는 hide) */}
      {!isEmpty && (
        <View
          style={{
            borderRadius: 6,
            border: `1px solid ${colors.slate200}`,
            overflow: 'hidden',
          }}
        >
          {/* 헤더 */}
          <View style={styles.tableHeader}>
            <Text
              style={[
                styles.tableCell,
                { flex: 2, fontWeight: 600, color: colors.slate900 },
              ]}
            >
              키워드
            </Text>
            {platforms.map((p) => (
              <Text
                key={p.platform}
                style={[
                  styles.tableCell,
                  {
                    flex: 1,
                    fontWeight: 600,
                    color: colors.slate900,
                    textAlign: 'center',
                  },
                ]}
              >
                {p.platformLabel}
              </Text>
            ))}
          </View>

          {/* 행 */}
          {tracking.keywords.map((keyword) => (
            <View key={keyword} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>{keyword}</Text>
              {platforms.map((p) => {
                const status =
                  resultMap.get(`${keyword}:${p.platform}`) ?? 'not_mentioned'
                const config = STATUS_CONFIG[status]
                return (
                  <View
                    key={p.platform}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: config.bg,
                        borderRadius: 3,
                        paddingHorizontal: 5,
                        paddingVertical: 1,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 8,
                          fontWeight: 600,
                          color: config.text,
                        }}
                      >
                        {config.label}
                      </Text>
                    </View>
                  </View>
                )
              })}
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
