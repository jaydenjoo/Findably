// ─── Server Action 공통 반환 타입 ───

/** Server Action 결과. 폼에서 useActionState와 함께 사용 */
export type AuthActionState = {
  error?: string
  message?: string
}

// ─── NFR-6 보안 상수 ───

/** 계정 열거 방지: 로그인/가입 실패 시 항상 이 메시지 사용 */
export const AUTH_ERROR_GENERIC = '이메일 또는 비밀번호를 확인해주세요'
