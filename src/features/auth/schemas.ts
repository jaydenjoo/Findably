import { z } from 'zod'

// ─── 공통 필드 ───

const emailField = z
  .string()
  .min(1, '이메일을 입력해주세요')
  .email('올바른 이메일 형식이 아닙니다')

const passwordField = z
  .string()
  .min(1, '비밀번호를 입력해주세요')
  .min(8, '비밀번호는 8자 이상이어야 합니다')

// ─── 스키마 ───

/** 로그인 폼 검증 */
export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, '비밀번호를 입력해주세요'),
})

/** 회원가입 폼 검증 */
export const signupSchema = z.object({
  email: emailField,
  password: passwordField,
})

/** 비밀번호 재설정 요청 (이메일만) */
export const resetPasswordSchema = z.object({
  email: emailField,
})

/** 새 비밀번호 설정 */
export const updatePasswordSchema = z.object({
  password: passwordField,
})

// ─── 타입 추출 ───

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>
