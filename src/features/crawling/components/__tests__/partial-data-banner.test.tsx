import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PartialDataBanner } from '../partial-data-banner'

describe('PartialDataBanner', () => {
  it('should render warning message', () => {
    render(<PartialDataBanner />)

    expect(screen.getByText('일부 항목이 제한되었습니다')).toBeInTheDocument()
  })

  it('should have role="alert" for accessibility', () => {
    render(<PartialDataBanner />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('should display blocked reason when provided', () => {
    render(<PartialDataBanner blockedReason="robots.txt denied" />)

    expect(screen.getByText(/사유: robots\.txt denied/)).toBeInTheDocument()
  })

  it('should not display reason prefix when blockedReason is undefined', () => {
    render(<PartialDataBanner />)

    expect(screen.queryByText(/사유:/)).not.toBeInTheDocument()
  })

  it('should mention GSC integration as Phase 2', () => {
    render(<PartialDataBanner />)

    expect(screen.getByText(/Google Search Console/)).toBeInTheDocument()
    expect(screen.getByText(/Phase 2 예정/)).toBeInTheDocument()
  })

  it('should explain that only API/security data is included', () => {
    render(<PartialDataBanner />)

    expect(
      screen.getByText(/Google API 및 보안 검사 결과만 포함/)
    ).toBeInTheDocument()
  })
})
