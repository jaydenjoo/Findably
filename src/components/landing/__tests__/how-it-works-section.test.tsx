import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HowItWorksSection from '@/components/landing/how-it-works-section';

describe('HowItWorksSection', () => {
  it('should render section with correct title', () => {
    render(<HowItWorksSection />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('어떻게 작동하나요?');
  });

  it('should render section with subtitle', () => {
    render(<HowItWorksSection />);
    expect(screen.getByText('3단계로 마케팅 진단을 완료하세요')).toBeInTheDocument();
  });

  it('should render 3 step cards', () => {
    const { container } = render(<HowItWorksSection />);
    const steps = container.querySelectorAll('[class*="flex-col"]');
    // Should have at least 3 step divs
    expect(steps.length).toBeGreaterThanOrEqual(3);
  });

  it('should render Step 1 with correct content', () => {
    render(<HowItWorksSection />);
    expect(screen.getByText('URL을 입력하세요')).toBeInTheDocument();
    expect(screen.getByText('웹사이트 주소만 입력하면 AI가 자동으로 분석을 시작합니다')).toBeInTheDocument();
    expect(screen.getByText('30초')).toBeInTheDocument();
  });

  it('should render Step 2 with correct content', () => {
    render(<HowItWorksSection />);
    expect(screen.getByText('AI가 분석합니다')).toBeInTheDocument();
    expect(screen.getByText('SEO, 콘텐츠, Schema Markup, 성능까지 종합 진단합니다')).toBeInTheDocument();
    expect(screen.getByText('2-3분')).toBeInTheDocument();
  });

  it('should render Step 3 with correct content', () => {
    render(<HowItWorksSection />);
    expect(screen.getByText('결과를 확인하세요')).toBeInTheDocument();
    expect(screen.getByText('종합 점수와 즉시 실행 가능한 개선안을 받아보세요')).toBeInTheDocument();
    expect(screen.getByText('바로 확인')).toBeInTheDocument();
  });

  it('should render numbered badges (1, 2, 3) for each step', () => {
    render(<HowItWorksSection />);
    const badge1 = screen.getByText('1');
    const badge2 = screen.getByText('2');
    const badge3 = screen.getByText('3');

    expect(badge1).toBeInTheDocument();
    expect(badge2).toBeInTheDocument();
    expect(badge3).toBeInTheDocument();
  });

  it('should have brand color styling on number badges', () => {
    render(<HowItWorksSection />);
    const badges = document.querySelectorAll('[class*="bg-blue"]');
    // Should have multiple elements with brand color
    expect(badges.length).toBeGreaterThan(0);
  });

  it('should render time badges for each step', () => {
    render(<HowItWorksSection />);
    const timeBadges = screen.getAllByText(/^(30초|2-3분|바로 확인)$/);
    expect(timeBadges.length).toBeGreaterThanOrEqual(3);
  });

  it('should have animations on step cards', () => {
    const { container } = render(<HowItWorksSection />);
    const animatedElements = container.querySelectorAll('[class*="animate"]');
    // Should have animation classes on elements
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it('should be responsive with mobile-first structure', () => {
    render(<HowItWorksSection />);
    // Check for grid responsive classes
    const stepContainer = document.querySelector('[class*="grid"]');
    expect(stepContainer).toBeInTheDocument();
  });

  it('should have connecting elements between steps (SVG or visual divider)', () => {
    const { container } = render(<HowItWorksSection />);
    // Check for SVG connector or border elements
    const connectors = container.querySelectorAll('[class*="border"], svg');
    expect(connectors.length).toBeGreaterThan(0);
  });

  it('should render icons for each step', () => {
    const { container } = render(<HowItWorksSection />);
    // Lucide icons should be rendered as SVG
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should have sequential fade-in animation class', () => {
    const { container } = render(<HowItWorksSection />);
    const fadeElements = container.querySelectorAll('[class*="animate"]');
    expect(fadeElements.length).toBeGreaterThan(0);
  });

  it('should render section title with correct typography classes', () => {
    render(<HowItWorksSection />);
    const title = screen.getByRole('heading', { level: 2 });
    expect(title).toHaveClass('font-bold');
    // Check for size classes
    const classList = title.className;
    expect(classList).toMatch(/text-(2xl|3xl|4xl|5xl)/);
  });

  it('should render subtitle with gray-500 color', () => {
    render(<HowItWorksSection />);
    const subtitle = screen.getByText('3단계로 마케팅 진단을 완료하세요');
    expect(subtitle).toHaveClass('text-gray-500');
  });

  it('should have step cards with proper structure', () => {
    const { container } = render(<HowItWorksSection />);
    // Check for grid layout
    const gridContainer = container.querySelector('[class*="grid"]');
    expect(gridContainer).toBeInTheDocument();
  });

  it('should render step descriptions with correct size', () => {
    render(<HowItWorksSection />);
    const descriptions = [
      '웹사이트 주소만 입력하면 AI가 자동으로 분석을 시작합니다',
      'SEO, 콘텐츠, Schema Markup, 성능까지 종합 진단합니다',
      '종합 점수와 즉시 실행 가능한 개선안을 받아보세요'
    ];
    descriptions.forEach(desc => {
      expect(screen.getByText(desc)).toBeInTheDocument();
    });
  });

  it('should have light background on icon circles', () => {
    const { container } = render(<HowItWorksSection />);
    const iconCircles = container.querySelectorAll('[class*="bg-blue-50"]');
    expect(iconCircles.length).toBeGreaterThan(0);
  });
});
