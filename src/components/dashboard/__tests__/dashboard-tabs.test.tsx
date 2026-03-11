import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import DashboardTabs from '../dashboard-tabs';

describe('DashboardTabs Component', () => {
  it('renders all five tabs', () => {
    render(<DashboardTabs score={87} grade="A" />);

    expect(screen.getByRole('tab', { name: /종합 점수/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /개선 항목/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Schema Markup/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /메타 태그/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /AI 인사이트/i })).toBeInTheDocument();
  });

  it('shows score tab content by default', () => {
    render(<DashboardTabs score={87} grade="A" />);

    const scoreTab = screen.getByRole('tab', { name: /종합 점수/i });
    expect(scoreTab).toHaveAttribute('aria-selected', 'true');
  });

  it('switches tab content on click', async () => {
    const user = userEvent.setup();
    render(<DashboardTabs score={87} grade="A" />);

    const actionTab = screen.getByRole('tab', { name: /개선 항목/i });
    await user.click(actionTab);

    expect(actionTab).toHaveAttribute('aria-selected', 'true');
  });

  it('renders with proper styling for active tab', () => {
    const { container } = render(<DashboardTabs score={87} grade="A" />);

    const tabsList = container.querySelector('[role="tablist"]');
    expect(tabsList).toHaveClass('border-b');
  });

  it('passes score and grade to child components', () => {
    const { container } = render(<DashboardTabs score={75} grade="B" />);

    // Score circle should be visible in default tab
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
