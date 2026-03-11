import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Landing Page (Home)', () => {
  it('should render landing page', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('should render navbar component', () => {
    render(<Home />);
    expect(screen.getByText('Findably')).toBeInTheDocument();
  });

  it('should render hero section', () => {
    render(<Home />);
    expect(screen.getByText('AI 마케팅 자동화 플랫폼')).toBeInTheDocument();
  });

  it('should have background with dot pattern or blob', () => {
    render(<Home />);
    const main = screen.getByRole('main');
    expect(main).toHaveClass('bg-gradient-to-b');
  });

  it('should render with proper semantic HTML structure', () => {
    render(<Home />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('should have animations on hero elements', () => {
    render(<Home />);
    // The entire page should have elements with animation classes
    const animatedElements = document.querySelectorAll('[class*="animate"]');
    expect(animatedElements.length).toBeGreaterThan(0);
  });
});
