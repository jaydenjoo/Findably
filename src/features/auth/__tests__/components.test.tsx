import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

// ─── UI 컴포넌트 모킹 (base-ui jsdom 호환) ───

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: {
    children: React.ReactNode
    onClick?: () => void
    [key: string]: unknown
  }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}))

vi.mock('@/components/ui/label', () => ({
  Label: ({
    children,
    ...props
  }: {
    children: React.ReactNode
    [key: string]: unknown
  }) => <label {...props}>{children}</label>,
}))

// ─── Server Action 모킹 ───

vi.mock('../actions/login', () => ({
  loginAction: vi.fn(async () => ({})),
}))
vi.mock('../actions/signup', () => ({
  signupAction: vi.fn(async () => ({})),
}))
vi.mock('../actions/reset-password', () => ({
  resetPasswordAction: vi.fn(async () => ({})),
}))
vi.mock('../actions/update-password', () => ({
  updatePasswordAction: vi.fn(async () => ({})),
}))

// ─── Supabase Client 모킹 (GoogleAuthButton) ───

const mockSignInWithOAuth = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signInWithOAuth: mockSignInWithOAuth },
  }),
}))

// ─── Imports (mock 선언 후) ───

import { LoginForm } from '../components/LoginForm'
import { SignupForm } from '../components/SignupForm'
import { GoogleAuthButton } from '../components/GoogleAuthButton'
import { PasswordResetRequestForm } from '../components/PasswordResetRequestForm'
import { UpdatePasswordForm } from '../components/UpdatePasswordForm'

// ─── Setup ───

beforeEach(() => {
  vi.clearAllMocks()
  mockSignInWithOAuth.mockResolvedValue({ error: null })
})

// ─── LoginForm ───

describe('LoginForm', () => {
  it('이메일/비밀번호 필드 + 로그인 버튼 렌더링', () => {
    render(<LoginForm />)

    expect(screen.getByLabelText('이메일 주소')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveTextContent('로그인 →')
  })

  it('redirectTo → hidden input 렌더링', () => {
    const { container } = render(<LoginForm redirectTo="/settings" />)
    const hidden = container.querySelector(
      'input[type="hidden"][name="redirectTo"]'
    ) as HTMLInputElement

    expect(hidden).toBeInTheDocument()
    expect(hidden.value).toBe('/settings')
  })

  it('redirectTo 없으면 hidden input 없음', () => {
    const { container } = render(<LoginForm />)
    expect(container.querySelector('input[type="hidden"]')).toBeNull()
  })

  it('빈 폼 제출 → 이메일/비밀번호 Zod 에러', () => {
    render(<LoginForm />)

    fireEvent.submit(screen.getByRole('button').closest('form')!)

    expect(screen.getByText('이메일을 입력해주세요')).toBeInTheDocument()
    expect(screen.getByText('비밀번호를 입력해주세요')).toBeInTheDocument()
  })

  it('유효한 입력 후 제출 → 에러 초기화', () => {
    render(<LoginForm />)
    const form = screen.getByRole('button').closest('form')!

    // 에러 발생
    fireEvent.submit(form)
    expect(screen.getByText('이메일을 입력해주세요')).toBeInTheDocument()

    // 유효한 값 입력 후 재제출
    fireEvent.change(screen.getByLabelText('이메일 주소'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText('비밀번호'), {
      target: { value: 'p' },
    })
    fireEvent.submit(form)

    // loginSchema password min(1) → 1자도 통과 → 에러 사라짐
    expect(screen.queryByText('이메일을 입력해주세요')).toBeNull()
    expect(screen.queryByText('비밀번호를 입력해주세요')).toBeNull()
  })
})

// ─── SignupForm ───

describe('SignupForm', () => {
  it('이메일/비밀번호 필드 + 가입 버튼 렌더링', () => {
    render(<SignupForm />)

    expect(screen.getByLabelText('이메일 주소')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveTextContent('가입하기 →')
  })

  it('빈 폼 제출 → Zod 에러', () => {
    render(<SignupForm />)

    fireEvent.submit(screen.getByRole('button').closest('form')!)

    expect(screen.getByText('이메일을 입력해주세요')).toBeInTheDocument()
    expect(screen.getByText('비밀번호를 입력해주세요')).toBeInTheDocument()
  })

  it('유효 이메일 + 짧은 비밀번호 → 8자 미만 에러', () => {
    render(<SignupForm />)

    fireEvent.change(screen.getByLabelText('이메일 주소'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText('비밀번호'), {
      target: { value: 'short' },
    })

    fireEvent.submit(screen.getByRole('button').closest('form')!)

    // 이메일 에러 없음
    expect(screen.queryByText('이메일을 입력해주세요')).toBeNull()
    // 비밀번호 8자 미만 에러
    expect(
      screen.getByText('비밀번호는 8자 이상이어야 합니다')
    ).toBeInTheDocument()
  })

  it('유효 입력 → 에러 초기화', () => {
    render(<SignupForm />)
    const form = screen.getByRole('button').closest('form')!

    // 에러 발생
    fireEvent.submit(form)
    expect(screen.getByText('이메일을 입력해주세요')).toBeInTheDocument()

    // 유효한 값 입력
    fireEvent.change(screen.getByLabelText('이메일 주소'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText('비밀번호'), {
      target: { value: 'securepass' },
    })
    fireEvent.submit(form)

    expect(screen.queryByText('이메일을 입력해주세요')).toBeNull()
    expect(screen.queryByText('비밀번호를 입력해주세요')).toBeNull()
    expect(screen.queryByText('비밀번호는 8자 이상이어야 합니다')).toBeNull()
  })
})

// ─── PasswordResetRequestForm ───

describe('PasswordResetRequestForm', () => {
  it('이메일 필드 + 전송 버튼 렌더링', () => {
    render(<PasswordResetRequestForm />)

    expect(
      screen.getByLabelText('비밀번호 재설정용 이메일 주소')
    ).toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveTextContent('재설정 링크 보내기 →')
  })

  it('빈 이메일 제출 → Zod 에러', () => {
    render(<PasswordResetRequestForm />)

    fireEvent.submit(screen.getByRole('button').closest('form')!)

    expect(screen.getByText('이메일을 입력해주세요')).toBeInTheDocument()
  })

  it('유효 이메일 → 에러 초기화', () => {
    render(<PasswordResetRequestForm />)
    const form = screen.getByRole('button').closest('form')!

    // 에러 발생
    fireEvent.submit(form)
    expect(screen.getByText('이메일을 입력해주세요')).toBeInTheDocument()

    // 유효 이메일 입력
    fireEvent.change(screen.getByLabelText('비밀번호 재설정용 이메일 주소'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.submit(form)

    expect(screen.queryByText('이메일을 입력해주세요')).toBeNull()
  })
})

// ─── UpdatePasswordForm ───

describe('UpdatePasswordForm', () => {
  it('비밀번호 필드 + 변경 버튼 렌더링', () => {
    render(<UpdatePasswordForm />)

    expect(screen.getByLabelText('새 비밀번호')).toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveTextContent('비밀번호 변경 →')
  })

  it('빈 비밀번호 제출 → Zod 에러', () => {
    render(<UpdatePasswordForm />)

    fireEvent.submit(screen.getByRole('button').closest('form')!)

    expect(screen.getByText('비밀번호를 입력해주세요')).toBeInTheDocument()
  })

  it('짧은 비밀번호 → 8자 미만 에러', () => {
    render(<UpdatePasswordForm />)

    fireEvent.change(screen.getByLabelText('새 비밀번호'), {
      target: { value: 'short' },
    })

    fireEvent.submit(screen.getByRole('button').closest('form')!)

    expect(
      screen.getByText('비밀번호는 8자 이상이어야 합니다')
    ).toBeInTheDocument()
  })

  it('유효 비밀번호 → 에러 초기화', () => {
    render(<UpdatePasswordForm />)
    const form = screen.getByRole('button').closest('form')!

    // 에러 발생
    fireEvent.submit(form)
    expect(screen.getByText('비밀번호를 입력해주세요')).toBeInTheDocument()

    // 유효 입력
    fireEvent.change(screen.getByLabelText('새 비밀번호'), {
      target: { value: 'newpassword123' },
    })
    fireEvent.submit(form)

    expect(screen.queryByText('비밀번호를 입력해주세요')).toBeNull()
    expect(screen.queryByText('비밀번호는 8자 이상이어야 합니다')).toBeNull()
  })
})

// ─── GoogleAuthButton ───

describe('GoogleAuthButton', () => {
  it('Google 로그인 버튼 렌더링', () => {
    render(<GoogleAuthButton />)

    expect(screen.getByRole('button', { name: /Google/ })).toBeInTheDocument()
    expect(screen.getByText('Google로 계속하기')).toBeInTheDocument()
  })

  it('클릭 → signInWithOAuth 호출', async () => {
    render(<GoogleAuthButton />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Google/ }))
    })

    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: expect.stringContaining('/auth/callback'),
      },
    })
  })

  it('OAuth 에러 → 에러 메시지 표시 + 버튼 다시 활성화', async () => {
    mockSignInWithOAuth.mockResolvedValue({
      error: { message: 'OAuth error' },
    })

    render(<GoogleAuthButton />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Google/ }))
    })

    // error → 에러 메시지 표시 + 버튼 활성화
    expect(
      screen.getByText('Google 로그인에 실패했습니다. 다시 시도해주세요.')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Google/ })).not.toBeDisabled()
    expect(screen.getByText('Google로 계속하기')).toBeInTheDocument()
  })
})
