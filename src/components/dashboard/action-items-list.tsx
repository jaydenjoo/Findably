'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getCategoryBadgeColor,
  getCategoryLabel,
  getEffortLabel,
  getPriorityBadgeColor,
  getPriorityLabel,
  getPrioritySortValue,
  type ActionItemPriority,
  type ActionItemType,
} from '@/lib/action-items/constants';

/**
 * ActionItem type from database schema
 */
interface ActionItem {
  id: number;
  title: string;
  description: string;
  itemType: ActionItemType;
  priority: ActionItemPriority;
  expectedImpactScore: number | null;
  estimatedEffort: '<1h' | '1-8h' | '>8h' | null;
  completed: boolean;
}

interface ActionItemsListProps {
  items: ActionItem[];
  onToggleComplete?: (itemId: number, completed: boolean) => void;
}

/**
 * Individual action item card
 */
function ActionItemCard({
  item,
  onToggleComplete,
  animationDelay,
}: {
  item: ActionItem;
  onToggleComplete?: (itemId: number, completed: boolean) => void;
  animationDelay: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCheckChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onToggleComplete?.(item.id, e.target.checked);
  };

  return (
    <Card
      className={`flex flex-col gap-4 rounded-lg border border-gray-200 p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
        item.completed ? 'opacity-60' : ''
      }`}
      style={{
        animation: 'fadeInUp 0.6s ease-out both',
        animationDelay,
      }}
      data-testid="action-item-card"
      data-completed={item.completed}
    >
      {/* Header: Checkbox + Title + Priority Badge + Category Badge */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={item.completed}
            onChange={handleCheckChange}
            className="mt-1 cursor-pointer accent-blue-600"
            aria-label="완료 표시"
          />

          {/* Title & Description */}
          <div className="flex-1 min-w-0">
            <h3
              className={`text-base font-semibold break-words ${
                item.completed
                  ? 'line-through text-gray-500'
                  : 'text-gray-900'
              }`}
            >
              {item.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1 break-words">
              {item.description}
            </p>
          </div>
        </div>

        {/* Priority & Category Badges */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${getPriorityBadgeColor(
              item.priority
            )}`}
            data-priority={item.priority}
          >
            {getPriorityLabel(item.priority)}
          </span>
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${getCategoryBadgeColor(
              item.itemType
            )}`}
            data-category={item.itemType}
          >
            {getCategoryLabel(item.itemType)}
          </span>
        </div>
      </div>

      {/* Impact & Effort */}
      <div className="flex items-center gap-6 text-sm">
        {item.expectedImpactScore !== null && (
          <div className="flex items-center gap-1">
            <span className="text-gray-700 font-medium">
              +{item.expectedImpactScore}점
            </span>
          </div>
        )}
        {item.estimatedEffort && (
          <div className="flex items-center gap-1">
            <span className="text-gray-500">
              {getEffortLabel(item.estimatedEffort)}
            </span>
          </div>
        )}
      </div>

      {/* Expandable Details */}
      <div className="border-t border-gray-200 pt-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between rounded px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span>상세 정보</span>
          <ChevronDown
            size={18}
            className={`transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-3 text-sm">
            <div className="bg-gray-50 rounded p-3">
              <div className="font-medium text-gray-900 mb-1">설명</div>
              <p className="text-gray-700">{item.description}</p>
            </div>

            {/* Implementation steps placeholder */}
            <div className="bg-gray-50 rounded p-3">
              <div className="font-medium text-gray-900 mb-1">
                적용 방법
              </div>
              <ol className="list-decimal list-inside space-y-1 text-gray-700">
                <li>해당 페이지 편집 화면 열기</li>
                <li>필요한 정보 수정</li>
                <li>저장 및 배포</li>
              </ol>
            </div>

            {/* CMS Guide placeholder */}
            <div className="bg-gray-50 rounded p-3">
              <div className="font-medium text-gray-900 mb-1">
                CMS별 가이드
              </div>
              <p className="text-gray-700 text-xs">
                각 CMS별 상세 적용 가이드는 대시보드에서 제공됩니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * ActionItemsList Component
 * Displays action items with tab filtering by category
 * Shows priority badges, impact scores, effort estimates, and expandable details
 * Supports completion tracking via checkbox
 */
export default function ActionItemsList({
  items,
  onToggleComplete,
}: ActionItemsListProps) {
  // Filter items by category
  const quickWinItems = items.filter((item) => item.itemType === 'quick_win');
  const standardItems = items.filter((item) => item.itemType === 'standard');
  const longTermItems = items.filter((item) => item.itemType === 'long_term');

  // Sort items by priority (high > medium > low)
  const sortByPriority = (itemList: ActionItem[]) => {
    return [...itemList].sort(
      (a, b) =>
        getPrioritySortValue(b.priority) - getPrioritySortValue(a.priority)
    );
  };

  const renderItemsList = (itemList: ActionItem[], animationDelayStart = 0) => {
    if (itemList.length === 0) {
      return (
        <div className="flex h-32 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
          <p className="text-center text-gray-500">개선 항목이 없습니다</p>
        </div>
      );
    }

    const sorted = sortByPriority(itemList);
    return (
      <div className="grid gap-4 md:gap-6">
        {sorted.map((item, index) => (
          <ActionItemCard
            key={item.id}
            item={item}
            onToggleComplete={onToggleComplete}
            animationDelay={`${animationDelayStart + index * 0.08}s`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="w-full">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="quick_win">Quick Win</TabsTrigger>
          <TabsTrigger value="standard">일반</TabsTrigger>
          <TabsTrigger value="long_term">장기</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          {renderItemsList(
            sortByPriority(items),
            0
          )}
        </TabsContent>

        <TabsContent value="quick_win" className="mt-0">
          {renderItemsList(quickWinItems, 0)}
        </TabsContent>

        <TabsContent value="standard" className="mt-0">
          {renderItemsList(standardItems, 0)}
        </TabsContent>

        <TabsContent value="long_term" className="mt-0">
          {renderItemsList(longTermItems, 0)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
