// ─── Server Action 공통 반환 타입 ───

/** Onboarding Server Action 결과. 폼에서 useActionState와 함께 사용 */
export type OnboardingActionState = {
  error?: string
  diagnosisId?: string
}

// ─── 진단 상태 조회 결과 (폴링용) ───

/** getDiagnosisStatus 반환 타입. 성공/실패 판별 유니온 */
export type DiagnosisStatusResult =
  | { status: string; url: string; id: string; error?: undefined }
  | { error: string; status?: undefined; url?: undefined; id?: undefined }

// ─── 진단 업데이트 데이터 ───

/** submit-info에서 diagnoses 테이블에 업데이트할 필드 */
export interface DiagnosisUpdateData {
  target_keywords?: string[]
  competitor_urls?: string[]
  industry?: string
}
