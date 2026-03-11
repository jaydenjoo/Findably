import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import FeaturesSection from '../features-section';

describe('FeaturesSection', () => {
  it('should render section with correct title', () => {
    render(<FeaturesSection />);
    expect(screen.getByText('왜 Findably인가요?')).toBeInTheDocument();
  });

  it('should render section subtitle', () => {
    render(<FeaturesSection />);
    expect(
      screen.getByText(/AI 기반 마케팅 진단으로/)
    ).toBeInTheDocument();
  });

  it('should render large featured card with brand color', () => {
    render(<FeaturesSection />);
    expect(screen.getByText('AI 기반 마케팅 진단')).toBeInTheDocument();
    expect(
      screen.getByText(/AI가 웹사이트를 분석/)
    ).toBeInTheDocument();
  });

  it('should render two smaller feature cards', () => {
    render(<FeaturesSection />);
    expect(screen.getByText('Schema Markup 자동 생성')).toBeInTheDocument();
    expect(screen.getByText('실시간 모니터링')).toBeInTheDocument();
  });

  it('should render correct descriptions for each feature', () => {
    render(<FeaturesSection />);
    expect(
      screen.getByText(/검색엔진이 이해하는 구조화 데이터/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/검색 순위와 AI 인용 변화를/)
    ).toBeInTheDocument();
  });

  it('should have animation delay classes for staggered entrance', () => {
    const { container } = render(<FeaturesSection />);
    const animatedElements = container.querySelectorAll('.animate-fade-in');
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it('should have background alternation classes', () => {
    const { container } = render(<FeaturesSection />);
    const section = container.querySelector('section');
    expect(section).toHaveClass('bg-white');
  });

  it('should render icons in circular backgrounds', () => {
    const { container } = render(<FeaturesSection />);
    // Check for icon circles with bg-blue-50 or white/20
    const iconCircles = container.querySelectorAll('[class*="bg-"][class*="rounded-full"]');
    expect(iconCircles.length).toBeGreaterThanOrEqual(3);
  });

  it('should have responsive grid classes', () => {
    const { container } = render(<FeaturesSection />);
    const gridContainer = container.querySelector('[class*="grid"]');
    expect(gridContainer).toHaveClass('lg:grid-cols-3');
  });

  it('should have hover effects on cards', () => {
    const { container } = render(<FeaturesSection />);
    const cards = container.querySelectorAll('[class*="hover:"]');
    expect(cards.length).toBeGreaterThan(0);
  });
});
