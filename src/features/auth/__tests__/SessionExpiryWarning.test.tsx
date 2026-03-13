import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { SessionExpiryWarning } from '../components/SessionExpiryWarning'

// ─── Mocks ───

const mockPush = vi.fn()
const mockRouter = { push: mockPush }
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}))

let authChangeCallback: (
  event: string,
  session: { expires_at?: number } | null
) => void
const mockUnsubscribe = vi.fn()
const mockGetSession = vi.fn()
const mockRefreshSession = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      onAuthStateChange: vi.fn(
        (
          cb: (event: string, session: { expires_at?: number } | null) => void
        ) => {
          authChangeCallback = cb
          return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
        }
      ),
      getSession: mockGetSession,
      refreshSession: mockRefreshSession,
    },
  }),
}))

// ─── Button 모킹 (base-ui jsdom 호환) ───

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

// ─── Setup ───

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  mockGetSession.mockResolvedValue({ data: { session: null } })
})

afterEach(() => {
  vi.useRealTimers()
})

// ─── Tests ───

describe('SessionExpiryWarning', () => {
  it('세션 없으면 아무것도 렌더링하지 않음', async () => {
    const { container } = render(<SessionExpiryWarning />)

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(container.querySelector('[role="alert"]')).toBeNull()
  })

  it('세션 만료 5분 전 → 경고 배너 표시', async () => {
    render(<SessionExpiryWarning />)

    // onAuthStateChange 콜백으로 세션 전달
    // 만료 시간: 현재 + 3분 (5분 이내이므로 즉시 경고)
    const threeMinutesFromNow = Math.floor(Date.now() / 1000) + 180

    await act(async () => {
      authChangeCallback('SIGNED_IN', { expires_at: threeMinutesFromNow })
    })

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/세션이 곧 만료됩니다/)).toBeInTheDocument()
  })

  it('만료 시간 충분하면 경고 안 보임 → 시간 지나면 경고 표시', async () => {
    render(<SessionExpiryWarning />)

    // 만료 시간: 현재 + 10분
    const tenMinutesFromNow = Math.floor(Date.now() / 1000) + 600

    await act(async () => {
      authChangeCallback('SIGNED_IN', { expires_at: tenMinutesFromNow })
    })

    // 아직 5분 이상 남음 → 경고 없음
    expect(screen.queryByRole('alert')).toBeNull()

    // 5분 1초 경과 → 경고 타이머 발동 (남은 시간 4분 59초)
    await act(async () => {
      vi.advanceTimersByTime(5 * 60 * 1000 + 1000)
    })

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('"계속 사용" 클릭 → refreshSession 호출 + 경고 숨김', async () => {
    const newExpiry = Math.floor(Date.now() / 1000) + 3600
    mockRefreshSession.mockResolvedValue({
      data: { session: { expires_at: newExpiry } },
      error: null,
    })

    render(<SessionExpiryWarning />)

    // 3분 후 만료 → 즉시 경고
    const threeMinutesFromNow = Math.floor(Date.now() / 1000) + 180
    await act(async () => {
      authChangeCallback('SIGNED_IN', { expires_at: threeMinutesFromNow })
    })

    expect(screen.getByRole('alert')).toBeInTheDocument()

    // "계속 사용 →" 버튼 클릭 + 비동기 flush
    await act(async () => {
      fireEvent.click(screen.getByText('계속 사용 →'))
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(mockRefreshSession).toHaveBeenCalled()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('세션 갱신 실패 → /login으로 이동', async () => {
    mockRefreshSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'Refresh failed' },
    })

    render(<SessionExpiryWarning />)

    const threeMinutesFromNow = Math.floor(Date.now() / 1000) + 180
    await act(async () => {
      authChangeCallback('SIGNED_IN', { expires_at: threeMinutesFromNow })
    })

    await act(async () => {
      fireEvent.click(screen.getByText('계속 사용 →'))
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  it('세션 만료 → /login으로 자동 이동', async () => {
    render(<SessionExpiryWarning />)

    // 만료 시간: 현재 + 10초 (곧 만료)
    const tenSecondsFromNow = Math.floor(Date.now() / 1000) + 10

    await act(async () => {
      authChangeCallback('SIGNED_IN', { expires_at: tenSecondsFromNow })
    })

    // 10초 경과 → 만료
    await act(async () => {
      await vi.advanceTimersByTimeAsync(11000)
    })

    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  it('로그아웃 시 타이머 정리 + 경고 숨김', async () => {
    render(<SessionExpiryWarning />)

    // 세션 있음 → 경고 표시 상태
    const threeMinutesFromNow = Math.floor(Date.now() / 1000) + 180
    await act(async () => {
      authChangeCallback('SIGNED_IN', { expires_at: threeMinutesFromNow })
    })

    expect(screen.getByRole('alert')).toBeInTheDocument()

    // 로그아웃 (세션 null)
    await act(async () => {
      authChangeCallback('SIGNED_OUT', null)
    })

    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('컴포넌트 언마운트 시 subscription 해제', () => {
    const { unmount } = render(<SessionExpiryWarning />)
    unmount()

    expect(mockUnsubscribe).toHaveBeenCalled()
  })
})
