import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AUTH_ERROR_GENERIC } from '../types'

// ─── Mocks ───

const mockRedirect = vi.fn<(url: string) => never>()
vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(args[0] as string),
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(() =>
    Promise.resolve({
      get: (name: string) => {
        if (name === 'origin') return 'http://localhost:3600'
        return null
      },
    })
  ),
  cookies: vi.fn(() =>
    Promise.resolve({
      getAll: () => [],
      set: vi.fn(),
    })
  ),
}))

const mockAuth = {
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({ auth: mockAuth })),
}))

// ─── Helpers ───

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(data)) {
    fd.set(key, value)
  }
  return fd
}

// ─── Imports (mock 선언 후) ───

import { loginAction } from '../actions/login'
import { signupAction } from '../actions/signup'
import { logoutAction } from '../actions/logout'
import { resetPasswordAction } from '../actions/reset-password'
import { updatePasswordAction } from '../actions/update-password'

// ─── Setup ───

beforeEach(() => {
  vi.clearAllMocks()
  // redirect는 실제 Next.js처럼 throw하여 실행 중단
  mockRedirect.mockImplementation(() => {
    throw new Error('NEXT_REDIRECT')
  })
})

// ─── loginAction ───

describe('loginAction', () => {
  it('유효한 입력 → Supabase signIn 호출 + /dashboard redirect', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({ error: null })
    const fd = createFormData({
      email: 'user@example.com',
      password: '12345678',
    })

    await expect(loginAction({}, fd)).rejects.toThrow('NEXT_REDIRECT')

    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: '12345678',
    })
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard')
  })

  it('redirectTo 파라미터 있으면 해당 경로로 redirect', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({ error: null })
    const fd = createFormData({
      email: 'user@example.com',
      password: '12345678',
      redirectTo: '/settings/profile',
    })

    await expect(loginAction({}, fd)).rejects.toThrow('NEXT_REDIRECT')
    expect(mockRedirect).toHaveBeenCalledWith('/settings/profile')
  })

  it('오픈 리다이렉트 방지: 외부 URL → /dashboard로 fallback', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({ error: null })
    const fd = createFormData({
      email: 'user@example.com',
      password: '12345678',
      redirectTo: 'https://evil.com',
    })

    await expect(loginAction({}, fd)).rejects.toThrow('NEXT_REDIRECT')
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard')
  })

  it('Zod 검증 실패 → error 반환 (Supabase 호출 안 함)', async () => {
    const fd = createFormData({ email: 'bad-email', password: '' })
    const result = await loginAction({}, fd)

    expect(result.error).toBeDefined()
    expect(mockAuth.signInWithPassword).not.toHaveBeenCalled()
  })

  it('Supabase 에러 → AUTH_ERROR_GENERIC 반환 (NFR-6)', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({
      error: { message: 'Invalid credentials' },
    })
    const fd = createFormData({
      email: 'user@example.com',
      password: 'wrongpass',
    })
    const result = await loginAction({}, fd)

    expect(result.error).toBe(AUTH_ERROR_GENERIC)
  })
})

// ─── signupAction ───

describe('signupAction', () => {
  it('유효한 입력 → signUp 호출 + /signup/confirm redirect', async () => {
    mockAuth.signUp.mockResolvedValue({ error: null })
    const fd = createFormData({
      email: 'new@example.com',
      password: 'securepass',
    })

    await expect(signupAction({}, fd)).rejects.toThrow('NEXT_REDIRECT')

    expect(mockAuth.signUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'securepass',
      options: {
        emailRedirectTo: 'http://localhost:3600/auth/callback',
      },
    })
    expect(mockRedirect).toHaveBeenCalledWith('/signup/confirm')
  })

  it('8자 미만 비밀번호 → Zod 검증 실패', async () => {
    const fd = createFormData({ email: 'new@example.com', password: 'short' })
    const result = await signupAction({}, fd)

    expect(result.error).toBeDefined()
    expect(mockAuth.signUp).not.toHaveBeenCalled()
  })

  it('Supabase 에러 → AUTH_ERROR_GENERIC 반환', async () => {
    mockAuth.signUp.mockResolvedValue({
      error: { message: 'User already registered' },
    })
    const fd = createFormData({
      email: 'exists@example.com',
      password: 'securepass',
    })
    const result = await signupAction({}, fd)

    expect(result.error).toBe(AUTH_ERROR_GENERIC)
  })
})

// ─── logoutAction ───

describe('logoutAction', () => {
  it('signOut 호출 + / redirect', async () => {
    mockAuth.signOut.mockResolvedValue({ error: null })

    await expect(logoutAction()).rejects.toThrow('NEXT_REDIRECT')

    expect(mockAuth.signOut).toHaveBeenCalled()
    expect(mockRedirect).toHaveBeenCalledWith('/')
  })
})

// ─── resetPasswordAction ───

describe('resetPasswordAction', () => {
  it('유효한 이메일 → 성공 메시지 (NFR-6: 이메일 존재 무관)', async () => {
    mockAuth.resetPasswordForEmail.mockResolvedValue({ error: null })
    const fd = createFormData({ email: 'user@example.com' })
    const result = await resetPasswordAction({}, fd)

    expect(result.message).toBe(
      '비밀번호 재설정 링크를 보냈습니다. 메일함을 확인해주세요.'
    )
    expect(result.error).toBeUndefined()
  })

  it('존재하지 않는 이메일도 동일 메시지 반환 (NFR-6)', async () => {
    // Supabase가 에러를 던져도 동일 메시지
    mockAuth.resetPasswordForEmail.mockResolvedValue({
      error: { message: 'User not found' },
    })
    const fd = createFormData({ email: 'notfound@example.com' })
    const result = await resetPasswordAction({}, fd)

    expect(result.message).toBe(
      '비밀번호 재설정 링크를 보냈습니다. 메일함을 확인해주세요.'
    )
  })

  it('Zod 검증 실패 → error 반환', async () => {
    const fd = createFormData({ email: '' })
    const result = await resetPasswordAction({}, fd)

    expect(result.error).toBeDefined()
    expect(mockAuth.resetPasswordForEmail).not.toHaveBeenCalled()
  })
})

// ─── updatePasswordAction ───

describe('updatePasswordAction', () => {
  it('유효한 비밀번호 → updateUser 호출 + /login redirect', async () => {
    mockAuth.updateUser.mockResolvedValue({ error: null })
    const fd = createFormData({ password: 'newpassword123' })

    await expect(updatePasswordAction({}, fd)).rejects.toThrow('NEXT_REDIRECT')

    expect(mockAuth.updateUser).toHaveBeenCalledWith({
      password: 'newpassword123',
    })
    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })

  it('8자 미만 비밀번호 → Zod 검증 실패', async () => {
    const fd = createFormData({ password: 'short' })
    const result = await updatePasswordAction({}, fd)

    expect(result.error).toBeDefined()
    expect(mockAuth.updateUser).not.toHaveBeenCalled()
  })

  it('Supabase 에러 → 에러 메시지 반환', async () => {
    mockAuth.updateUser.mockResolvedValue({
      error: { message: 'Token expired' },
    })
    const fd = createFormData({ password: 'newpassword123' })
    const result = await updatePasswordAction({}, fd)

    expect(result.error).toBe(
      '비밀번호 변경에 실패했습니다. 다시 시도해주세요.'
    )
  })
})
