// ─── Server Action 공통 반환 타입 ───

/** Onboarding Server Action 결과. 폼에서 useActionState와 함께 사용 */
export type OnboardingActionState = {
  error?: string
  diagnosisId?: string
}
