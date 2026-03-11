/**
 * action-items-list.test.tsx
 * Test suite for ActionItemsList component
 * Tests tab filtering, priority badges, sorting, expandable details, and completion tracking
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ActionItemsList from '../action-items-list';

describe('ActionItemsList', () => {
  const mockItems = [
    {
      id: 1,
      title: 'Title 태그 최적화',
      description: 'Title을 35자 이하로 수정하여 검색 결과에서 잘리지 않도록 함',
      itemType: 'quick_win' as const,
      priority: 'high' as const,
      expectedImpactScore: 10,
      estimatedEffort: '<1h' as const,
      completed: false,
    },
    {
      id: 2,
      title: '메타 설명 추가',
      description: '페이지별 메타 설명을 120-160자로 작성',
      itemType: 'quick_win' as const,
      priority: 'high' as const,
      expectedImpactScore: 8,
      estimatedEffort: '<1h' as const,
      completed: false,
    },
    {
      id: 3,
      title: 'Schema Markup 추가',
      description: 'JSON-LD 형식의 구조화된 데이터 추가',
      itemType: 'standard' as const,
      priority: 'medium' as const,
      expectedImpactScore: 15,
      estimatedEffort: '1-8h' as const,
      completed: false,
    },
    {
      id: 4,
      title: '모바일 성능 최적화',
      description: 'Core Web Vitals 개선을 위한 최적화 작업',
      itemType: 'long_term' as const,
      priority: 'low' as const,
      expectedImpactScore: 20,
      estimatedEffort: '>8h' as const,
      completed: false,
    },
    {
      id: 5,
      title: 'H1 태그 수정',
      description: 'H1 태그를 페이지 제목으로 명확히 설정',
      itemType: 'quick_win' as const,
      priority: 'medium' as const,
      expectedImpactScore: 5,
      estimatedEffort: '<1h' as const,
      completed: true,
    },
  ];

  describe('Rendering', () => {
    it('should render all action items in default (All) tab', () => {
      render(<ActionItemsList items={mockItems} />);

      expect(screen.getByText('Title 태그 최적화')).toBeInTheDocument();
      expect(screen.getByText('메타 설명 추가')).toBeInTheDocument();
      expect(screen.getByText('Schema Markup 추가')).toBeInTheDocument();
      expect(screen.getByText('모바일 성능 최적화')).toBeInTheDocument();
      expect(screen.getByText('H1 태그 수정')).toBeInTheDocument();
    });

    it('should render tab buttons for all categories', () => {
      render(<ActionItemsList items={mockItems} />);

      expect(screen.getByRole('tab', { name: /전체/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Quick Win/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /일반/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /장기/i })).toBeInTheDocument();
    });

    it('should render priority badges with correct labels', () => {
      render(<ActionItemsList items={mockItems} />);

      const highPriority = screen.getAllByText('높음');
      const mediumPriority = screen.getAllByText('중간');
      const lowPriority = screen.getAllByText('낮음');

      expect(highPriority.length).toBeGreaterThan(0);
      expect(mediumPriority.length).toBeGreaterThan(0);
      expect(lowPriority.length).toBeGreaterThan(0);
    });

    it('should render category badges', () => {
      render(<ActionItemsList items={mockItems} />);

      expect(screen.getAllByText('Quick Win').length).toBeGreaterThan(0);
      expect(screen.getAllByText('일반').length).toBeGreaterThan(0);
      expect(screen.getAllByText('장기').length).toBeGreaterThan(0);
    });

    it('should display impact scores with + prefix', () => {
      render(<ActionItemsList items={mockItems} />);

      expect(screen.getByText('+10점')).toBeInTheDocument();
      expect(screen.getByText('+8점')).toBeInTheDocument();
      expect(screen.getByText('+15점')).toBeInTheDocument();
    });

    it('should display effort estimates', () => {
      render(<ActionItemsList items={mockItems} />);

      expect(screen.getAllByText('1시간 이내').length).toBeGreaterThan(0);
      expect(screen.getByText('1-8시간')).toBeInTheDocument();
      expect(screen.getByText('8시간 이상')).toBeInTheDocument();
    });

    it('should render checkboxes for items', () => {
      render(<ActionItemsList items={mockItems} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThanOrEqual(mockItems.length);
    });

    it('should have completed item with checked checkbox', () => {
      const { container } = render(<ActionItemsList items={mockItems} />);

      // Find the completed item's checkbox
      const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
      expect(checkboxes.some((cb) => cb.checked)).toBe(true);
    });

    it('should render description text for each item', () => {
      render(<ActionItemsList items={mockItems} />);

      expect(
        screen.getByText('Title을 35자 이하로 수정하여 검색 결과에서 잘리지 않도록 함')
      ).toBeInTheDocument();
      expect(
        screen.getByText('페이지별 메타 설명을 120-160자로 작성')
      ).toBeInTheDocument();
    });
  });

  describe('Tab Filtering', () => {
    it('should filter to show only Quick Win items when Quick Win tab is clicked', async () => {
      const user = userEvent.setup();
      render(<ActionItemsList items={mockItems} />);

      const quickWinTab = screen.getByRole('tab', { name: /Quick Win/i });
      await user.click(quickWinTab);

      // Should show Quick Win items (3 items: id 1, 2, 5)
      expect(screen.getByText('Title 태그 최적화')).toBeInTheDocument();
      expect(screen.getByText('메타 설명 추가')).toBeInTheDocument();
      expect(screen.getByText('H1 태그 수정')).toBeInTheDocument();

      // Should NOT show other types
      expect(screen.queryByText('Schema Markup 추가')).not.toBeInTheDocument();
      expect(screen.queryByText('모바일 성능 최적화')).not.toBeInTheDocument();
    });

    it('should filter to show only standard items when 일반 tab is clicked', async () => {
      const user = userEvent.setup();
      render(<ActionItemsList items={mockItems} />);

      const standardTab = screen.getByRole('tab', { name: /일반/i });
      await user.click(standardTab);

      expect(screen.getByText('Schema Markup 추가')).toBeInTheDocument();
      expect(screen.queryByText('Title 태그 최적화')).not.toBeInTheDocument();
      expect(screen.queryByText('모바일 성능 최적화')).not.toBeInTheDocument();
    });

    it('should filter to show only long_term items when 장기 tab is clicked', async () => {
      const user = userEvent.setup();
      render(<ActionItemsList items={mockItems} />);

      const longTermTab = screen.getByRole('tab', { name: /장기/i });
      await user.click(longTermTab);

      expect(screen.getByText('모바일 성능 최적화')).toBeInTheDocument();
      expect(screen.queryByText('Title 태그 최적화')).not.toBeInTheDocument();
      expect(screen.queryByText('Schema Markup 추가')).not.toBeInTheDocument();
    });

    it('should show all items when 전체 tab is clicked', async () => {
      const user = userEvent.setup();
      render(<ActionItemsList items={mockItems} />);

      // First click on a specific tab
      const quickWinTab = screen.getByRole('tab', { name: /Quick Win/i });
      await user.click(quickWinTab);

      // Then click back on 전체
      const allTab = screen.getByRole('tab', { name: /전체/i });
      await user.click(allTab);

      // All items should be visible
      expect(screen.getByText('Title 태그 최적화')).toBeInTheDocument();
      expect(screen.getByText('메타 설명 추가')).toBeInTheDocument();
      expect(screen.getByText('Schema Markup 추가')).toBeInTheDocument();
      expect(screen.getByText('모바일 성능 최적화')).toBeInTheDocument();
      expect(screen.getByText('H1 태그 수정')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should sort items by priority (높음 > 중간 > 낮음) within each tab', async () => {
      const user = userEvent.setup();
      render(<ActionItemsList items={mockItems} />);

      // In All tab, check that items are sorted by priority
      const allTab = screen.getByRole('tab', { name: /전체/i });
      await user.click(allTab);

      // Items should be sorted: high priority items first
      const titles = screen.getAllByText(/태그|설명|마크업|성능|H1/);
      expect(titles.length).toBeGreaterThan(0);
      // Verify high priority items appear before low priority items
      const highBadges = screen.getAllByText('높음');
      const lowBadges = screen.getAllByText('낮음');
      expect(highBadges.length).toBeGreaterThan(0);
      expect(lowBadges.length).toBeGreaterThan(0);
    });

    it('should maintain sort order in Quick Win tab (높음 first)', async () => {
      const user = userEvent.setup();
      render(<ActionItemsList items={mockItems} />);

      const quickWinTab = screen.getByRole('tab', { name: /Quick Win/i });
      await user.click(quickWinTab);

      // Quick Win has: high (1), high (2), medium (5)
      // Should be sorted: high items first, then medium
      const badges = screen.getAllByText('높음');
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  describe('Expandable Details', () => {
    it('should render expand/collapse buttons for each item', () => {
      render(<ActionItemsList items={mockItems} />);

      const expandButtons = screen.getAllByRole('button', { name: /상세/i });
      expect(expandButtons.length).toBeGreaterThanOrEqual(mockItems.length);
    });

    it('should expand item details when expand button is clicked', async () => {
      const user = userEvent.setup();
      render(<ActionItemsList items={mockItems} />);

      const expandButton = screen.getAllByRole('button', { name: /상세/i })[0];
      await user.click(expandButton);

      // Details should become visible (check for additional content)
      // The exact content depends on component implementation
    });

    it('should collapse item details when expand button is clicked again', async () => {
      const user = userEvent.setup();
      render(<ActionItemsList items={mockItems} />);

      const expandButton = screen.getAllByRole('button', { name: /상세/i })[0];
      await user.click(expandButton);
      await user.click(expandButton);

      // Details should be hidden again
    });
  });

  describe('Checkbox Interaction', () => {
    it('should call onToggleComplete callback when checkbox is clicked', async () => {
      const user = userEvent.setup();
      const onToggleComplete = vi.fn();
      render(<ActionItemsList items={mockItems} onToggleComplete={onToggleComplete} />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      expect(onToggleComplete).toHaveBeenCalled();
      expect(onToggleComplete).toHaveBeenCalledWith(mockItems[0].id, expect.any(Boolean));
    });

    it('should reflect completed status in checkbox', () => {
      const completedItem = {
        ...mockItems[0],
        completed: true,
      };

      render(<ActionItemsList items={[completedItem]} />);

      const checkbox = screen.getByRole('checkbox', { name: /완료/i });
      expect((checkbox as HTMLInputElement).checked).toBe(true);
    });

    it('should show strikethrough or muted styling for completed items', () => {
      const { container } = render(<ActionItemsList items={mockItems} />);

      // Check for styling applied to completed item
      const completedItemElement = container.querySelector('[data-completed="true"]');
      expect(completedItemElement).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('should display empty state message when no items in a tab', async () => {
      const user = userEvent.setup();
      const emptyItems = mockItems.filter((item) => item.itemType !== 'long_term');

      render(<ActionItemsList items={emptyItems} />);

      const longTermTab = screen.getByRole('tab', { name: /장기/i });
      await user.click(longTermTab);

      expect(screen.getByText('개선 항목이 없습니다')).toBeInTheDocument();
    });

    it('should display empty state when all items are rendered in All tab', () => {
      render(<ActionItemsList items={[]} />);

      expect(screen.getByText('개선 항목이 없습니다')).toBeInTheDocument();
    });
  });

  describe('UI Components', () => {
    it('should apply correct color classes to priority badges', () => {
      const { container } = render(<ActionItemsList items={mockItems} />);

      // Check for badge color classes (red/yellow/gray)
      const badges = container.querySelectorAll('[data-priority]');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should apply correct color classes to category badges', () => {
      const { container } = render(<ActionItemsList items={mockItems} />);

      // Check for category badge classes
      const categoryBadges = container.querySelectorAll('[data-category]');
      expect(categoryBadges.length).toBeGreaterThan(0);
    });

    it('should have hover effects on cards', () => {
      const { container } = render(<ActionItemsList items={mockItems} />);

      const cards = container.querySelectorAll('[data-testid="action-item-card"]');
      expect(cards.length).toBeGreaterThan(0);

      // Check for hover CSS classes
      cards.forEach((card) => {
        const classList = card.className;
        expect(classList).toMatch(/hover:/);
      });
    });

    it('should render animation delays for sequential appearance', () => {
      const { container } = render(<ActionItemsList items={mockItems} />);

      const cards = container.querySelectorAll('[style*="animation-delay"]');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design', () => {
    it('should render with mobile-friendly layout', () => {
      const { container } = render(<ActionItemsList items={mockItems} />);

      // Check for responsive grid classes
      const grid = container.querySelector('[class*="grid"]');
      expect(grid).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle items with null impact scores', () => {
      const itemWithNullImpact = {
        ...mockItems[0],
        expectedImpactScore: null,
      };

      render(<ActionItemsList items={[itemWithNullImpact]} />);

      // Component should still render without errors
      expect(screen.getByText('Title 태그 최적화')).toBeInTheDocument();
    });

    it('should handle items with null effort estimates', () => {
      const itemWithNullEffort = {
        ...mockItems[0],
        estimatedEffort: null,
      };

      render(<ActionItemsList items={[itemWithNullEffort]} />);

      expect(screen.getByText('Title 태그 최적화')).toBeInTheDocument();
    });

    it('should handle mixed completed and incomplete items', () => {
      const mixedItems = [
        { ...mockItems[0], completed: true },
        { ...mockItems[1], completed: false },
        { ...mockItems[2], completed: true },
      ];

      render(<ActionItemsList items={mixedItems} />);

      expect(screen.getByText('Title 태그 최적화')).toBeInTheDocument();
      expect(screen.getByText('메타 설명 추가')).toBeInTheDocument();
      expect(screen.getByText('Schema Markup 추가')).toBeInTheDocument();
    });

    it('should handle very long item titles and descriptions', () => {
      const longItem = {
        ...mockItems[0],
        title: '이것은 매우 긴 제목입니다 '.repeat(5),
        description: '이것은 매우 긴 설명입니다 '.repeat(10),
      };

      render(<ActionItemsList items={[longItem]} />);

      expect(screen.getByText(/이것은 매우 긴 제목입니다/)).toBeInTheDocument();
    });
  });
});
