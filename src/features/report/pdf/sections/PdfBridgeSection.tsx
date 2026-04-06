import { Text, View } from '@react-pdf/renderer'

import type { CategoryScore } from '@/features/diagnosis-free'
import type { AIInsight } from '@/features/diagnosis-paid'
import { distributeRevenueLeakage } from '@/lib/utils/insight-aggregation'

import { colors, styles } from '../styles'

interface PdfBridgeSectionProps {
  categoryScores: CategoryScore[]
  aiInsights?: AIInsight[]
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
  aiInsights,
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

      {/*
        총 누수 요약 카드 — Phase A (2026-04-06) 재설계
        지시문: 매출 캡(20%) + 가중 분배 + 중복 영향 보정 + "월매출 X만원 기준" 병기
      */}
      {(() => {
        const dist = distributeRevenueLeakage(aiInsights ?? [])
        if (dist.byCategory.length === 0) return null

        const baseManwon = Math.round(dist.baseMonthlyRevenue / 10_000)
        const leakagePercent = Math.round(dist.leakageRatio * 100)

        return (
          <View
            style={{
              marginTop: 12,
              backgroundColor: colors.primary50,
              borderRadius: 6,
              padding: 12,
              borderWidth: 1,
              borderColor: colors.slate200,
            }}
          >
            {/* 헤더 */}
            <Text
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: colors.slate900,
                marginBottom: 2,
              }}
            >
              💧 현재 매월 새고 있는 마케팅 비용 (추정)
            </Text>

            {/* 메인 금액 */}
            <Text
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: colors.slate900,
                marginBottom: 2,
              }}
            >
              매출의 약 {leakagePercent}% 수준 · 월 약{' '}
              {dist.totalMonthlyManwon.toLocaleString('ko-KR')}만원
            </Text>

            {/* 기준 매출 병기 */}
            <Text
              style={{
                fontSize: 8,
                color: colors.slate500,
                marginBottom: 8,
              }}
            >
              월매출 {baseManwon.toLocaleString('ko-KR')}만원 기준 추정 · 연간
              약 {dist.totalAnnualManwon.toLocaleString('ko-KR')}만원
            </Text>

            {/* 카테고리별 내역 */}
            {dist.byCategory.map((cat) => (
              <View
                key={cat.categoryId}
                style={{
                  flexDirection: 'row',
                  marginBottom: 3,
                }}
              >
                <Text
                  style={{
                    fontSize: 8,
                    fontWeight: 600,
                    color: colors.primary500,
                    width: '32%',
                  }}
                >
                  {cat.label}
                </Text>
                <Text
                  style={{
                    fontSize: 8,
                    color: colors.slate700,
                    width: '68%',
                  }}
                >
                  월 약 {cat.monthlyLossManwon.toLocaleString('ko-KR')}만원 영향
                  {cat.affectedCategories.length > 0 &&
                    `  (${cat.affectedCategories.map((c) => `#${c}`).join(' ')})`}
                </Text>
              </View>
            ))}

            {/* 중복 영향 보정 안내 (지시문 Task 1-4) */}
            <Text
              style={{
                fontSize: 7,
                color: colors.slate500,
                marginTop: 8,
                lineHeight: 1.5,
              }}
            >
              ℹ️ {dist.note}
            </Text>
          </View>
        )
      })()}

      {/* 출처 (검증 체크리스트 7번) */}
      <Text style={{ fontSize: 7, color: colors.slate500, marginTop: 8 }}>
        * 소상공인 월 평균 매출 벤치마크 출처: KCD 2025 Q4 통계 (직원 10인 이하
        사업장 기준)
      </Text>
    </View>
  )
}
