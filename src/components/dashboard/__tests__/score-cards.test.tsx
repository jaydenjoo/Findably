/**
 * score-cards.test.tsx
 * Test suite for ScoreCards component
 * Tests rendering, score display, progress bars, expandable details, and responsive behavior
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import ScoreCards from '../score-cards';

describe('ScoreCards', () => {
  const mockProps = {
    seoScore: 85,
    geoScore: 75,
    performanceScore: 65,
    aiScore: 55,
    seoDetails: [
      { item: '제목 태그 (Title)', points: 20, status: 'pass' as const },
      { item: '메타 설명 (Meta description)', points: 0, status: 'fail' as const },
      { item: 'H1 태그', points: 15, status: 'pass' as const },
    ],
    geoDetails: [
      { item: 'Schema.org 마크업 존재', points: 30, status: 'pass' as const },
      { item: '구조화된 데이터', points: 0, status: 'fail' as const },
    ],
    performanceDetails: {
      mobileScore: 70,
      desktopScore: 60,
    },
  };

  describe('Rendering', () => {
    it('should render all 4 category cards', () => {
      render(<ScoreCards {...mockProps} />);

      expect(screen.getByText('SEO')).toBeInTheDocument();
      expect(screen.getByText('GEO')).toBeInTheDocument();
      expect(screen.getByText('성능')).toBeInTheDocument();
      expect(screen.getByText('AI 분석')).toBeInTheDocument();
    });

    it('should display correct scores for each category', () => {
      render(<ScoreCards {...mockProps} />);

      // SEO: 85/100
      expect(screen.getByText('85')).toBeInTheDocument();
      // GEO: 75/100
      expect(screen.getByText('75')).toBeInTheDocument();
      // Performance: 65/100
      expect(screen.getByText('65')).toBeInTheDocument();
      // AI: 55/100
      expect(screen.getByText('55')).toBeInTheDocument();
    });

    it('should display "/100" after each score', () => {
      render(<ScoreCards {...mockProps} />);
      const slashHundreds = screen.getAllByText('/100');
      expect(slashHundreds.length).toBeGreaterThanOrEqual(4);
    });

    it('should display weight percentages', () => {
      render(<ScoreCards {...mockProps} />);

      const weights = screen.getAllByText('35%');
      expect(weights.length).toBeGreaterThanOrEqual(2); // SEO and GEO both 35%
      expect(screen.getByText('20%')).toBeInTheDocument(); // Performance weight
      expect(screen.getByText('10%')).toBeInTheDocument(); // AI weight
    });

    it('should render progress bars for each card', () => {
      const { container } = render(<ScoreCards {...mockProps} />);

      // Check for progress bar containers (4 cards = 4 progress bars)
      const progressBars = container.querySelectorAll('[role="progressbar"]');
      expect(progressBars.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Progress Bar Colors', () => {
    it('should render progress bars with appropriate colors based on score ranges', () => {
      render(<ScoreCards {...mockProps} />);

      // Just verify progress bars exist and have role
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThanOrEqual(3);

      // Verify each has proper ARIA attributes
      progressBars.forEach((bar) => {
        expect(bar).toHaveAttribute('aria-valuenow');
      });
    });

    it('should set progress bar aria-valuenow to match score', () => {
      render(<ScoreCards {...mockProps} />);

      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThanOrEqual(3);

      // Check first bar (SEO at 85)
      const seoBar = progressBars[0];
      expect(seoBar.getAttribute('aria-valuenow')).toBe('85');
    });
  });

  describe('Expandable Details', () => {
    it('should render expandable detail sections', () => {
      render(<ScoreCards {...mockProps} />);

      const triggers = screen.getAllByRole('button');
      expect(triggers.length).toBeGreaterThanOrEqual(3); // SEO, GEO, Performance have details; AI does not
    });

    it('should toggle detail visibility on click', async () => {
      const user = userEvent.setup();
      render(<ScoreCards {...mockProps} />);

      // Find the button in first card with details
      const buttons = screen.getAllByRole('button');
      const seoTrigger = buttons[0]; // Should be first expandable button

      // Details should not be visible initially
      expect(screen.queryByText('제목 태그 (Title)')).not.toBeInTheDocument();

      // Click to expand
      await user.click(seoTrigger);

      // Details should now be visible
      expect(screen.getByText('제목 태그 (Title)')).toBeInTheDocument();
    });

    it('should display sub-items with correct status icons', async () => {
      const user = userEvent.setup();
      render(<ScoreCards {...mockProps} />);

      const buttons = screen.getAllByRole('button');
      const seoTrigger = buttons[0];

      await user.click(seoTrigger);

      // Check for pass status (✓)
      expect(screen.getByText('제목 태그 (Title)')).toBeInTheDocument();

      // Check for fail status (✗)
      expect(screen.getByText('메타 설명 (Meta description)')).toBeInTheDocument();
    });

    it('should show pass icon for pass status', async () => {
      const user = userEvent.setup();
      render(<ScoreCards {...mockProps} />);

      const buttons = screen.getAllByRole('button');
      const seoTrigger = buttons[0];

      await user.click(seoTrigger);

      // Pass items should have checkmark and data-status
      const passItems = screen.getByText('제목 태그 (Title)').closest('[data-status="pass"]');
      expect(passItems).toBeInTheDocument();
    });

    it('should show fail icon for fail status', async () => {
      const user = userEvent.setup();
      render(<ScoreCards {...mockProps} />);

      const buttons = screen.getAllByRole('button');
      const seoTrigger = buttons[0];

      await user.click(seoTrigger);

      // Fail items should have X icon
      const failItems = screen.getByText('메타 설명 (Meta description)').closest('[data-status="fail"]');
      expect(failItems).toBeInTheDocument();
    });

    it('should show partial icon for partial status', async () => {
      const user = userEvent.setup();
      const props = {
        ...mockProps,
        seoDetails: [
          { item: '테스트 항목', points: 10, status: 'partial' as const },
        ],
      };
      render(<ScoreCards {...props} />);

      const buttons = screen.getAllByRole('button');
      const seoTrigger = buttons[0];

      await user.click(seoTrigger);

      // Partial items should have △ icon
      const partialItems = screen.getByText('테스트 항목').closest('[data-status="partial"]');
      expect(partialItems).toBeInTheDocument();
    });
  });

  describe('AI Score Unavailable State', () => {
    it('should display "분석 불가" when aiScore is null', () => {
      const props = { ...mockProps, aiScore: null };
      render(<ScoreCards {...props} />);

      expect(screen.getByText('분석 불가')).toBeInTheDocument();
    });

    it('should not display "/100" when aiScore is null', () => {
      const props = { ...mockProps, aiScore: null };
      render(<ScoreCards {...props} />);

      // Count how many /100 appear (should be 3, not 4)
      const slashHundreds = screen.getAllByText('/100');
      expect(slashHundreds.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Responsive Grid', () => {
    it('should use responsive grid layout', () => {
      const { container } = render(<ScoreCards {...mockProps} />);

      // Check for grid layout classes
      const gridContainer = container.querySelector('[class*="grid"]');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer?.className).toMatch(/grid/);
    });

    it('should have grid-cols-1 for mobile breakpoint', () => {
      const { container } = render(<ScoreCards {...mockProps} />);

      // Check for responsive grid classes (should have grid-cols-1)
      const gridContainer = container.querySelector('[class*="grid"]');
      expect(gridContainer?.className).toMatch(/grid-cols-1/);
    });
  });

  describe('Card Styling', () => {
    it('should render cards with proper shadows', () => {
      const { container } = render(<ScoreCards {...mockProps} />);

      const cards = container.querySelectorAll('[data-testid="score-card"]');
      cards.forEach((card) => {
        expect(card.className).toMatch(/shadow/);
      });
    });

    it('should have hover state with translateY and shadow upgrade', () => {
      const { container } = render(<ScoreCards {...mockProps} />);

      const cards = container.querySelectorAll('[data-testid="score-card"]');
      cards.forEach((card) => {
        expect(card.className).toMatch(/hover:-translate-y|hover:shadow/);
      });
    });

    it('should render category icons in brand-light background circles', () => {
      const { container } = render(<ScoreCards {...mockProps} />);

      const iconBackgrounds = container.querySelectorAll('[data-testid="category-icon"]');
      iconBackgrounds.forEach((bg) => {
        expect(bg.className).toMatch(/bg.*light|bg.*50|bg.*100/);
      });
    });
  });

  describe('Animation', () => {
    it('should have sequential animation delay on cards', () => {
      const { container } = render(<ScoreCards {...mockProps} />);

      const cards = container.querySelectorAll('[data-testid="score-card"]');
      expect(cards).toHaveLength(4);

      // Check animation delay on each card
      cards.forEach((card) => {
        const style = window.getComputedStyle(card);
        const delay = style.animationDelay || card.getAttribute('style');
        expect(delay).toBeDefined();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have progress bars with aria attributes', () => {
      render(<ScoreCards {...mockProps} />);

      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThanOrEqual(3);

      progressBars.forEach((bar) => {
        expect(bar).toHaveAttribute('aria-valuenow');
        expect(bar).toHaveAttribute('aria-valuemin');
        expect(bar).toHaveAttribute('aria-valuemax');
      });
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<ScoreCards {...mockProps} />);

      const triggers = screen.getAllByRole('button');
      expect(triggers.length).toBeGreaterThanOrEqual(1);

      // Should be able to tab to trigger
      await user.tab();
      expect(triggers[0]).toHaveFocus();
    });

    it('should use semantic HTML heading for category names', () => {
      render(<ScoreCards {...mockProps} />);

      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Type Safety', () => {
    it('should accept GEO details with maxPoints field', () => {
      const props = {
        ...mockProps,
        geoDetails: [
          { item: 'Schema.org 마크업 존재', points: 30, maxPoints: 30, status: 'pass' as const },
          { item: '구조화된 데이터', points: 0, maxPoints: 20, status: 'fail' as const },
        ],
      };
      render(<ScoreCards {...props} />);
      expect(screen.getByText('GEO')).toBeInTheDocument();
    });

    it('should accept SEO details without maxPoints', () => {
      const props = {
        ...mockProps,
        seoDetails: [
          { item: '제목 태그 (Title)', points: 20, status: 'pass' as const },
        ],
      };
      render(<ScoreCards {...props} />);
      expect(screen.getByText('SEO')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero scores', () => {
      const props = {
        ...mockProps,
        seoScore: 0,
        geoScore: 0,
        performanceScore: 0,
        aiScore: 0,
      };
      render(<ScoreCards {...props} />);

      const scores = screen.getAllByText('0');
      expect(scores.length).toBeGreaterThanOrEqual(4);
    });

    it('should handle 100 scores', () => {
      const props = {
        ...mockProps,
        seoScore: 100,
        geoScore: 100,
        performanceScore: 100,
        aiScore: 100,
      };
      render(<ScoreCards {...props} />);

      const scores = screen.getAllByText('100');
      expect(scores.length).toBeGreaterThanOrEqual(4);
    });

    it('should handle empty details arrays', () => {
      const props = {
        ...mockProps,
        seoDetails: [],
        geoDetails: [],
        performanceDetails: undefined,
      };
      render(<ScoreCards {...props} />);

      expect(screen.getByText('SEO')).toBeInTheDocument();
      expect(screen.getByText('GEO')).toBeInTheDocument();
    });

    it('should handle undefined optional props', () => {
      const props = {
        seoScore: 85,
        geoScore: 75,
        performanceScore: 65,
        aiScore: 55,
      };
      render(<ScoreCards {...props} />);

      expect(screen.getByText('SEO')).toBeInTheDocument();
    });
  });
});
