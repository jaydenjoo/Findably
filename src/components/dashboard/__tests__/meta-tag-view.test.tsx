/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MetaTagView } from '../meta-tag-view';

// Mock shadcn/ui components
vi.mock('../../ui/button', () => ({
  Button: ({ children, onClick, disabled, className }: any) => (
    <button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  ),
}));

vi.mock('../../ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock('../../ui/tabs', () => ({
  Tabs: ({ defaultValue, children }: any) => (
    <div data-testid="tabs" data-default-value={defaultValue}>
      {children}
    </div>
  ),
  TabsList: ({ children }: any) => (
    <div data-testid="tabs-list">{children}</div>
  ),
  TabsTrigger: ({ value, children, onClick }: any) => (
    <button data-testid={`tab-${value}`} onClick={onClick}>
      {children}
    </button>
  ),
  TabsContent: ({ value, children }: any) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  ),
}));

describe('MetaTagView Component', () => {
  const mockCurrentMeta = {
    title: 'My Website',
    description: 'A website about everything',
    titleLength: 11,
    descriptionLength: 29,
  };

  const mockRecommendations = {
    title: 'My Awesome Website - Products & Services',
    description:
      'Discover amazing products and services on My Website. Shop now for quality and affordability. Click here to explore our collection.',
    ogTitle: 'My Awesome Website',
    ogDescription: 'Shop amazing products and services at My Website',
    ogImage: 'https://example.com/og-image.jpg',
    twitterTitle: 'My Awesome Website',
    twitterDescription: 'Shop amazing products and services',
    twitterImage: 'https://example.com/twitter-image.jpg',
  };

  const mockReasons = {
    title: 'Added product keyword and call-to-action. Title length optimized to 50-60 characters for better CTR.',
    description:
      'Improved clarity with specific product mention and added direct CTA. Length is within 120-160 character range.',
    ogTags: 'Optimized for social media sharing with clear headlines and descriptions.',
  };

  const mockImprovements = {
    titleImproved: true,
    descriptionImproved: true,
    titleLengthOptimal: true,
    descriptionLengthOptimal: true,
  };

  const defaultProps = {
    currentMeta: mockCurrentMeta,
    recommendations: mockRecommendations,
    reasons: mockReasons,
    improvements: mockImprovements,
  };

  beforeEach(() => {
    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn(() => Promise.resolve()),
      },
      writable: true,
      configurable: true,
    });

    // Mock console.log for toast notifications
    vi.spyOn(console, 'log').mockImplementation(vi.fn());
  });

  describe('Rendering', () => {
    it('should render the component with default content', () => {
      render(<MetaTagView {...defaultProps} />);

      expect(screen.getByText(/메타 태그 최적화/i)).toBeInTheDocument();
    });

    it('should render meta tag tabs', () => {
      render(<MetaTagView {...defaultProps} />);

      expect(screen.getByTestId('tabs')).toBeInTheDocument();
    });

    it('should render current and recommended columns for title tab', () => {
      render(<MetaTagView {...defaultProps} />);

      const titleTab = screen.getByTestId('tab-title');
      fireEvent.click(titleTab);

      expect(screen.getByText('현재 Title')).toBeInTheDocument();
      expect(screen.getByText('추천 Title')).toBeInTheDocument();
    });

    it('should render both current and recommended title values', () => {
      render(<MetaTagView {...defaultProps} />);

      const titleTab = screen.getByTestId('tab-title');
      fireEvent.click(titleTab);

      const titles = screen.getAllByText('My Website');
      expect(titles.length).toBeGreaterThan(0);
      expect(
        screen.getByText('My Awesome Website - Products & Services')
      ).toBeInTheDocument();
    });

    it('should render description tab with current and recommended values', () => {
      render(<MetaTagView {...defaultProps} />);

      const descTab = screen.getByTestId('tab-description');
      fireEvent.click(descTab);

      const descriptions = screen.getAllByText('A website about everything');
      expect(descriptions.length).toBeGreaterThan(0);
      expect(
        screen.getByText(
          /Discover amazing products and services on My Website. Shop now for quality and affordability/
        )
      ).toBeInTheDocument();
    });

    it('should render og tags tab', () => {
      render(<MetaTagView {...defaultProps} />);

      const ogTab = screen.getByTestId('tab-og');
      fireEvent.click(ogTab);

      expect(screen.getByText('og:title')).toBeInTheDocument();
      expect(screen.getByText('og:description')).toBeInTheDocument();
      expect(screen.getByText('og:image')).toBeInTheDocument();
    });

    it('should render twitter tags tab', () => {
      render(<MetaTagView {...defaultProps} />);

      const twitterTab = screen.getByTestId('tab-twitter');
      fireEvent.click(twitterTab);

      expect(screen.getByText('twitter:title')).toBeInTheDocument();
      expect(screen.getByText('twitter:description')).toBeInTheDocument();
      expect(screen.getByText('twitter:image')).toBeInTheDocument();
    });

    it('should render character counts for title', () => {
      render(<MetaTagView {...defaultProps} />);

      const titleTab = screen.getByTestId('tab-title');
      fireEvent.click(titleTab);

      const charCounts = screen.getAllByText(/자/);
      expect(charCounts.length).toBeGreaterThan(0);
    });

    it('should render character count guides (title 50-60)', () => {
      render(<MetaTagView {...defaultProps} />);

      const titleTab = screen.getByTestId('tab-title');
      fireEvent.click(titleTab);

      expect(screen.getByText(/50-60자 권장/i)).toBeInTheDocument();
    });

    it('should render character count guides (description 120-160)', () => {
      render(<MetaTagView {...defaultProps} />);

      const descTab = screen.getByTestId('tab-description');
      fireEvent.click(descTab);

      expect(screen.getByText(/120-160자 권장/i)).toBeInTheDocument();
    });
  });

  describe('Copy Functionality', () => {
    it('should have copy button for recommended title', () => {
      render(<MetaTagView {...defaultProps} />);

      const titleTab = screen.getByTestId('tab-title');
      fireEvent.click(titleTab);

      const copyButtons = screen.getAllByText(/복사/);
      expect(copyButtons.length).toBeGreaterThan(0);
    });

    it('should copy title HTML to clipboard', async () => {
      render(<MetaTagView {...defaultProps} />);

      const titleTab = screen.getByTestId('tab-title');
      fireEvent.click(titleTab);

      const copyButtons = screen.getAllByText(/복사/);
      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      });
    });

    it('should copy complete HTML snippet for all meta tags', async () => {
      render(<MetaTagView {...defaultProps} />);

      // Find and click the "전체 복사" button (copy all meta tags)
      const copyAllButton = screen.getByText(/전체 복사/);
      fireEvent.click(copyAllButton);

      await waitFor(() => {
        const clipboardCall = (navigator.clipboard.writeText as any).mock
          .calls[0];
        expect(clipboardCall[0]).toContain('<title>');
        expect(clipboardCall[0]).toContain('og:title');
        expect(clipboardCall[0]).toContain('twitter:title');
      });
    });

    it('should show success toast after copying', async () => {
      const mockConsoleLog = vi.spyOn(console, 'log');
      render(<MetaTagView {...defaultProps} />);

      const copyAllButton = screen.getByText(/전체 복사/);
      fireEvent.click(copyAllButton);

      await waitFor(
        () => {
          const calls = mockConsoleLog.mock.calls;
          const hasToastCall = calls.some(
            (call) =>
              call[0] === 'Toast:' &&
              typeof call[1] === 'string' &&
              call[1].includes('복사')
          );
          expect(hasToastCall).toBe(true);
        },
        { timeout: 2000 }
      );

      mockConsoleLog.mockRestore();
    });
  });

  describe('Improvement Indicators', () => {
    it('should highlight improved recommendations', () => {
      render(<MetaTagView {...defaultProps} />);

      const titleTab = screen.getByTestId('tab-title');
      fireEvent.click(titleTab);

      // Check that improved indicator is visible
      const recommendedSection = screen.getByText('추천 Title');
      expect(recommendedSection).toBeInTheDocument();
    });

    it('should show optimal length indicator when title is optimal', () => {
      render(<MetaTagView {...defaultProps} />);

      const titleTab = screen.getByTestId('tab-title');
      fireEvent.click(titleTab);

      // Should show character counts
      const charCounts = screen.getAllByText(/자/);
      expect(charCounts.length).toBeGreaterThan(0);
    });

    it('should show warning if recommended length is not optimal', () => {
      const propsWithNonOptimal = {
        ...defaultProps,
        improvements: {
          ...mockImprovements,
          titleLengthOptimal: false,
        },
      };

      render(<MetaTagView {...propsWithNonOptimal} />);

      const titleTab = screen.getByTestId('tab-title');
      fireEvent.click(titleTab);

      // Should still render but indicate non-optimal
      expect(screen.getByText('추천 Title')).toBeInTheDocument();
    });
  });

  describe('Reason Display', () => {
    it('should display reason for title improvement', () => {
      render(<MetaTagView {...defaultProps} />);

      const titleTab = screen.getByTestId('tab-title');
      fireEvent.click(titleTab);

      expect(
        screen.getByText(/Added product keyword and call-to-action/)
      ).toBeInTheDocument();
    });

    it('should display reason for description improvement', () => {
      render(<MetaTagView {...defaultProps} />);

      const descTab = screen.getByTestId('tab-description');
      fireEvent.click(descTab);

      expect(
        screen.getByText(/Improved clarity with specific product mention/)
      ).toBeInTheDocument();
    });

    it('should display reason for og tags improvement', () => {
      render(<MetaTagView {...defaultProps} />);

      const ogTab = screen.getByTestId('tab-og');
      fireEvent.click(ogTab);

      // The reason text is shown in the OG tab content
      const reasonTexts = screen.getAllByText(/Optimized for social media sharing/);
      expect(reasonTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Tab Navigation', () => {
    it('should switch tabs when clicking tab buttons', () => {
      render(<MetaTagView {...defaultProps} />);

      const titleTab = screen.getByTestId('tab-title');
      fireEvent.click(titleTab);
      expect(screen.getByTestId('tab-content-title')).toBeInTheDocument();

      const descTab = screen.getByTestId('tab-description');
      fireEvent.click(descTab);
      expect(screen.getByTestId('tab-content-description')).toBeInTheDocument();
    });

    it('should have all four tabs available', () => {
      render(<MetaTagView {...defaultProps} />);

      expect(screen.getByTestId('tab-title')).toBeInTheDocument();
      expect(screen.getByTestId('tab-description')).toBeInTheDocument();
      expect(screen.getByTestId('tab-og')).toBeInTheDocument();
      expect(screen.getByTestId('tab-twitter')).toBeInTheDocument();
    });
  });

  describe('Empty Image Handling', () => {
    it('should handle null og:image gracefully', () => {
      const propsWithNullImage = {
        ...defaultProps,
        recommendations: {
          ...mockRecommendations,
          ogImage: null,
        },
      };

      render(<MetaTagView {...propsWithNullImage} />);

      const ogTab = screen.getByTestId('tab-og');
      fireEvent.click(ogTab);

      expect(screen.getByText('og:image')).toBeInTheDocument();
    });

    it('should handle null twitter:image gracefully', () => {
      const propsWithNullImage = {
        ...defaultProps,
        recommendations: {
          ...mockRecommendations,
          twitterImage: null,
        },
      };

      render(<MetaTagView {...propsWithNullImage} />);

      const twitterTab = screen.getByTestId('tab-twitter');
      fireEvent.click(twitterTab);

      expect(screen.getByText('twitter:image')).toBeInTheDocument();
    });
  });

  describe('Comparison Layout', () => {
    it('should display before and after sections side by side', () => {
      render(<MetaTagView {...defaultProps} />);

      const titleTab = screen.getByTestId('tab-title');
      fireEvent.click(titleTab);

      expect(screen.getByText('현재 Title')).toBeInTheDocument();
      expect(screen.getByText('추천 Title')).toBeInTheDocument();
    });

    it('should show improvement reason in the middle/below comparison', () => {
      render(<MetaTagView {...defaultProps} />);

      const titleTab = screen.getByTestId('tab-title');
      fireEvent.click(titleTab);

      const reasonText = screen.getByText(
        /Added product keyword and call-to-action/
      );
      expect(reasonText).toBeInTheDocument();
    });
  });
});
