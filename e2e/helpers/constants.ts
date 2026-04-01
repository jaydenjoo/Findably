/**
 * E2E 테스트 공통 상수
 *
 * 모든 spec 파일에서 import하여 사용.
 * FAKE_UUID는 RFC 4122 nil UUID (Zod z.string().uuid() 통과).
 */

export const TEST_EMAIL = 'e2etest-0316@findably.dev'
export const TEST_PASSWORD = 'TestPass1234!'

/** RFC 4122 nil UUID — Zod uuid 검증 통과 */
export const FAKE_UUID = '00000000-0000-0000-0000-000000000000'

/** RFC 4122 compliant variant UUID — variant bit 'a' */
export const FAKE_UUID_VARIANT = '11111111-1111-1111-a111-111111111111'
