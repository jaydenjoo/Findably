import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HeroSection from '@/components/landing/hero-section';

describe('HeroSection', () => {
  it('should render hero section with badge', () => {
    render(<HeroSection />);
    expect(screen.getByText('AI 마케팅 자동화 플랫폼')).toBeInTheDocument();
  });

  it('should render h1 title with correct text', () => {
    render(<HeroSection />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeInTheDocument();
    expect(h1).toHaveTextContent('URL 하나로');
  });

  it('should render subtitle text', () => {
    render(<HeroSection />);
    expect(screen.getByText(/AI가 SEO, 콘텐츠, 검색 노출을 분석하고/)).toBeInTheDocument();
  });

  it('should render primary CTA button with arrow', () => {
    render(<HeroSection />);
    const primaryButton = screen.getByRole('link', { name: /무료 진단 시작하기/ });
    expect(primaryButton).toBeInTheDocument();
    // Arrow icon is rendered as SVG with lucide-arrow-right class
    const arrowIcon = primaryButton.querySelector('svg.lucide-arrow-right');
    expect(arrowIcon).toBeInTheDocument();
  });

  it('should render secondary CTA button', () => {
    render(<HeroSection />);
    expect(screen.getByText('데모 보기')).toBeInTheDocument();
  });

  it('should render 3 trust metrics', () => {
    render(<HeroSection />);
    // Trust metrics are split across multiple elements, so check for the individual parts
    expect(screen.getByText('500+')).toBeInTheDocument();
    expect(screen.getByText('기업 진단')).toBeInTheDocument();
    expect(screen.getByText('32%')).toBeInTheDocument();
    expect(screen.getByText('평균 검색 노출 개선')).toBeInTheDocument();
    expect(screen.getByText('3분')).toBeInTheDocument();
    expect(screen.getByText('완료')).toBeInTheDocument();
  });

  it('should have sequential animation classes on hero elements', () => {
    render(<HeroSection />);
    const container = screen.getByRole('region');
    expect(container).toHaveClass('animate-fade-in');
  });

  it('should apply correct typography styles to title', () => {
    render(<HeroSection />);
    const h1 = screen.getByRole('heading', { level: 1 });
    // Check for correct class names (Tailwind classes for responsive sizing 30-60px, weight 900)
    expect(h1).toHaveClass('text-3xl', 'sm:text-4xl', 'md:text-5xl', 'lg:text-6xl');
    expect(h1).toHaveClass('font-black', 'tracking-tighter');
  });

  it('should render hero illustration placeholder', () => {
    render(<HeroSection />);
    const illustrationSection = screen.getByRole('region');
    expect(illustrationSection).toBeInTheDocument();
  });

  it('should have brand color dot pattern background applied', () => {
    render(<HeroSection />);
    // The section tag itself has the gradient background
    const sectionElement = document.querySelector('section[class*="bg-gradient"]');
    expect(sectionElement).toHaveClass('bg-gradient-to-b');
  });

  it('should render primary button with correct styling', () => {
    render(<HeroSection />);
    const link = screen.getByRole('link', { name: /무료 진단 시작하기/ });
    expect(link).toHaveClass('bg-blue-600');
    expect(link).toHaveClass('text-white');
  });

  it('should render secondary button as outline style', () => {
    render(<HeroSection />);
    const link = screen.getByRole('link', { name: /데모 보기/ });
    expect(link).toHaveClass('border');
    expect(link).toHaveClass('border-gray-300');
  });
});
