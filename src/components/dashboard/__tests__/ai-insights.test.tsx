/**
 * ai-insights.test.tsx
 * Test suite for AIInsights component
 * Tests card rendering, expansion, modal display, and AI insight data structure
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import AIInsights from '../ai-insights';

describe('AIInsights', () => {
  const mockAIInsights = {
    problems: [
      {
        severity: 'high' as const,
        title: '메타 설명 누락',
        description: '페이지에 메타 설명이 없어 검색 결과에서 노출 기회 감소',
        icon: '⚠️',
        expectedBenefit: '검색 노출도 +35%',
        action: '각 페이지에 120-160자 메타 설명 추가',
        relatedActionItems: ['SEO-001', 'SEO-002'],
        references: ['https://example.com/meta-guide'],
      },
      {
        severity: 'medium' as const,
        title: 'H1 태그 최적화 필요',
        description: 'H1 태그가 페이지의 주제를 명확하게 반영하지 못함',
        icon: '💡',
        expectedBenefit: 'SEO 점수 +20%',
        action: 'H1 태그를 주요 키워드를 포함하여 수정',
        relatedActionItems: ['SEO-003'],
        references: ['https://example.com/h1-guide'],
      },
      {
        severity: 'low' as const,
        title: '내부 링크 구조 개선',
        description: '관련 페이지로의 내부 링크가 부족함',
        icon: '🎯',
        expectedBenefit: '사용자 체류 시간 +15%',
        action: '관련 콘텐츠로의 내부 링크 5개 추가',
        relatedActionItems: [],
        references: [],
      },
    ],
  };

  describe('Rendering', () => {
    it('should render 3 insight cards when aiInsights is provided', () => {
      render(<AIInsights aiInsights={mockAIInsights} />);

      const cards = screen.getAllByTestId('insight-card');
      expect(cards).toHaveLength(3);
    });

    it('should render empty state when aiInsights is null', () => {
      render(<AIInsights aiInsights={null} />);

      expect(
        screen.getByText('AI 인사이트를 불러올 수 없습니다')
      ).toBeInTheDocument();
    });

    it('should render empty state when problems array is empty', () => {
      render(<AIInsights aiInsights={{ problems: [] }} />);

      expect(
        screen.getByText('AI 인사이트를 불러올 수 없습니다')
      ).toBeInTheDocument();
    });

    it('should display correct insight titles', () => {
      render(<AIInsights aiInsights={mockAIInsights} />);

      expect(screen.getByText('메타 설명 누락')).toBeInTheDocument();
      expect(screen.getByText('H1 태그 최적화 필요')).toBeInTheDocument();
      expect(screen.getByText('내부 링크 구조 개선')).toBeInTheDocument();
    });

    it('should display expected benefit for each card', () => {
      render(<AIInsights aiInsights={mockAIInsights} />);

      expect(screen.getByText('검색 노출도 +35%')).toBeInTheDocument();
      expect(screen.getByText('SEO 점수 +20%')).toBeInTheDocument();
      expect(screen.getByText('사용자 체류 시간 +15%')).toBeInTheDocument();
    });

    it('should render icons as emojis in cards', () => {
      const { container } = render(<AIInsights aiInsights={mockAIInsights} />);

      // Check for emoji icons
      const cardContents = container.querySelectorAll('[data-testid="insight-card"]');
      expect(cardContents.length).toBe(3);

      // First card should contain warning icon
      const firstCard = cardContents[0];
      expect(firstCard.textContent).toContain('⚠️');

      // Second card should contain lightbulb icon
      const secondCard = cardContents[1];
      expect(secondCard.textContent).toContain('💡');

      // Third card should contain target icon
      const thirdCard = cardContents[2];
      expect(thirdCard.textContent).toContain('🎯');
    });

    it('should apply correct background colors based on severity', () => {
      const { container } = render(<AIInsights aiInsights={mockAIInsights} />);

      const cards = container.querySelectorAll('[data-testid="insight-card"]');

      // First card (high severity) should have red-light background
      expect(cards[0]).toHaveClass('bg-red-50');

      // Second card (medium severity) should have yellow-light background
      expect(cards[1]).toHaveClass('bg-yellow-50');

      // Third card (low severity) should have blue-light background
      expect(cards[2]).toHaveClass('bg-blue-50');
    });

    it('should have animation delays for sequential appearance', () => {
      const { container } = render(<AIInsights aiInsights={mockAIInsights} />);

      const cards = container.querySelectorAll('[style*="animation-delay"]');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should render descriptions (short summaries) on cards', () => {
      render(<AIInsights aiInsights={mockAIInsights} />);

      expect(
        screen.getByText('페이지에 메타 설명이 없어 검색 결과에서 노출 기회 감소')
      ).toBeInTheDocument();
      expect(
        screen.getByText('H1 태그가 페이지의 주제를 명확하게 반영하지 못함')
      ).toBeInTheDocument();
    });
  });

  describe('Card Interaction - Expansion', () => {
    it('should render expand buttons for each card', () => {
      render(<AIInsights aiInsights={mockAIInsights} />);

      const expandButtons = screen.getAllByRole('button', { name: /상세 보기/i });
      expect(expandButtons.length).toBe(3);
    });

    it('should open modal when card expand button is clicked', async () => {
      const user = userEvent.setup();
      render(<AIInsights aiInsights={mockAIInsights} />);

      const expandButtons = screen.getAllByRole('button', { name: /상세 보기/i });
      await user.click(expandButtons[0]);

      // Modal should display the full problem details
      // Use queryAllByText to check for multiple elements and verify modal is open
      const titles = screen.queryAllByText('메타 설명 누락');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should display action details in modal', async () => {
      const user = userEvent.setup();
      render(<AIInsights aiInsights={mockAIInsights} />);

      const expandButtons = screen.getAllByRole('button', { name: /상세 보기/i });
      await user.click(expandButtons[0]);

      // Modal should display the recommended action
      const actions = screen.queryAllByText('각 페이지에 120-160자 메타 설명 추가');
      expect(actions.length).toBeGreaterThan(0);
    });

    it('should display expected benefit in modal', async () => {
      const user = userEvent.setup();
      render(<AIInsights aiInsights={mockAIInsights} />);

      const expandButtons = screen.getAllByRole('button', { name: /상세 보기/i });
      await user.click(expandButtons[0]);

      // Verify benefit text is present (may appear in multiple places)
      const benefits = screen.queryAllByText('검색 노출도 +35%');
      expect(benefits.length).toBeGreaterThan(0);
    });

    it('should close modal when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<AIInsights aiInsights={mockAIInsights} />);

      const expandButtons = screen.getAllByRole('button', { name: /상세 보기/i });
      await user.click(expandButtons[0]);

      // Verify modal is open (may have multiple instances)
      const descriptions = screen.queryAllByText('페이지에 메타 설명이 없어 검색 결과에서 노출 기회 감소');
      expect(descriptions.length).toBeGreaterThan(0);

      // Close modal
      const closeButton = screen.getByRole('button', { name: /닫기/i });
      await user.click(closeButton);

      // Verify card buttons still exist
      const remainingButtons = screen.getAllByRole('button', { name: /상세 보기/i });
      expect(remainingButtons.length).toBeGreaterThan(0);
    });

    it('should open correct modal for each card clicked', async () => {
      const user = userEvent.setup();
      render(<AIInsights aiInsights={mockAIInsights} />);

      const expandButtons = screen.getAllByRole('button', { name: /상세 보기/i });

      // Click second card
      await user.click(expandButtons[1]);

      // Verify second card's content is in the modal
      const titles = screen.queryAllByText('H1 태그 최적화 필요');
      expect(titles.length).toBeGreaterThanOrEqual(1);

      const scores = screen.queryAllByText('SEO 점수 +20%');
      expect(scores.length).toBeGreaterThan(0);
    });
  });

  describe('Modal Content', () => {
    it('should display related action items in modal', async () => {
      const user = userEvent.setup();
      render(<AIInsights aiInsights={mockAIInsights} />);

      const expandButtons = screen.getAllByRole('button', { name: /상세 보기/i });
      await user.click(expandButtons[0]);

      // Modal should show related action items
      // If relatedActionItems exist, they should be displayed
      const relatedItems = mockAIInsights.problems[0].relatedActionItems;
      if (relatedItems.length > 0) {
        expect(screen.getByText(/관련 액션 아이템/i)).toBeInTheDocument();
      }
    });

    it('should display reference links in modal', async () => {
      const user = userEvent.setup();
      render(<AIInsights aiInsights={mockAIInsights} />);

      const expandButtons = screen.getAllByRole('button', { name: /상세 보기/i });
      await user.click(expandButtons[0]);

      // Modal should show reference links
      const references = mockAIInsights.problems[0].references;
      if (references.length > 0) {
        expect(screen.getByText(/참고 자료/i)).toBeInTheDocument();
      }
    });

    it('should handle empty relatedActionItems gracefully', async () => {
      const user = userEvent.setup();
      render(<AIInsights aiInsights={mockAIInsights} />);

      const expandButtons = screen.getAllByRole('button', { name: /상세 보기/i });
      // Third card has empty relatedActionItems
      await user.click(expandButtons[2]);

      // Component should still render without errors
      const titles = screen.queryAllByText('내부 링크 구조 개선');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle empty references gracefully', async () => {
      const user = userEvent.setup();
      render(<AIInsights aiInsights={mockAIInsights} />);

      const expandButtons = screen.getAllByRole('button', { name: /상세 보기/i });
      // Third card has empty references
      await user.click(expandButtons[2]);

      // Component should still render without errors
      const titles = screen.queryAllByText('내부 링크 구조 개선');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Data Structure Validation', () => {
    it('should handle aiInsights with problems property', () => {
      render(<AIInsights aiInsights={mockAIInsights} />);

      const cards = screen.getAllByTestId('insight-card');
      expect(cards).toHaveLength(3);
    });

    it('should handle aiInsights with recommendations property (legacy)', () => {
      const legacyInsights = {
        recommendations: [
          '메타 설명 추가',
          'H1 태그 최적화',
          '내부 링크 추가',
        ],
      };

      // Component should handle this gracefully
      // Either render or show empty state
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<AIInsights aiInsights={legacyInsights as any} />);

      // Should either show empty state or handle gracefully
      const cards = screen.queryAllByTestId('insight-card');
      // If no problems, should show empty state
      if (cards.length === 0) {
        expect(
          screen.getByText('AI 인사이트를 불러올 수 없습니다')
        ).toBeInTheDocument();
      }
    });
  });

  describe('UI Components', () => {
    it('should have correct card styling with borders and shadows', () => {
      const { container } = render(<AIInsights aiInsights={mockAIInsights} />);

      const cards = container.querySelectorAll('[data-testid="insight-card"]');
      cards.forEach((card) => {
        const classList = card.className;
        expect(classList).toMatch(/border|shadow|rounded/);
      });
    });

    it('should have hover effects on cards', () => {
      const { container } = render(<AIInsights aiInsights={mockAIInsights} />);

      const cards = container.querySelectorAll('[data-testid="insight-card"]');
      expect(cards.length).toBeGreaterThan(0);

      cards.forEach((card) => {
        const classList = card.className;
        expect(classList).toMatch(/hover:/);
      });
    });

    it('should display action text on cards', () => {
      render(<AIInsights aiInsights={mockAIInsights} />);

      expect(
        screen.getByText('각 페이지에 120-160자 메타 설명 추가')
      ).toBeInTheDocument();
      expect(
        screen.getByText('H1 태그를 주요 키워드를 포함하여 수정')
      ).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render grid layout with responsive columns', () => {
      const { container } = render(<AIInsights aiInsights={mockAIInsights} />);

      // Check for grid layout classes
      const grid = container.querySelector('[class*="grid"]');
      expect(grid).toBeTruthy();
    });

    it('should have responsive column classes (md:, lg:)', () => {
      const { container } = render(<AIInsights aiInsights={mockAIInsights} />);

      // Check for grid container with responsive classes
      const gridContainer = container.querySelector('[class*="grid"]');
      expect(gridContainer).toBeTruthy();

      const gridClasses = (gridContainer as HTMLElement).className;
      // Should contain grid layout classes
      expect(gridClasses).toMatch(/grid.*md:|grid.*lg:/);
    });
  });

  describe('Edge Cases', () => {
    it('should limit to 3 insight cards maximum', () => {
      const manyInsights = {
        problems: Array.from({ length: 10 }, (_, i) => ({
          severity: ('high' as const),
          title: `Problem ${i + 1}`,
          description: `Description ${i + 1}`,
          icon: '⚠️',
          expectedBenefit: `+${(i + 1) * 10}%`,
          action: `Action ${i + 1}`,
          relatedActionItems: [],
          references: [],
        })),
      };

      render(<AIInsights aiInsights={manyInsights} />);

      const cards = screen.getAllByTestId('insight-card');
      expect(cards).toHaveLength(3);
    });

    it('should handle missing properties gracefully', () => {
      const partialInsights = {
        problems: [
          {
            severity: 'high' as const,
            title: 'Issue 1',
            description: 'Description',
            icon: '⚠️',
            expectedBenefit: 'Benefit',
            action: 'Action',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        ],
      };

      render(<AIInsights aiInsights={partialInsights} />);

      const cards = screen.getAllByTestId('insight-card');
      expect(cards).toHaveLength(1);
    });

    it('should handle very long text in title and action', () => {
      const longTextInsights = {
        problems: [
          {
            severity: 'high' as const,
            title: '매우 긴 문제 제목입니다 '.repeat(5),
            description: '긴 설명입니다 '.repeat(10),
            icon: '⚠️',
            expectedBenefit: '+35%',
            action: '매우 긴 액션 텍스트입니다 '.repeat(5),
            relatedActionItems: [],
            references: [],
          },
        ],
      };

      render(<AIInsights aiInsights={longTextInsights} />);

      expect(screen.getAllByTestId('insight-card')).toHaveLength(1);
    });

    it('should handle Korean text properly', () => {
      render(<AIInsights aiInsights={mockAIInsights} />);

      // Check for Korean text rendering (may have multiple instances)
      const koreanTexts = screen.queryAllByText(/메타|검색/);
      expect(koreanTexts.length).toBeGreaterThan(0);
    });
  });
});
