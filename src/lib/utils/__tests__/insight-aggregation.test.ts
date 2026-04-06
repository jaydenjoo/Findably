/**
 * Phase A insight-aggregation.ts 단위 테스트
 * 지시문: docs/paid-report-audit-v1.md Task 1 + Task 3
 */

import { describe, expect, it } from 'vitest'

import { BASE_MONTHLY_REVENUE, LEAKAGE_CAP } from '@/config/revenue'
import type { AIInsight } from '@/features/diagnosis-paid'
import {
  classifyInsight,
  dedupeInsightsByImpactCategory,
  distributeRevenueLeakage,
} from '@/lib/utils/insight-aggregation'

// ─── 픽스처 ───

function makeInsight(overrides: Partial<AIInsight> = {}): AIInsight {
  return {
    title: 'test insight',
    description: 'test description',
    severity: 'warning',
    category: 'technical',
    actionable: true,
    ...overrides,
  }
}

// ─── classifyInsight ───

describe('classifyInsight', () => {
  it('SSL 키워드 → ssl', () => {
    expect(
      classifyInsight({
        title: 'SSL 인증서가 만료되었습니다',
        description: 'HTTPS 연결 불안정',
      })
    ).toBe('ssl')
  })

  it('HTTPS 키워드 → ssl', () => {
    expect(
      classifyInsight({
        title: '보안 인증서 문제',
        description: '자물쇠 아이콘이 표시되지 않음',
      })
    ).toBe('ssl')
  })

  it('LCP/속도 키워드 → lcp', () => {
    expect(
      classifyInsight({
        title: '페이지 속도가 느립니다',
        description: 'LCP 5.7초',
      })
    ).toBe('lcp')
  })

  it('PageSpeed 키워드 → lcp', () => {
    expect(
      classifyInsight({
        title: 'PageSpeed 점수 개선 필요',
        description: 'TTFB 1200ms',
      })
    ).toBe('lcp')
  })

  it('모바일/터치 키워드 → mobile', () => {
    expect(
      classifyInsight({
        title: '모바일 터치 타겟이 너무 작습니다',
        description: 'viewport 설정 부재',
      })
    ).toBe('mobile')
  })

  it('Schema 키워드 → schema', () => {
    expect(
      classifyInsight({
        title: 'Schema Markup 미설정',
        description: 'JSON-LD 구조화 데이터 추가 필요',
      })
    ).toBe('schema')
  })

  it('이미지/alt 키워드 → images', () => {
    expect(
      classifyInsight({
        title: '이미지 alt 속성 누락',
        description: '10개 이미지에 대체 텍스트 없음',
      })
    ).toBe('images')
  })

  it('og:image 키워드 → images', () => {
    expect(
      classifyInsight({
        title: 'Open Graph 이미지 부재',
        description: 'og:image 태그가 없어 카카오톡 공유 시 썸네일 미표시',
      })
    ).toBe('images')
  })

  it('내부 링크 키워드 → internal-links', () => {
    expect(
      classifyInsight({
        title: '내부 링크 부족',
        description: '사이트 내 페이지 연결 구조 빈약',
      })
    ).toBe('internal-links')
  })

  it('깨진 링크 키워드 → internal-links', () => {
    expect(
      classifyInsight({
        title: '깨진 링크 3개 발견',
        description: '404 오류',
      })
    ).toBe('internal-links')
  })

  it('Safe Browsing 키워드 → eeat', () => {
    expect(
      classifyInsight({
        title: 'Safe Browsing 안전',
        description: '보안 위협 없음',
      })
    ).toBe('eeat')
  })

  it('매칭 실패 → other fallback', () => {
    expect(
      classifyInsight({
        title: '메타 태그 개선',
        description: '페이지 제목 길이 조정 권장',
      })
    ).toBe('other')
  })

  it('빈 title+description → other', () => {
    expect(classifyInsight({ title: '', description: '' })).toBe('other')
  })

  it('우선순위: SSL + mobile 동시 매칭 → ssl (먼저 매칭)', () => {
    // "모바일에서 SSL 경고 표시" → SSL이 먼저 매칭되어야 함
    expect(
      classifyInsight({
        title: '모바일에서 SSL 인증서 경고 표시',
        description: '모바일 브라우저에서 위험 경고',
      })
    ).toBe('ssl')
  })

  it('우선순위: LCP + mobile 동시 매칭 → lcp', () => {
    expect(
      classifyInsight({
        title: '모바일 페이지 속도 저하',
        description: 'LCP 4.5초로 매우 느림',
      })
    ).toBe('lcp')
  })
})

// ─── distributeRevenueLeakage ───

describe('distributeRevenueLeakage', () => {
  it('빈 배열 → 0 반환', () => {
    const result = distributeRevenueLeakage([])
    expect(result.totalMonthlyManwon).toBe(0)
    expect(result.totalAnnualManwon).toBe(0)
    expect(result.byCategory).toEqual([])
    expect(result.leakageRatio).toBe(0)
  })

  it('SSL critical 1개만 → 캡 전체가 SSL에 할당 (재정규화)', () => {
    const insights = [
      makeInsight({
        title: 'SSL 인증서 만료',
        severity: 'critical',
        category: 'security',
      }),
    ]
    const result = distributeRevenueLeakage(insights)

    // 1개 카테고리만 활성 → weight/presentWeightSum = 1.0 → cap 전체 할당
    expect(result.byCategory).toHaveLength(1)
    expect(result.byCategory[0]?.categoryId).toBe('ssl')
    expect(result.byCategory[0]?.monthlyLossManwon).toBe(LEAKAGE_CAP / 10_000)
    expect(result.totalMonthlyManwon).toBe(LEAKAGE_CAP / 10_000)
  })

  it('모든 8개 카테고리 활성 → 총합 ≈ LEAKAGE_CAP', () => {
    const insights: AIInsight[] = [
      makeInsight({ title: 'SSL 만료', severity: 'critical' }),
      makeInsight({ title: 'LCP 5초', severity: 'critical' }),
      makeInsight({ title: '모바일 viewport 없음', severity: 'critical' }),
      makeInsight({ title: 'Schema Markup 미설정', severity: 'warning' }),
      makeInsight({ title: '이미지 alt 누락', severity: 'warning' }),
      makeInsight({ title: '내부 링크 부족', severity: 'info' }),
      makeInsight({ title: 'Safe Browsing 검증', severity: 'info' }),
      makeInsight({
        title: '메타 description 길이',
        description: '기타 케이스',
        severity: 'info',
      }),
    ]
    const result = distributeRevenueLeakage(insights)

    expect(result.byCategory).toHaveLength(8)
    // 반올림 오차 ±10만원 허용 (카테고리 8개 × 1만원 최대 오차)
    const capManwon = LEAKAGE_CAP / 10_000
    expect(result.totalMonthlyManwon).toBeGreaterThanOrEqual(capManwon - 10)
    expect(result.totalMonthlyManwon).toBeLessThanOrEqual(capManwon + 10)
  })

  it('대량 insights 30개 → 캡 초과하지 않음 (5,638만원 과장 방지)', () => {
    // 지시문의 과장 사례: critical 10 + warning 20 = 5,638만원
    const insights: AIInsight[] = [
      ...Array.from({ length: 10 }, (_, i) =>
        makeInsight({
          title: `SSL 문제 ${i}`,
          severity: 'critical',
          category: 'security',
        })
      ),
      ...Array.from({ length: 20 }, (_, i) =>
        makeInsight({
          title: `LCP 속도 이슈 ${i}`,
          severity: 'warning',
          category: 'performance',
        })
      ),
    ]
    const result = distributeRevenueLeakage(insights)

    // 활성 카테고리 = SSL, LCP 2개 → 재정규화로 총합 ≈ cap
    // 절대 5,638만원 같은 과장 불가
    expect(result.totalMonthlyManwon).toBeLessThanOrEqual(
      LEAKAGE_CAP / 10_000 + 5
    )
    expect(result.totalMonthlyManwon).toBeLessThan(500) // 500만원 미만 보장
  })

  it('SSL 카테고리에 insight 3개 이상 → representatives 최대 3개', () => {
    const insights = Array.from({ length: 5 }, (_, i) =>
      makeInsight({
        title: `SSL 이슈 ${i}`,
        severity: i === 0 ? 'critical' : 'warning',
        category: 'security',
      })
    )
    const result = distributeRevenueLeakage(insights)
    const sslCategory = result.byCategory.find((c) => c.categoryId === 'ssl')

    expect(sslCategory).toBeDefined()
    expect(sslCategory?.insights).toHaveLength(5)
    expect(sslCategory?.representatives).toHaveLength(3)
    // severity 우선: critical이 먼저
    expect(sslCategory?.representatives[0]?.severity).toBe('critical')
  })

  it('representatives는 severity DESC 순 (critical → warning → info)', () => {
    const insights = [
      makeInsight({ title: 'SSL info', severity: 'info' }),
      makeInsight({ title: 'SSL critical', severity: 'critical' }),
      makeInsight({ title: 'SSL warning', severity: 'warning' }),
    ]
    const result = distributeRevenueLeakage(insights)
    const sslCategory = result.byCategory.find((c) => c.categoryId === 'ssl')

    expect(sslCategory?.representatives[0]?.severity).toBe('critical')
    expect(sslCategory?.representatives[1]?.severity).toBe('warning')
    expect(sslCategory?.representatives[2]?.severity).toBe('info')
  })

  it('affectedCategories는 카테고리 내 insights의 원본 CategoryId 집합', () => {
    const insights = [
      makeInsight({
        title: 'SSL 문제 A',
        severity: 'critical',
        category: 'security',
      }),
      makeInsight({
        title: 'SSL 문제 B',
        severity: 'warning',
        category: 'geo',
      }),
      makeInsight({
        title: 'SSL 문제 C',
        severity: 'info',
        category: 'security',
      }),
    ]
    const result = distributeRevenueLeakage(insights)
    const sslCategory = result.byCategory.find((c) => c.categoryId === 'ssl')

    expect(sslCategory?.affectedCategories).toContain('security')
    expect(sslCategory?.affectedCategories).toContain('geo')
    // 중복 제거
    expect(sslCategory?.affectedCategories.length).toBe(2)
  })

  it('baseMonthlyRevenue 커스텀 → 캡이 비례 조정', () => {
    const insights = [makeInsight({ title: 'SSL 만료', severity: 'critical' })]
    const customBase = 50_000_000 // 5천만원
    const result = distributeRevenueLeakage(insights, {
      baseMonthlyRevenue: customBase,
    })

    // 캡 = 5천만원 × 0.2 = 1천만원 = 1000만원
    expect(result.byCategory[0]?.monthlyLossManwon).toBe(1000)
    expect(result.baseMonthlyRevenue).toBe(customBase)
  })

  it('byCategory는 금액 내림차순 정렬', () => {
    const insights: AIInsight[] = [
      makeInsight({ title: '내부 링크 부족' }), // weight 0.06
      makeInsight({ title: 'LCP 5초' }), // weight 0.20
      makeInsight({ title: '모바일 터치' }), // weight 0.12
    ]
    const result = distributeRevenueLeakage(insights)

    const amounts = result.byCategory.map((c) => c.monthlyLossManwon)
    const sorted = [...amounts].sort((a, b) => b - a)
    expect(amounts).toEqual(sorted)
    // 가장 큰 가중치(lcp 0.20)가 첫 번째
    expect(result.byCategory[0]?.categoryId).toBe('lcp')
  })

  it('leakageRatio는 총 누수 / 매출', () => {
    const insights = [makeInsight({ title: 'SSL 만료' })]
    const result = distributeRevenueLeakage(insights)

    // SSL만 활성 → 캡 전체 = 328만원 = 16400만원 매출의 20%
    expect(result.leakageRatio).toBeCloseTo(0.2, 2)
  })

  it('note 문구가 지시문 Task 1-4 요구사항 반영', () => {
    const result = distributeRevenueLeakage([
      makeInsight({ title: 'SSL 만료' }),
    ])
    expect(result.note).toContain('독립')
    expect(result.note).toContain('보정')
  })

  it('baseMonthlyRevenue 기본값 = 1,640만원', () => {
    const result = distributeRevenueLeakage([
      makeInsight({ title: 'SSL 만료' }),
    ])
    expect(result.baseMonthlyRevenue).toBe(BASE_MONTHLY_REVENUE)
    expect(result.baseMonthlyRevenue).toBe(16_400_000)
  })

  it('otherRatio는 키워드 매칭 실패 비율', () => {
    const insights = [
      makeInsight({ title: 'SSL 만료' }), // ssl
      makeInsight({ title: '알 수 없는 이슈 A' }), // other
      makeInsight({ title: '메타 description 조정' }), // other
      makeInsight({ title: 'LCP 느림' }), // lcp
    ]
    const result = distributeRevenueLeakage(insights)
    expect(result.otherRatio).toBe(0.5) // 2/4
  })
})

// ─── dedupeInsightsByImpactCategory ───

describe('dedupeInsightsByImpactCategory', () => {
  it('빈 배열 → 빈 배열', () => {
    expect(dedupeInsightsByImpactCategory([])).toEqual([])
  })

  it('SSL 5개 → 최대 3개 반환', () => {
    const insights = Array.from({ length: 5 }, (_, i) =>
      makeInsight({ title: `SSL 이슈 ${i}`, severity: 'critical' })
    )
    const deduped = dedupeInsightsByImpactCategory(insights)
    expect(deduped).toHaveLength(3)
  })

  it('여러 카테고리 → 카테고리별 대표만', () => {
    const insights = [
      makeInsight({ title: 'SSL 만료 A', severity: 'critical' }),
      makeInsight({ title: 'SSL 만료 B', severity: 'warning' }),
      makeInsight({ title: 'LCP 느림 A', severity: 'critical' }),
      makeInsight({ title: '모바일 터치 A', severity: 'warning' }),
    ]
    const deduped = dedupeInsightsByImpactCategory(insights)
    // SSL 2 + LCP 1 + Mobile 1 = 4 (각 카테고리 ≤ 3)
    expect(deduped).toHaveLength(4)
  })

  it('SSL 10개 + LCP 5개 → 각 카테고리 3개씩 = 6개', () => {
    const insights: AIInsight[] = [
      ...Array.from({ length: 10 }, (_, i) =>
        makeInsight({ title: `SSL ${i}`, severity: 'critical' })
      ),
      ...Array.from({ length: 5 }, (_, i) =>
        makeInsight({ title: `LCP ${i}`, severity: 'warning' })
      ),
    ]
    const deduped = dedupeInsightsByImpactCategory(insights)
    expect(deduped).toHaveLength(6)
  })

  it('dedupe 결과는 카테고리 금액 내림차순 → 카테고리 내 severity 순', () => {
    const insights: AIInsight[] = [
      makeInsight({ title: 'SSL A', severity: 'warning' }),
      makeInsight({ title: 'LCP A', severity: 'critical' }),
      makeInsight({ title: 'LCP B', severity: 'warning' }),
    ]
    const deduped = dedupeInsightsByImpactCategory(insights)
    // LCP 카테고리 (weight 0.20) > SSL (weight 0.15) → LCP 먼저
    expect(deduped[0]?.title).toContain('LCP')
  })
})
