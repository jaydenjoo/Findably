/**
 * 요금제 설정
 * 모든 금액 관련 상수는 여기서만 정의 (OST)
 */
export const PRICING = {
  /** 건당 결제 금액 (원 단위) */
  DIAGNOSIS_AMOUNT: 99_000,
  /** 건당 결제 금액 표시 문자열 */
  DIAGNOSIS_AMOUNT_LABEL: '9.9만원',
  /** 첫 진단 할인 금액 (원 단위) — Phase 2 적용 예정 */
  FIRST_DIAGNOSIS_DISCOUNT: 49_000,
} as const
