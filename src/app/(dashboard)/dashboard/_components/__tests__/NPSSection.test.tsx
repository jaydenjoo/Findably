import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NPSSection } from '../NPSSection'

describe('NPSSection', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should render 11 score buttons from 0 to 10', () => {
    render(<NPSSection diagnosisId="test-id" />)
    const buttons = screen.getAllByRole('radio')
    expect(buttons).toHaveLength(11)
    expect(screen.getByRole('radio', { name: '0점' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '10점' })).toBeInTheDocument()
  })

  it('should disable submit button until a score is selected', () => {
    render(<NPSSection diagnosisId="test-id" />)
    const submit = screen.getByRole('button', { name: /의견 보내기/ })
    expect(submit).toBeDisabled()

    fireEvent.click(screen.getByRole('radio', { name: '9점' }))
    expect(submit).toBeEnabled()
  })

  it('should POST selected score and diagnosisId to /api/nps', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)

    render(<NPSSection diagnosisId="diag-42" />)
    fireEvent.click(screen.getByRole('radio', { name: '8점' }))
    fireEvent.click(screen.getByRole('button', { name: /의견 보내기/ }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/nps',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })
    const firstCall = fetchMock.mock.calls[0]!
    const callBody = JSON.parse(firstCall[1].body as string)
    expect(callBody).toEqual({ diagnosisId: 'diag-42', score: 8 })
  })

  it('should show success message after successful submit', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    )

    render(<NPSSection diagnosisId="diag-1" />)
    fireEvent.click(screen.getByRole('radio', { name: '10점' }))
    fireEvent.click(screen.getByRole('button', { name: /의견 보내기/ }))

    await waitFor(() => {
      expect(screen.getByText(/소중한 의견 감사합니다/)).toBeInTheDocument()
    })
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  })

  it('should show error message when fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) })
    )

    render(<NPSSection diagnosisId="diag-1" />)
    fireEvent.click(screen.getByRole('radio', { name: '3점' }))
    fireEvent.click(screen.getByRole('button', { name: /의견 보내기/ }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/제출에 실패/)
    })
  })

  it('should include comment in request body when provided', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)

    render(<NPSSection diagnosisId="diag-1" />)
    fireEvent.click(screen.getByRole('radio', { name: '7점' }))
    fireEvent.change(screen.getByLabelText(/의견/), {
      target: { value: '정말 유익했어요' },
    })
    fireEvent.click(screen.getByRole('button', { name: /의견 보내기/ }))

    await waitFor(() => {
      const firstCall = fetchMock.mock.calls[0]!
      const callBody = JSON.parse(firstCall[1].body as string)
      expect(callBody.comment).toBe('정말 유익했어요')
    })
  })
})
