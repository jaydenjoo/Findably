/**
 * Phase A revenue.ts 신규 상수 검증
 * 지시문: docs/paid-report-audit-v1.md
 */

import { describe, expect, it } from 'vitest'

import {
  BASE_MONTHLY_REVENUE,
  IMPACT_CATEGORY_LABELS,
  IMPACT_CATEGORY_PRIORITY,
  IMPACT_CATEGORY_WEIGHTS,
  LEAKAGE_CAP,
  LEAKAGE_CAP_RATIO,
  type ImpactCategoryId,
} from '@/config/revenue'

describe('Phase A — revenue.ts 신규 상수', () => {
  describe('BASE_MONTHLY_REVENUE', () => {
    it('소상공인 월 평균 매출 1,640만원 (KCD 2025 Q4)', () => {
      expect(BASE_MONTHLY_REVENUE).toBe(16_400_000)
    })
  })

  describe('LEAKAGE_CAP_RATIO', () => {
    it('매출의 20%가 누수 상한', () => {
      expect(LEAKAGE_CAP_RATIO).toBe(0.2)
    })
  })

  describe('LEAKAGE_CAP', () => {
    it('월 누수 상한 = 328만원', () => {
      expect(LEAKAGE_CAP).toBe(3_280_000)
    })

    it('BASE × RATIO와 일치', () => {
      expect(LEAKAGE_CAP).toBe(BASE_MONTHLY_REVENUE * LEAKAGE_CAP_RATIO)
    })
  })

  describe('IMPACT_CATEGORY_WEIGHTS', () => {
    it('8개 카테고리 모두 정의', () => {
      const keys: ImpactCategoryId[] = [
        'ssl',
        'lcp',
        'mobile',
        'schema',
        'internal-links',
        'images',
        'eeat',
        'other',
      ]
      for (const key of keys) {
        expect(IMPACT_CATEGORY_WEIGHTS[key]).toBeGreaterThan(0)
      }
    })

    it('가중치 총합 = 1.00 (부동소수점 오차 허용)', () => {
      const total = Object.values(IMPACT_CATEGORY_WEIGHTS).reduce(
        (sum, w) => sum + w,
        0
      )
      expect(total).toBeCloseTo(1.0, 10)
    })

    it('지시문 Task 1-3 가중치 일치', () => {
      // docs/paid-report-audit-v1.md Task 1-3 예시 가중치
      expect(IMPACT_CATEGORY_WEIGHTS.ssl).toBe(0.15)
      expect(IMPACT_CATEGORY_WEIGHTS.lcp).toBe(0.2)
      expect(IMPACT_CATEGORY_WEIGHTS.mobile).toBe(0.12)
      expect(IMPACT_CATEGORY_WEIGHTS.schema).toBe(0.08)
      expect(IMPACT_CATEGORY_WEIGHTS['internal-links']).toBe(0.06)
      expect(IMPACT_CATEGORY_WEIGHTS.images).toBe(0.08)
      expect(IMPACT_CATEGORY_WEIGHTS.eeat).toBe(0.07)
      expect(IMPACT_CATEGORY_WEIGHTS.other).toBe(0.24)
    })
  })

  describe('IMPACT_CATEGORY_LABELS', () => {
    it('8개 카테고리 모두 한국어 라벨 정의', () => {
      const keys = Object.keys(IMPACT_CATEGORY_WEIGHTS) as ImpactCategoryId[]
      for (const key of keys) {
        expect(IMPACT_CATEGORY_LABELS[key]).toBeTruthy()
        expect(typeof IMPACT_CATEGORY_LABELS[key]).toBe('string')
      }
    })
  })

  describe('IMPACT_CATEGORY_PRIORITY', () => {
    it('8개 카테고리 모두 포함', () => {
      expect(IMPACT_CATEGORY_PRIORITY).toHaveLength(8)
      const keys = new Set(IMPACT_CATEGORY_PRIORITY)
      expect(keys.size).toBe(8)
    })

    it('other가 마지막 (fallback)', () => {
      expect(
        IMPACT_CATEGORY_PRIORITY[IMPACT_CATEGORY_PRIORITY.length - 1]
      ).toBe('other')
    })

    it('ssl이 최우선', () => {
      expect(IMPACT_CATEGORY_PRIORITY[0]).toBe('ssl')
    })
  })
})
