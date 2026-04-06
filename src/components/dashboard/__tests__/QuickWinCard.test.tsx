import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  render,
  screen,
  fireEvent,
  waitFor,
  createEvent,
} from '@testing-library/react'
import { QuickWinCard } from '../QuickWinCard'
import type { QuickWin } from '@/features/diagnosis-free/types'

const mockQuickWin: QuickWin = {
  ruleId: 'meta-description-missing',
  ruleName: '메타 설명 누락',
  category: 'content',
  severity: 'warning',
  message: '홈페이지에 meta description 태그가 없습니다',
  impact: 7,
  source: 'rule',
  difficulty: 'easy',
}

describe('QuickWinCard', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should not render self-report button when canSelfReport is false', () => {
    render(<QuickWinCard quickWin={mockQuickWin} diagnosisId="d1" />)
    expect(
      screen.queryByRole('button', { name: /고쳤다고 표시/ })
    ).not.toBeInTheDocument()
  })

  it('should render self-report button when canSelfReport is true', () => {
    render(
      <QuickWinCard quickWin={mockQuickWin} diagnosisId="d1" canSelfReport />
    )
    expect(
      screen.getByRole('button', { name: /고쳤다고 표시/ })
    ).toBeInTheDocument()
  })

  it('should POST ruleId and diagnosisId to /api/self-report on click', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)

    render(
      <QuickWinCard
        quickWin={mockQuickWin}
        diagnosisId="diag-abc"
        canSelfReport
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /고쳤다고 표시/ }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/self-report',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })
    const firstCall = fetchMock.mock.calls[0]!
    const callBody = JSON.parse(firstCall[1].body as string)
    expect(callBody).toEqual({
      diagnosisId: 'diag-abc',
      ruleId: 'meta-description-missing',
    })
  })

  it('should show "확인했어요" badge after successful submit', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    )

    render(
      <QuickWinCard quickWin={mockQuickWin} diagnosisId="d1" canSelfReport />
    )
    fireEvent.click(screen.getByRole('button', { name: /고쳤다고 표시/ }))

    await waitFor(() => {
      expect(screen.getByText(/확인했어요/)).toBeInTheDocument()
    })
    expect(
      screen.queryByRole('button', { name: /고쳤다고 표시/ })
    ).not.toBeInTheDocument()
  })

  it('should show error message when fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) })
    )

    render(
      <QuickWinCard quickWin={mockQuickWin} diagnosisId="d1" canSelfReport />
    )
    fireEvent.click(screen.getByRole('button', { name: /고쳤다고 표시/ }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/기록에 실패/)
    })
  })

  it('should prevent Link navigation when self-report button is clicked', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    )

    render(
      <QuickWinCard quickWin={mockQuickWin} diagnosisId="d1" canSelfReport />
    )
    const button = screen.getByRole('button', { name: /고쳤다고 표시/ })
    const clickEvent = createEvent.click(button)
    fireEvent(button, clickEvent)
    expect(clickEvent.defaultPrevented).toBe(true)
    // 상태 업데이트 완료 대기 (act warning 방지)
    await waitFor(() => {
      expect(screen.getByText(/확인했어요/)).toBeInTheDocument()
    })
  })
})
