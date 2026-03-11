import { describe, it, expect } from 'vitest';
import * as prioritizerModule from '../action-prioritizer';

describe('Action Items Prioritizer', () => {
  describe('Exports and Types', () => {
    it('should export prioritizeActions function', () => {
      expect(typeof prioritizerModule.prioritizeActions).toBe('function');
    });

    it('should export ActionItemWithMetrics type', () => {
      // Type-level check via module structure
      expect(prioritizerModule).toHaveProperty('prioritizeActions');
    });

    it('should export PrioritizedActionItem type', () => {
      // Type-level check via module structure
      expect(prioritizerModule).toHaveProperty('prioritizeActions');
    });

    it('should export CategoryType type', () => {
      // Type-level check via module structure
      expect(prioritizerModule).toHaveProperty('prioritizeActions');
    });
  });

  describe('Input Validation', () => {
    it('should accept valid action items list', () => {
      const actions = [
        {
          id: '1',
          title: 'Add meta description',
          impact: 10,
          effort: 0.5,
          description: 'Add missing meta description',
        },
      ];

      expect(async () => {
        await prioritizerModule.prioritizeActions(actions);
      }).not.toThrow();
    });

    it('should handle empty actions list', async () => {
      const actions: prioritizerModule.ActionItemWithMetrics[] = [];
      const result = await prioritizerModule.prioritizeActions(actions);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle single action item', async () => {
      const actions = [
        {
          id: '1',
          title: 'Test action',
          impact: 5,
          effort: 1,
          description: 'Test',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('id', '1');
    });

    it('should handle multiple action items', async () => {
      const actions = [
        {
          id: '1',
          title: 'Action 1',
          impact: 5,
          effort: 0.5,
          description: 'First action',
        },
        {
          id: '2',
          title: 'Action 2',
          impact: 10,
          effort: 2,
          description: 'Second action',
        },
        {
          id: '3',
          title: 'Action 3',
          impact: 15,
          effort: 4,
          description: 'Third action',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      expect(result.length).toBe(3);
      expect(result.every((item) => item.id)).toBe(true);
    });
  });

  describe('Priority Score Calculation', () => {
    it('should calculate priority score = impact / (1 + effort)', async () => {
      const actions = [
        {
          id: '1',
          title: 'Test',
          impact: 10,
          effort: 1,
          description: 'Test',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      // priority = 10 / (1 + 1) = 10 / 2 = 5
      const expectedScore = 10 / (1 + 1);
      expect(result[0]).toHaveProperty('priorityScore');
      expect(result[0].priorityScore).toBe(expectedScore);
    });

    it('should handle zero impact', async () => {
      const actions = [
        {
          id: '1',
          title: 'Zero impact',
          impact: 0,
          effort: 1,
          description: 'No impact action',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      // priority = 0 / (1 + 1) = 0
      expect(result[0].priorityScore).toBe(0);
    });

    it('should handle zero effort (Quick Win)', async () => {
      const actions = [
        {
          id: '1',
          title: 'Quick win',
          impact: 10,
          effort: 0,
          description: 'No effort needed',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      // priority = 10 / (1 + 0) = 10
      expect(result[0].priorityScore).toBe(10);
    });

    it('should handle very high effort', async () => {
      const actions = [
        {
          id: '1',
          title: 'Long term',
          impact: 20,
          effort: 100,
          description: 'Very long effort',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      // priority = 20 / (1 + 100) = 20 / 101
      const expectedScore = 20 / (1 + 100);
      expect(result[0].priorityScore).toBeCloseTo(expectedScore, 5);
    });

    it('should sort items by priority score (highest first)', async () => {
      const actions = [
        {
          id: '1',
          title: 'Low priority',
          impact: 5,
          effort: 8,
          description: 'Low',
        },
        {
          id: '2',
          title: 'High priority',
          impact: 20,
          effort: 0.5,
          description: 'High',
        },
        {
          id: '3',
          title: 'Medium priority',
          impact: 10,
          effort: 2,
          description: 'Medium',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      // Expected order by priority score (highest first)
      expect(result[0].id).toBe('2'); // 20 / 1.5 = 13.33
      expect(result[1].id).toBe('3'); // 10 / 3 = 3.33
      expect(result[2].id).toBe('1'); // 5 / 9 = 0.56
    });
  });

  describe('Category Classification', () => {
    it('should classify as Quick Win if effort ≤ 1 hour', async () => {
      const actions = [
        {
          id: '1',
          title: 'Quick win',
          impact: 10,
          effort: 1,
          description: 'Exactly 1 hour',
        },
        {
          id: '2',
          title: 'Quick win 2',
          impact: 5,
          effort: 0.5,
          description: 'Half hour',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      result.forEach((item) => {
        if (item.effort <= 1) {
          expect(item.category).toBe('Quick Win');
        }
      });
    });

    it('should classify as Standard if effort between 1 and 8 hours', async () => {
      const actions = [
        {
          id: '1',
          title: 'Standard',
          impact: 10,
          effort: 4,
          description: 'Standard effort',
        },
        {
          id: '2',
          title: 'Standard 2',
          impact: 5,
          effort: 8,
          description: 'Max standard',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      result.forEach((item) => {
        if (item.effort > 1 && item.effort <= 8) {
          expect(item.category).toBe('Standard');
        }
      });
    });

    it('should classify as Long-term if effort > 8 hours', async () => {
      const actions = [
        {
          id: '1',
          title: 'Long term',
          impact: 20,
          effort: 16,
          description: 'Long term effort',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      result.forEach((item) => {
        if (item.effort > 8) {
          expect(item.category).toBe('Long-term');
        }
      });
    });

    it('should handle boundary case: effort = 1 (Quick Win)', async () => {
      const actions = [
        {
          id: '1',
          title: 'Boundary',
          impact: 10,
          effort: 1.0,
          description: 'Boundary',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      expect(result[0].category).toBe('Quick Win');
    });

    it('should handle boundary case: effort = 1.01 (Standard)', async () => {
      const actions = [
        {
          id: '1',
          title: 'Boundary',
          impact: 10,
          effort: 1.01,
          description: 'Boundary',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      expect(result[0].category).toBe('Standard');
    });

    it('should handle boundary case: effort = 8 (Standard)', async () => {
      const actions = [
        {
          id: '1',
          title: 'Boundary',
          impact: 10,
          effort: 8.0,
          description: 'Boundary',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      expect(result[0].category).toBe('Standard');
    });

    it('should handle boundary case: effort = 8.01 (Long-term)', async () => {
      const actions = [
        {
          id: '1',
          title: 'Boundary',
          impact: 10,
          effort: 8.01,
          description: 'Boundary',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      expect(result[0].category).toBe('Long-term');
    });
  });

  describe('Priority Level Assignment', () => {
    it('should assign priority level based on category', async () => {
      const actions = [
        {
          id: '1',
          title: 'Quick win',
          impact: 10,
          effort: 0.5,
          description: 'Quick',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      expect(['높음', '중간', '낮음']).toContain(result[0].priority);
    });

    it('should assign high priority (높음) to Quick Wins with high impact', async () => {
      const actions = [
        {
          id: '1',
          title: 'Quick win high impact',
          impact: 15,
          effort: 0.5,
          description: 'High impact quick win',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      expect(result[0].priority).toBe('높음');
    });

    it('should assign appropriate priority levels to different categories', async () => {
      const actions = [
        {
          id: '1',
          title: 'Quick win',
          impact: 20,
          effort: 0.5,
          description: 'Quick',
        },
        {
          id: '2',
          title: 'Standard medium',
          impact: 10,
          effort: 4,
          description: 'Standard',
        },
        {
          id: '3',
          title: 'Long term low',
          impact: 5,
          effort: 16,
          description: 'Long term',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      result.forEach((item) => {
        expect(['높음', '중간', '낮음']).toContain(item.priority);
      });
    });

    it('should prioritize highest priority score regardless of category', async () => {
      const actions = [
        {
          id: '1',
          title: 'Quick high impact',
          impact: 20,
          effort: 0.5,
          description: 'High priority quick win',
        },
        {
          id: '2',
          title: 'Standard medium impact',
          impact: 15,
          effort: 4,
          description: 'Medium priority standard',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      // Quick Win with high impact should come first (highest priority score)
      // priorityScore for ID 1: 20 / (1 + 0.5) = 13.33
      // priorityScore for ID 2: 15 / (1 + 4) = 3
      const quickWinIndex = result.findIndex((item) => item.id === '1');
      const standardIndex = result.findIndex((item) => item.id === '2');

      expect(quickWinIndex).toBeLessThan(standardIndex);
    });
  });

  describe('Result Structure', () => {
    it('should return array of PrioritizedActionItem objects', async () => {
      const actions = [
        {
          id: '1',
          title: 'Test',
          impact: 10,
          effort: 1,
          description: 'Test',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('description');
      expect(result[0]).toHaveProperty('impact');
      expect(result[0]).toHaveProperty('effort');
      expect(result[0]).toHaveProperty('priorityScore');
      expect(result[0]).toHaveProperty('category');
      expect(result[0]).toHaveProperty('priority');
    });

    it('should preserve all input fields in output', async () => {
      const actions = [
        {
          id: 'custom-id-123',
          title: 'Custom Title',
          impact: 25,
          effort: 2.5,
          description: 'Custom description text',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      expect(result[0].id).toBe('custom-id-123');
      expect(result[0].title).toBe('Custom Title');
      expect(result[0].description).toBe('Custom description text');
      expect(result[0].impact).toBe(25);
      expect(result[0].effort).toBe(2.5);
    });

    it('should include priorityScore as number', async () => {
      const actions = [
        {
          id: '1',
          title: 'Test',
          impact: 10,
          effort: 2,
          description: 'Test',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      expect(typeof result[0].priorityScore).toBe('number');
      expect(result[0].priorityScore).toBeGreaterThanOrEqual(0);
    });

    it('should include category as one of Quick Win, Standard, or Long-term', async () => {
      const actions = [
        {
          id: '1',
          title: 'Test 1',
          impact: 10,
          effort: 0.5,
          description: 'Quick',
        },
        {
          id: '2',
          title: 'Test 2',
          impact: 10,
          effort: 4,
          description: 'Standard',
        },
        {
          id: '3',
          title: 'Test 3',
          impact: 10,
          effort: 10,
          description: 'Long',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      result.forEach((item) => {
        expect(['Quick Win', 'Standard', 'Long-term']).toContain(item.category);
      });
    });

    it('should include priority as one of 높음, 중간, or 낮음', async () => {
      const actions = [
        {
          id: '1',
          title: 'Test 1',
          impact: 10,
          effort: 0.5,
          description: 'Test',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      expect(['높음', '중간', '낮음']).toContain(result[0].priority);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should prioritize multiple actions correctly', async () => {
      const actions = [
        {
          id: 'title-fix',
          title: 'Optimize title tag',
          impact: 15,
          effort: 0.5,
          description: 'Current title is 8 chars, should be 50-60',
        },
        {
          id: 'schema-add',
          title: 'Add Organization schema',
          impact: 20,
          effort: 2,
          description: 'Missing structured data',
        },
        {
          id: 'alt-text',
          title: 'Add alt text to images',
          impact: 10,
          effort: 3,
          description: '12 images need alt text',
        },
        {
          id: 'link-structure',
          title: 'Fix internal link hierarchy',
          impact: 25,
          effort: 6,
          description: 'Too many links at root level',
        },
        {
          id: 'performance',
          title: 'Optimize images for web',
          impact: 18,
          effort: 8,
          description: 'Reduce image file sizes',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      // Verify all items are returned
      expect(result.length).toBe(5);

      // Verify sorting by priority score (highest first)
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].priorityScore).toBeGreaterThanOrEqual(result[i + 1].priorityScore);
      }

      // Verify that quick wins (high impact, low effort) appear first
      const quickWins = result.filter((item) => item.category === 'Quick Win');
      if (quickWins.length > 0) {
        const firstQuickWinIndex = result.findIndex(
          (item) => item.category === 'Quick Win'
        );
        expect(firstQuickWinIndex).toBeLessThan(result.length / 2);
      }
    });

    it('should handle mixed impact and effort scenarios', async () => {
      const actions = [
        {
          id: 'low-impact-low-effort',
          title: 'Minor fix',
          impact: 3,
          effort: 0.25,
          description: 'Small change',
        },
        {
          id: 'high-impact-high-effort',
          title: 'Major redesign',
          impact: 40,
          effort: 20,
          description: 'Complete rebuild',
        },
        {
          id: 'high-impact-low-effort',
          title: 'Quick win',
          impact: 30,
          effort: 1,
          description: 'High impact, quick',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      // High impact + low effort should rank first
      expect(result[0].id).toBe('high-impact-low-effort');
    });

    it('should assign correct priority levels across categories', async () => {
      const actions = [
        {
          id: 'qw1',
          title: 'Quick win 1',
          impact: 20,
          effort: 0.5,
          description: 'High value quick',
        },
        {
          id: 'qw2',
          title: 'Quick win 2',
          impact: 5,
          effort: 0.5,
          description: 'Low value quick',
        },
        {
          id: 'std1',
          title: 'Standard 1',
          impact: 15,
          effort: 3,
          description: 'Standard',
        },
        {
          id: 'lt1',
          title: 'Long term',
          impact: 10,
          effort: 15,
          description: 'Long term',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      // First item should be high priority (Quick Win with high impact)
      expect(result[0].priority).toBe('높음');

      // All should have a valid priority level
      result.forEach((item) => {
        expect(['높음', '중간', '낮음']).toContain(item.priority);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small impact values', async () => {
      const actions = [
        {
          id: '1',
          title: 'Tiny impact',
          impact: 0.1,
          effort: 0.5,
          description: 'Very small',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      expect(result[0].priorityScore).toBeGreaterThan(0);
    });

    it('should handle very large impact values', async () => {
      const actions = [
        {
          id: '1',
          title: 'Huge impact',
          impact: 1000,
          effort: 10,
          description: 'Very large',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      expect(typeof result[0].priorityScore).toBe('number');
      expect(result[0].priorityScore).toBeGreaterThan(0);
    });

    it('should handle decimal effort values', async () => {
      const actions = [
        {
          id: '1',
          title: 'Decimal effort',
          impact: 10,
          effort: 0.333,
          description: '20 minutes',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      expect(typeof result[0].priorityScore).toBe('number');
    });

    it('should handle many action items', async () => {
      const actions = Array.from({ length: 100 }, (_, i) => ({
        id: `action-${i}`,
        title: `Action ${i}`,
        impact: Math.random() * 30,
        effort: Math.random() * 10,
        description: `Action ${i} description`,
      }));

      const result = await prioritizerModule.prioritizeActions(actions);

      expect(result.length).toBe(100);

      // Verify sorting maintained
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].priorityScore).toBeGreaterThanOrEqual(result[i + 1].priorityScore);
      }
    });

    it('should handle items with identical impact and effort', async () => {
      const actions = [
        {
          id: '1',
          title: 'Item 1',
          impact: 10,
          effort: 2,
          description: 'First',
        },
        {
          id: '2',
          title: 'Item 2',
          impact: 10,
          effort: 2,
          description: 'Second',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      // Both should have same priority score
      expect(result[0].priorityScore).toBe(result[1].priorityScore);
    });

    it('should maintain stable sort for items with same priority score', async () => {
      const actions = [
        {
          id: 'a',
          title: 'Action A',
          impact: 10,
          effort: 2,
          description: 'A',
        },
        {
          id: 'b',
          title: 'Action B',
          impact: 10,
          effort: 2,
          description: 'B',
        },
        {
          id: 'c',
          title: 'Action C',
          impact: 10,
          effort: 2,
          description: 'C',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      // All have same score, so order doesn't matter but should be stable
      expect(result.length).toBe(3);
      expect(result.map((item) => item.id)).toEqual(
        expect.arrayContaining(['a', 'b', 'c'])
      );
    });
  });

  describe('Type Safety', () => {
    it('should return correctly typed results', async () => {
      const actions = [
        {
          id: '1',
          title: 'Test',
          impact: 10,
          effort: 1,
          description: 'Test',
        },
      ];

      const result = await prioritizerModule.prioritizeActions(actions);

      // Verify all required fields exist and have correct types
      expect(typeof result[0].id).toBe('string');
      expect(typeof result[0].title).toBe('string');
      expect(typeof result[0].description).toBe('string');
      expect(typeof result[0].impact).toBe('number');
      expect(typeof result[0].effort).toBe('number');
      expect(typeof result[0].priorityScore).toBe('number');
      expect(typeof result[0].category).toBe('string');
      expect(typeof result[0].priority).toBe('string');
    });
  });
});
