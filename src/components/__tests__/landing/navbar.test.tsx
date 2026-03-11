import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Navbar from '@/components/landing/navbar';

describe('Navbar', () => {
  it('should render Findably logo/brand', () => {
    render(<Navbar />);
    expect(screen.getByText('Findably')).toBeInTheDocument();
  });

  it('should render nav links in center', () => {
    render(<Navbar />);
    expect(screen.getByText('기능')).toBeInTheDocument();
    expect(screen.getByText('가격')).toBeInTheDocument();
    expect(screen.getByText('FAQ')).toBeInTheDocument();
  });

  it('should render CTA button on right', () => {
    render(<Navbar />);
    expect(screen.getByText(/무료로 시작하기/)).toBeInTheDocument();
  });

  it('should be sticky positioned with backdrop blur', () => {
    render(<Navbar />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('sticky', 'top-0');
  });

  it('should have backdrop blur styling', () => {
    render(<Navbar />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('backdrop-blur-sm', 'bg-white/80');
  });

  it('should have proper shadow on navbar', () => {
    render(<Navbar />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('shadow-sm');
  });

  it('should have z-index for stacking', () => {
    render(<Navbar />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('z-50');
  });

  it('should render links with correct href attributes', () => {
    render(<Navbar />);
    const signupButton = screen.getByText(/무료로 시작하기/).closest('a');
    expect(signupButton).toHaveAttribute('href', '/signup');
  });
});
