/**
 * Constants and type definitions for action items
 */

export type ActionItemType = 'quick_win' | 'standard' | 'long_term';
export type ActionItemPriority = 'high' | 'medium' | 'low';
export type ActionItemEffort = '<1h' | '1-8h' | '>8h';

/**
 * Map priority to Korean label
 */
export function getPriorityLabel(priority: string): string {
  switch (priority) {
    case 'high':
      return '높음';
    case 'medium':
      return '중간';
    case 'low':
      return '낮음';
    default:
      return priority;
  }
}

/**
 * Map itemType to Korean label
 */
export function getCategoryLabel(itemType: string): string {
  switch (itemType) {
    case 'quick_win':
      return 'Quick Win';
    case 'standard':
      return '일반';
    case 'long_term':
      return '장기';
    default:
      return itemType;
  }
}

/**
 * Get priority badge color classes
 */
export function getPriorityBadgeColor(priority: string): string {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-700';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700';
    case 'low':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

/**
 * Get category badge color classes
 */
export function getCategoryBadgeColor(itemType: string): string {
  switch (itemType) {
    case 'quick_win':
      return 'bg-emerald-100 text-emerald-700';
    case 'standard':
      return 'bg-blue-100 text-blue-700';
    case 'long_term':
      return 'bg-purple-100 text-purple-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

/**
 * Map effort to Korean label
 */
export function getEffortLabel(effort: string | null): string {
  if (!effort) return '미지정';
  switch (effort) {
    case '<1h':
      return '1시간 이내';
    case '1-8h':
      return '1-8시간';
    case '>8h':
      return '8시간 이상';
    default:
      return effort;
  }
}

/**
 * Get priority score for sorting (higher = higher priority)
 */
export function getPrioritySortValue(priority: string): number {
  switch (priority) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
    default:
      return 0;
  }
}
