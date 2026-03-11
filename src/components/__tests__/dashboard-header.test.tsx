import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardHeader } from '@/components/dashboard-header';

describe('DashboardHeader', () => {
  const mockUser = {
    id: '123',
    email: 'test@example.com',
    user_metadata: {
      name: 'Test User',
    },
  };

  it('renders logo with correct text', () => {
    render(<DashboardHeader user={mockUser} />);
    const logo = screen.getByText('Findably');
    expect(logo).toBeInTheDocument();
  });

  it('renders user email in dropdown trigger', () => {
    render(<DashboardHeader user={mockUser} />);
    // The email should be in the dropdown button (first visible instance)
    const emailElements = screen.getAllByText('test@example.com');
    expect(emailElements.length).toBeGreaterThan(0);
  });

  it('displays user initials in avatar', () => {
    const { container } = render(<DashboardHeader user={mockUser} />);
    // Avatar should show first letter of email as avatar fallback
    const avatarFallback = container.querySelector('[data-slot="avatar-fallback"]');
    expect(avatarFallback).toHaveTextContent('T');
  });

  it('renders navigation links in header', () => {
    render(<DashboardHeader user={mockUser} />);
    const dashboardLink = screen.getByText('대시보드');
    expect(dashboardLink).toBeInTheDocument();
  });

  it('applies correct styling to header', () => {
    const { container } = render(<DashboardHeader user={mockUser} />);
    const header = container.querySelector('header');
    expect(header).toHaveClass('sticky');
    expect(header).toHaveClass('top-0');
    expect(header).toHaveClass('bg-white');
  });

  it('renders with proper structure', () => {
    const { container } = render(<DashboardHeader user={mockUser} />);
    const header = container.querySelector('header');
    expect(header).toBeTruthy();

    // Check that logo link exists
    const logoLink = container.querySelector('a[href="/dashboard"]');
    expect(logoLink).toBeTruthy();
  });

  it('renders dropdown menu component', () => {
    const { container } = render(<DashboardHeader user={mockUser} />);
    // Check that button exists for dropdown trigger
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
