/** 업종별 매출 벤치마크 + Phase A 누수 상수
 *
 * Phase D (2026-04-09) 리팩토링:
 * - 기존 IndustryId(saas/ecommerce/...) + INDUSTRY_BENCHMARKS +
 *   calculateRevenueImpact + getBenchmark 는 외부 호출 0건(dead code)으로 삭제.
 * - KOSIS 소상공인실태조사 2023 대분류 11개 기반으로 교체.
 * - distributeRevenueLeakage()의 options.baseMonthlyRevenue 주입으로 동적화.
 */

// ─── 소상공인 업종 대분류 (KOSIS 2023) ────────────────────────────────

/**
 * 한국 소상공인 업종 대분류 ID
 * 출처: KOSIS DT_3ME0100 시도/산업중분류별 주요지표, 산업별(1) 대분류 11종
 * 소상공인실태조사 2023 잠정, 중소벤처기업부·통계청
 */
export type SmeIndustryId =
  | 'manufacturing' // 제조업
  | 'construction' // 건설업
  | 'wholesale_retail' // 도매 및 소매업
  | 'accommodation_food' // 숙박 및 음식점업
  | 'info_comm' // 정보통신업
  | 'real_estate' // 부동산업
  | 'professional' // 전문과학기술서비스업
  | 'facility_mgmt' // 사업시설관리, 사업지원 및 임대 서비스업
  | 'education' // 교육 서비스업
  | 'arts_sports' // 예술, 스포츠 및 여가관련 서비스업
  | 'personal_service' // 협회 및 단체, 수리 및 기타 개인서비스업

/** 사용자 친화 한글 라벨 — 드롭다운 UI 표시용 */
export const INDUSTRY_LABELS: Record<SmeIndustryId, string> = {
  manufacturing: '제조업',
  construction: '건설·인테리어',
  wholesale_retail: '도매·소매 (온라인 쇼핑몰 포함)',
  accommodation_food: '숙박·음식점·카페',
  info_comm: 'IT·소프트웨어·콘텐츠',
  real_estate: '부동산',
  professional: '전문 서비스 (컨설팅·법무·회계)',
  facility_mgmt: '사업시설관리·임대',
  education: '교육·학원',
  arts_sports: '예술·스포츠·여가',
  personal_service: '미용·수리·개인서비스',
} as const

/**
 * 업종별 월 평균 매출 (원)
 * 계산: KOSIS 기업체당 연매출(백만원) ÷ 12 × 1_000_000 (반올림)
 * 2023년 잠정 기준. 업데이트 시 KOSIS DT_3ME0100 재확인 필요.
 */
export const INDUSTRY_MONTHLY_REVENUE: Record<SmeIndustryId, number> = {
  manufacturing: 33_900_000, // 연 407백만원
  construction: 24_700_000, // 연 296
  wholesale_retail: 21_700_000, // 연 260
  accommodation_food: 12_600_000, // 연 151
  info_comm: 9_600_000, // 연 115
  real_estate: 4_300_000, // 연 51
  professional: 12_300_000, // 연 148
  facility_mgmt: 10_400_000, // 연 125
  education: 6_300_000, // 연 75
  arts_sports: 7_700_000, // 연 92
  personal_service: 5_600_000, // 연 67
} as const

/**
 * 드롭다운용 옵션 배열 (value + label)
 * UI 순서: 매출이 큰 업종부터 (사용자가 자기 업종 찾기 쉽게 빈도 반영 X, 매출 규모 기반)
 */
export const INDUSTRY_OPTIONS: readonly {
  value: SmeIndustryId
  label: string
}[] = [
  { value: 'wholesale_retail', label: INDUSTRY_LABELS.wholesale_retail },
  { value: 'accommodation_food', label: INDUSTRY_LABELS.accommodation_food },
  { value: 'manufacturing', label: INDUSTRY_LABELS.manufacturing },
  { value: 'construction', label: INDUSTRY_LABELS.construction },
  { value: 'professional', label: INDUSTRY_LABELS.professional },
  { value: 'info_comm', label: INDUSTRY_LABELS.info_comm },
  { value: 'facility_mgmt', label: INDUSTRY_LABELS.facility_mgmt },
  { value: 'education', label: INDUSTRY_LABELS.education },
  { value: 'personal_service', label: INDUSTRY_LABELS.personal_service },
  { value: 'arts_sports', label: INDUSTRY_LABELS.arts_sports },
  { value: 'real_estate', label: INDUSTRY_LABELS.real_estate },
] as const

/** SmeIndustryId 타입 가드 — 외부 입력 검증용 */
export function isSmeIndustryId(value: unknown): value is SmeIndustryId {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(INDUSTRY_MONTHLY_REVENUE, value)
  )
}

// ─── Phase A: 유료 리포트 매출 누수 재설계 (2026-04-06) ────────────────
//
// distributeRevenueLeakage()는 insights를 8개 영향 카테고리로 분류하고
// 총 누수 캡(매출의 20%) 내에서 가중 분배한다.
// Phase D에서 baseMonthlyRevenue가 업종별로 동적화됐다.

/**
 * 소상공인 월 평균 매출 기본값 (원)
 * 업종 미선택 시 fallback. KOSIS 2023 전산업 199백만원 ÷ 12 = 약 16.58백만원 (반올림)
 */
export const BASE_MONTHLY_REVENUE = 16_400_000

/** 누수 상한 비율 — 매출의 20% */
export const LEAKAGE_CAP_RATIO = 0.2

/** 기본 월 누수 상한 (원) — 업종 선택 시 distributeRevenueLeakage 내부에서 동적 재계산됨 */
export const LEAKAGE_CAP = Math.round(BASE_MONTHLY_REVENUE * LEAKAGE_CAP_RATIO)

/**
 * 업종 ID → 기준 월 매출(원) 조회.
 * null/undefined/알 수 없는 값 → BASE_MONTHLY_REVENUE fallback.
 *
 * Phase D 핵심 함수: distributeRevenueLeakage(insights, { baseMonthlyRevenue })에
 * 전달할 값을 생성. 기존 자유 텍스트로 저장된 industry 값도 fallback으로 안전 처리.
 */
export function getBaseMonthlyRevenueForIndustry(
  industry: string | null | undefined
): number {
  if (isSmeIndustryId(industry)) {
    return INDUSTRY_MONTHLY_REVENUE[industry]
  }
  return BASE_MONTHLY_REVENUE
}

/**
 * 업종 ID → 한글 라벨. 알 수 없으면 null.
 * 리포트 표기 "월매출 X만원 기준 · 업종: Y" 용도.
 */
export function getIndustryLabel(
  industry: string | null | undefined
): string | null {
  if (isSmeIndustryId(industry)) {
    return INDUSTRY_LABELS[industry]
  }
  return null
}

/** 8개 영향 카테고리 ID — distributeRevenueLeakage() 분배 단위 */
export type ImpactCategoryId =
  | 'ssl'
  | 'lcp'
  | 'mobile'
  | 'schema'
  | 'internal-links'
  | 'images'
  | 'eeat'
  | 'other'

/**
 * 영향 카테고리별 가중치 (총합 = 1.0)
 * Phase A Step 0 승인 매핑 (2026-04-06)
 */
export const IMPACT_CATEGORY_WEIGHTS: Record<ImpactCategoryId, number> = {
  ssl: 0.15,
  lcp: 0.2,
  mobile: 0.12,
  schema: 0.08,
  'internal-links': 0.06,
  images: 0.08,
  eeat: 0.07,
  other: 0.24,
}

/** 영향 카테고리 한국어 라벨 (UI 표시용) */
export const IMPACT_CATEGORY_LABELS: Record<ImpactCategoryId, string> = {
  ssl: 'SSL 보안',
  lcp: '페이지 속도',
  mobile: '모바일 UX',
  schema: '구조화 데이터',
  'internal-links': '내부 링크',
  images: '이미지',
  eeat: '신뢰 신호 (E-E-A-T)',
  other: '기타',
}

/** 영향 카테고리 분류 우선순위 (다중 매칭 시 앞 항목 우선) */
export const IMPACT_CATEGORY_PRIORITY: readonly ImpactCategoryId[] = [
  'ssl',
  'lcp',
  'mobile',
  'schema',
  'images',
  'internal-links',
  'eeat',
  'other',
] as const
