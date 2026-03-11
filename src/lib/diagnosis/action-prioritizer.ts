/**
 * Action Items Prioritization Module
 * Prioritizes action items based on impact and effort using priority score calculation
 */

/**
 * Input action item with impact and effort metrics
 */
export interface ActionItemWithMetrics {
  id: string;
  title: string;
  description: string;
  impact: number; // Expected score increase (%)
  effort: number; // Hours required
}

/**
 * Category of action item
 */
export type CategoryType = 'Quick Win' | 'Standard' | 'Long-term';

/**
 * Priority level
 */
export type PriorityLevel = '높음' | '중간' | '낮음';

/**
 * Prioritized action item with calculated metrics
 */
export interface PrioritizedActionItem extends ActionItemWithMetrics {
  priorityScore: number; // impact / (1 + effort)
  category: CategoryType; // Quick Win (≤1hr), Standard (1-8hr), Long-term (>8hr)
  priority: PriorityLevel; // 높음, 중간, 낮음
}

/**
 * Classifies action item into category based on effort
 */
function classifyCategory(effort: number): CategoryType {
  if (effort <= 1) {
    return 'Quick Win';
  } else if (effort <= 8) {
    return 'Standard';
  } else {
    return 'Long-term';
  }
}

/**
 * Calculates priority level based on priority score and category
 */
function calculatePriorityLevel(priorityScore: number, category: CategoryType): PriorityLevel {
  // Quick Wins are always high priority if they have any meaningful impact
  if (category === 'Quick Win') {
    if (priorityScore >= 5) {
      return '높음';
    } else if (priorityScore >= 1) {
      return '중간';
    } else {
      return '낮음';
    }
  }

  // Standard items get priority based on score
  if (category === 'Standard') {
    if (priorityScore >= 5) {
      return '높음';
    } else if (priorityScore >= 2) {
      return '중간';
    } else {
      return '낮음';
    }
  }

  // Long-term items get priority based on score
  if (priorityScore >= 3) {
    return '높음';
  } else if (priorityScore >= 1) {
    return '중간';
  } else {
    return '낮음';
  }
}

/**
 * Prioritizes action items based on impact and effort
 * Formula: priorityScore = impact / (1 + effort)
 * Sorts by priority score (highest first)
 *
 * @param actions - List of action items with impact and effort metrics
 * @returns Sorted list of prioritized action items with category and priority level
 *
 * @example
 * ```ts
 * const actions = [
 *   { id: '1', title: 'Add meta description', impact: 10, effort: 0.5, description: 'Quick win' },
 *   { id: '2', title: 'Redesign homepage', impact: 30, effort: 16, description: 'Long term' }
 * ];
 *
 * const prioritized = await prioritizeActions(actions);
 * // [
 * //   { id: '1', ..., priorityScore: 6.67, category: 'Quick Win', priority: '높음' },
 * //   { id: '2', ..., priorityScore: 1.88, category: 'Long-term', priority: '중간' }
 * // ]
 * ```
 */
export async function prioritizeActions(
  actions: ActionItemWithMetrics[]
): Promise<PrioritizedActionItem[]> {
  // Calculate priority scores and add metadata
  const prioritized = actions.map((action) => {
    // Priority score = impact / (1 + effort)
    const priorityScore = action.impact / (1 + action.effort);

    // Classify category based on effort
    const category = classifyCategory(action.effort);

    // Calculate priority level
    const priority = calculatePriorityLevel(priorityScore, category);

    return {
      ...action,
      priorityScore,
      category,
      priority,
    };
  });

  // Sort by priority score (highest first)
  // For items with same priority score, maintain input order (stable sort)
  prioritized.sort((a, b) => b.priorityScore - a.priorityScore);

  return prioritized;
}
