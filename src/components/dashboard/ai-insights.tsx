'use client';

import { ChevronRight, X } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Individual AI insight problem/recommendation
 */
interface InsightProblem {
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  icon: string;
  expectedBenefit: string;
  action: string;
  relatedActionItems?: string[];
  references?: string[];
}

/**
 * AI Insights data structure
 */
interface AIInsightsData {
  problems?: InsightProblem[];
  recommendations?: string[]; // Legacy format support
}

interface AIInsightsProps {
  aiInsights: AIInsightsData | null;
}

/**
 * Get background color based on severity
 */
function getSeverityColor(
  severity: 'high' | 'medium' | 'low'
): { bg: string; border: string; icon: string } {
  switch (severity) {
    case 'high':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: '⚠️',
      };
    case 'medium':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: '💡',
      };
    case 'low':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: '🎯',
      };
  }
}

/**
 * Individual insight card
 */
function InsightCard({
  problem,
  animationDelay,
  onExpand,
}: {
  problem: InsightProblem;
  animationDelay: string;
  onExpand: (problem: InsightProblem) => void;
}) {
  const colors = getSeverityColor(problem.severity);

  return (
    <Card
      className={`flex flex-col gap-4 rounded-lg border ${colors.bg} ${colors.border} p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
      style={{
        animation: 'fadeInUp 0.6s ease-out both',
        animationDelay,
      }}
      data-testid="insight-card"
    >
      {/* Header: Icon + Title + Benefit Badge */}
      <div className="flex items-start gap-3">
        {/* Icon Circle */}
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white text-xl">
          {problem.icon}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 break-words">
            {problem.title}
          </h3>
          <p className="mt-1 text-sm text-gray-600 break-words">
            {problem.description}
          </p>
        </div>
      </div>

      {/* Action text */}
      <div className="border-t border-gray-200 pt-4">
        <p className="text-sm text-gray-700 break-words">{problem.action}</p>
      </div>

      {/* Expected Benefit + Expand Button */}
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm font-medium text-gray-900">
          {problem.expectedBenefit}
        </div>
        <button
          onClick={() => onExpand(problem)}
          className="flex items-center gap-1 rounded px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors flex-shrink-0"
          aria-label="상세 보기"
        >
          상세 보기
          <ChevronRight size={16} />
        </button>
      </div>
    </Card>
  );
}

/**
 * Insight Detail Modal
 */
function InsightModal({
  problem,
  open,
  onClose,
}: {
  problem: InsightProblem | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!problem) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none"
            aria-label="닫기"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
          <DialogHeader>
            <div className="flex items-start gap-3 pr-8">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-50 text-2xl">
                {problem.icon}
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl">{problem.title}</DialogTitle>
                <p className="mt-2 text-sm text-gray-600 break-words">
                  {problem.description}
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="space-y-6">
          {/* Expected Benefit */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <div className="text-sm font-medium text-gray-700 mb-1">
              예상 효과
            </div>
            <div className="text-lg font-semibold text-blue-600">
              {problem.expectedBenefit}
            </div>
          </div>

          {/* Recommended Action */}
          <div>
            <div className="text-sm font-medium text-gray-900 mb-2">
              추천 액션
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-gray-700">
              {problem.action}
            </div>
          </div>

          {/* Related Action Items */}
          {problem.relatedActionItems && problem.relatedActionItems.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-900 mb-2">
                관련 액션 아이템
              </div>
              <div className="space-y-2">
                {problem.relatedActionItems.map((itemId) => (
                  <div
                    key={itemId}
                    className="rounded bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  >
                    {itemId}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reference Links */}
          {problem.references && problem.references.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-900 mb-2">
                참고 자료
              </div>
              <div className="space-y-2">
                {problem.references.map((ref, index) => (
                  <a
                    key={index}
                    href={ref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-blue-600 hover:bg-gray-100 transition-colors"
                  >
                    <ChevronRight size={14} />
                    {ref}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * AIInsights Component
 * Displays 3 AI insight cards (top 3 issues from Claude analysis)
 * Each card: problem title, recommended action, expected benefit
 * Clickable: expand to modal with detailed explanation + related action items + reference links
 * Content in Korean, practical and specific
 */
export default function AIInsights({ aiInsights }: AIInsightsProps) {
  const [selectedProblem, setSelectedProblem] = useState<InsightProblem | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);

  // Extract problems from aiInsights, limit to 3
  const problems = aiInsights?.problems || [];
  const displayProblems = problems.slice(0, 3);

  // Handle empty state
  if (!aiInsights || displayProblems.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
        <p className="text-center text-gray-500">
          AI 인사이트를 불러올 수 없습니다
        </p>
      </div>
    );
  }

  const handleExpand = (problem: InsightProblem) => {
    setSelectedProblem(problem);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedProblem(null);
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

      {/* Grid: 1 col on mobile, 3 cols on desktop */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-3">
        {displayProblems.map((problem, index) => (
          <InsightCard
            key={index}
            problem={problem}
            animationDelay={`${0.1 + index * 0.1}s`}
            onExpand={handleExpand}
          />
        ))}
      </div>

      {/* Modal for detailed view */}
      <InsightModal
        problem={selectedProblem}
        open={modalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
