/**
 * Phase A + D revenue.ts 검증
 * Phase A: 누수 캡/가중치 상수 (2026-04-06)
 * Phase D: 업종별 baseMonthlyRevenue 동적화 (2026-04-09)
 * 지시문: docs/paid-report-audit-v1.md
 */

import { describe, expect, it } from 'vitest'

import {
  BASE_MONTHLY_REVENUE,
  IMPACT_CATEGORY_LABELS,
  IMPACT_CATEGORY_PRIORITY,
  IMPACT_CATEGORY_WEIGHTS,
  INDUSTRY_LABELS,
  INDUSTRY_MONTHLY_REVENUE,
  INDUSTRY_OPTIONS,
  LEAKAGE_CAP,
  LEAKAGE_CAP_RATIO,
  getBaseMonthlyRevenueForIndustry,
  getIndustryLabel,
  isSmeIndustryId,
  type ImpactCategoryId,
  type SmeIndustryId,
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

describe('Phase D — 업종별 baseMonthlyRevenue', () => {
  const ALL_INDUSTRY_IDS: SmeIndustryId[] = [
    'manufacturing',
    'construction',
    'wholesale_retail',
    'accommodation_food',
    'info_comm',
    'real_estate',
    'professional',
    'facility_mgmt',
    'education',
    'arts_sports',
    'personal_service',
  ]

  describe('INDUSTRY_MONTHLY_REVENUE', () => {
    it('KOSIS 11개 대분류 모두 정의', () => {
      for (const id of ALL_INDUSTRY_IDS) {
        expect(INDUSTRY_MONTHLY_REVENUE[id]).toBeGreaterThan(0)
      }
      expect(Object.keys(INDUSTRY_MONTHLY_REVENUE)).toHaveLength(11)
    })

    it('숙박·음식점업 월매출 = 12,600,000원 (KOSIS 2023 151백만/년)', () => {
      expect(INDUSTRY_MONTHLY_REVENUE.accommodation_food).toBe(12_600_000)
    })

    it('제조업이 전산업 평균보다 높음', () => {
      expect(INDUSTRY_MONTHLY_REVENUE.manufacturing).toBeGreaterThan(
        BASE_MONTHLY_REVENUE
      )
    })

    it('부동산업이 전산업 평균보다 낮음', () => {
      expect(INDUSTRY_MONTHLY_REVENUE.real_estate).toBeLessThan(
        BASE_MONTHLY_REVENUE
      )
    })
  })

  describe('INDUSTRY_LABELS', () => {
    it('11개 업종 모두 한글 라벨 정의', () => {
      for (const id of ALL_INDUSTRY_IDS) {
        expect(INDUSTRY_LABELS[id]).toBeTruthy()
        expect(typeof INDUSTRY_LABELS[id]).toBe('string')
      }
    })
  })

  describe('INDUSTRY_OPTIONS', () => {
    it('11개 옵션 모두 value + label 보유', () => {
      expect(INDUSTRY_OPTIONS).toHaveLength(11)
      for (const opt of INDUSTRY_OPTIONS) {
        expect(opt.value).toBeTruthy()
        expect(opt.label).toBeTruthy()
        expect(INDUSTRY_LABELS[opt.value]).toBe(opt.label)
      }
    })

    it('중복 value 없음', () => {
      const values = INDUSTRY_OPTIONS.map((o) => o.value)
      expect(new Set(values).size).toBe(values.length)
    })
  })

  describe('isSmeIndustryId', () => {
    it('유효한 업종 ID는 true', () => {
      expect(isSmeIndustryId('accommodation_food')).toBe(true)
      expect(isSmeIndustryId('manufacturing')).toBe(true)
    })

    it('null/undefined/빈 문자열은 false', () => {
      expect(isSmeIndustryId(null)).toBe(false)
      expect(isSmeIndustryId(undefined)).toBe(false)
      expect(isSmeIndustryId('')).toBe(false)
    })

    it('알 수 없는 문자열은 false (레거시 자유 텍스트 안전 처리)', () => {
      expect(isSmeIndustryId('B2B SaaS')).toBe(false)
      expect(isSmeIndustryId('saas')).toBe(false) // 기존 System 1 이름
      expect(isSmeIndustryId('random')).toBe(false)
    })

    it('number/object 등 비문자열은 false', () => {
      expect(isSmeIndustryId(123)).toBe(false)
      expect(isSmeIndustryId({})).toBe(false)
    })
  })

  describe('getBaseMonthlyRevenueForIndustry', () => {
    it('유효한 업종 ID → 업종별 월매출', () => {
      expect(getBaseMonthlyRevenueForIndustry('accommodation_food')).toBe(
        12_600_000
      )
      expect(getBaseMonthlyRevenueForIndustry('manufacturing')).toBe(33_900_000)
    })

    it('null/undefined → BASE_MONTHLY_REVENUE fallback', () => {
      expect(getBaseMonthlyRevenueForIndustry(null)).toBe(BASE_MONTHLY_REVENUE)
      expect(getBaseMonthlyRevenueForIndustry(undefined)).toBe(
        BASE_MONTHLY_REVENUE
      )
    })

    it('알 수 없는 문자열 → fallback (레거시 자유 텍스트 안전)', () => {
      expect(getBaseMonthlyRevenueForIndustry('B2B SaaS')).toBe(
        BASE_MONTHLY_REVENUE
      )
      expect(getBaseMonthlyRevenueForIndustry('')).toBe(BASE_MONTHLY_REVENUE)
    })
  })

  describe('getIndustryLabel', () => {
    it('유효한 업종 ID → 한글 라벨', () => {
      expect(getIndustryLabel('accommodation_food')).toBe('숙박·음식점·카페')
      expect(getIndustryLabel('manufacturing')).toBe('제조업')
    })

    it('null/undefined/알 수 없는 값 → null', () => {
      expect(getIndustryLabel(null)).toBeNull()
      expect(getIndustryLabel(undefined)).toBeNull()
      expect(getIndustryLabel('B2B SaaS')).toBeNull()
    })
  })
})
