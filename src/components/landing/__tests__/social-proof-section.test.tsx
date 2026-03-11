import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SocialProofSection from '../social-proof-section';

describe('SocialProofSection', () => {
  it('should render section with trust metrics', () => {
    render(<SocialProofSection />);
    expect(screen.getByText('500+')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('32%')).toBeInTheDocument();
    expect(screen.getByText('3분')).toBeInTheDocument();
  });

  it('should render metric labels', () => {
    render(<SocialProofSection />);
    expect(screen.getByText(/기업이 사용 중/)).toBeInTheDocument();
    expect(screen.getByText(/사용자 만족도/)).toBeInTheDocument();
    expect(screen.getByText(/검색 노출 개선/)).toBeInTheDocument();
    expect(screen.getByText(/진단 완료/)).toBeInTheDocument();
  });

  it('should have white background section alternation', () => {
    const { container } = render(<SocialProofSection />);
    const section = container.querySelector('section');
    expect(section).toHaveClass('bg-white');
  });

  it('should display numbers with large font size and brand color', () => {
    const { container } = render(<SocialProofSection />);
    const numbers = container.querySelectorAll('[class*="text-3xl"], [class*="text-4xl"]');
    expect(numbers.length).toBeGreaterThan(0);
  });

  it('should have animation delay for staggered entrance', () => {
    const { container } = render(<SocialProofSection />);
    const animatedElements = container.querySelectorAll('.animate-fade-in');
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it('should display metrics in a horizontal layout', () => {
    const { container } = render(<SocialProofSection />);
    const gridContainer = container.querySelector('[class*="grid"]');
    expect(gridContainer).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-4');
  });

  it('should use brand color for metric numbers', () => {
    const { container } = render(<SocialProofSection />);
    const brandColorElements = container.querySelectorAll('[class*="text-blue"]');
    expect(brandColorElements.length).toBeGreaterThan(0);
  });

  it('should be responsive on mobile (1 col) and tablet (2 col)', () => {
    const { container } = render(<SocialProofSection />);
    const grid = container.querySelector('[class*="grid"]');
    expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2');
  });

  it('should render gray-500 labels for accessibility', () => {
    const { container } = render(<SocialProofSection />);
    const labels = container.querySelectorAll('.text-gray-500, .text-gray-600');
    expect(labels.length).toBeGreaterThanOrEqual(4);
  });
});
