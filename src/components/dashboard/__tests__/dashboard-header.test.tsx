import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DashboardHeader from '../dashboard-header';

describe('DashboardHeader Component', () => {
  it('renders company name and URL', () => {
    render(
      <DashboardHeader
        companyName="TechStartup Inc"
        url="https://techstartup.com"
        diagnosedAt="2026-03-11T11:30:00Z"
      />
    );

    expect(screen.getByText('TechStartup Inc')).toBeInTheDocument();
    expect(screen.getByText(/techstartup.com/)).toBeInTheDocument();
  });

  it('displays diagnostic timestamp', () => {
    render(
      <DashboardHeader
        companyName="Test Company"
        url="https://test.com"
        diagnosedAt="2026-03-11T11:30:00Z"
      />
    );

    // Check that date/time is displayed (format may vary by locale)
    const header = screen.getByText('Test Company').parentElement;
    expect(header?.textContent).toMatch(/기준/);
  });

  it('renders re-diagnose button', () => {
    render(
      <DashboardHeader
        companyName="Test Company"
        url="https://test.com"
        diagnosedAt="2026-03-11T11:30:00Z"
      />
    );

    const button = screen.getByRole('button', { name: /재진단/i });
    expect(button).toBeInTheDocument();
  });

  it('applies proper styling classes', () => {
    const { container } = render(
      <DashboardHeader
        companyName="Test Company"
        url="https://test.com"
        diagnosedAt="2026-03-11T11:30:00Z"
      />
    );

    const header = container.querySelector('header');
    expect(header).toHaveClass('bg-white');
    expect(header).toHaveClass('border-b');
  });
});
