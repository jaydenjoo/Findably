import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  signupSchema,
  resetPasswordSchema,
  updatePasswordSchema,
} from '../schemas'

// ─── loginSchema ───

describe('loginSchema', () => {
  it('유효한 이메일+비밀번호 → 통과', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '12345678',
    })
    expect(result.success).toBe(true)
  })

  it('짧은 비밀번호도 로그인은 통과 (min(1)만 체크)', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'a',
    })
    expect(result.success).toBe(true)
  })

  it('이메일 비어있음 → 실패 + 에러 메시지', () => {
    const result = loginSchema.safeParse({ email: '', password: '12345678' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('이메일을 입력해주세요')
    }
  })

  it('잘못된 이메일 형식 → 실패', () => {
    const result = loginSchema.safeParse({
      email: 'not-email',
      password: '12345678',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        '올바른 이메일 형식이 아닙니다'
      )
    }
  })

  it('비밀번호 비어있음 → 실패 + 에러 메시지', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('비밀번호를 입력해주세요')
    }
  })
})

// ─── signupSchema ───

describe('signupSchema', () => {
  it('유효한 이메일 + 8자 이상 비밀번호 → 통과', () => {
    const result = signupSchema.safeParse({
      email: 'new@example.com',
      password: 'securepass',
    })
    expect(result.success).toBe(true)
  })

  it('8자 미만 비밀번호 → 실패', () => {
    const result = signupSchema.safeParse({
      email: 'new@example.com',
      password: 'short',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        '비밀번호는 8자 이상이어야 합니다'
      )
    }
  })

  it('이메일 비어있음 → 실패', () => {
    const result = signupSchema.safeParse({
      email: '',
      password: '12345678',
    })
    expect(result.success).toBe(false)
  })

  it('잘못된 이메일 형식 → 실패', () => {
    const result = signupSchema.safeParse({
      email: 'bad',
      password: '12345678',
    })
    expect(result.success).toBe(false)
  })
})

// ─── resetPasswordSchema ───

describe('resetPasswordSchema', () => {
  it('유효한 이메일 → 통과', () => {
    const result = resetPasswordSchema.safeParse({ email: 'user@example.com' })
    expect(result.success).toBe(true)
  })

  it('비어있는 이메일 → 실패', () => {
    const result = resetPasswordSchema.safeParse({ email: '' })
    expect(result.success).toBe(false)
  })

  it('잘못된 이메일 형식 → 실패', () => {
    const result = resetPasswordSchema.safeParse({ email: 'invalid' })
    expect(result.success).toBe(false)
  })
})

// ─── updatePasswordSchema ───

describe('updatePasswordSchema', () => {
  it('8자 이상 비밀번호 → 통과', () => {
    const result = updatePasswordSchema.safeParse({ password: '12345678' })
    expect(result.success).toBe(true)
  })

  it('8자 미만 비밀번호 → 실패', () => {
    const result = updatePasswordSchema.safeParse({ password: 'short' })
    expect(result.success).toBe(false)
  })

  it('비어있는 비밀번호 → 실패', () => {
    const result = updatePasswordSchema.safeParse({ password: '' })
    expect(result.success).toBe(false)
  })
})
