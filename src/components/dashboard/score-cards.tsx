'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

/**
 * Detail item from scoring modules
 * Can include either points or points+maxPoints
 */
interface DetailItem {
  item: string;
  points: number;
  maxPoints?: number;
  status: 'pass' | 'partial' | 'fail';
}

interface ScoreCardsProps {
  seoScore: number;
  geoScore: number;
  performanceScore: number;
  aiScore: number | null;
  seoDetails?: DetailItem[];
  geoDetails?: DetailItem[];
  performanceDetails?: {
    mobileScore: number | null;
    desktopScore: number | null;
  };
}

/**
 * Determines progress bar color based on score
 * ≥85 green, ≥70 blue, ≥55 yellow, ≥40 orange, <40 red
 */
function getProgressColor(score: number | null): string {
  if (score === null) return 'bg-gray-300';
  if (score >= 85) return 'bg-emerald-500';
  if (score >= 70) return 'bg-blue-500';
  if (score >= 55) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

/**
 * Returns icon and color for status indicator
 */
function getStatusIcon(status: 'pass' | 'partial' | 'fail'): {
  icon: string;
  color: string;
} {
  switch (status) {
    case 'pass':
      return { icon: '✓', color: 'text-emerald-600' };
    case 'partial':
      return { icon: '△', color: 'text-yellow-600' };
    case 'fail':
      return { icon: '✗', color: 'text-red-600' };
  }
}

interface CategoryCardProps {
  category: string;
  weight: string;
  score: number | null;
  details?: DetailItem[];
  performanceDetail?: {
    mobileScore: number | null;
    desktopScore: number | null;
  };
  animationDelay: string;
}

/**
 * Individual category score card with expandable details
 */
function CategoryCard({
  category,
  weight,
  score,
  details,
  performanceDetail,
  animationDelay,
}: CategoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasDetails =
    (details && details.length > 0) || (performanceDetail && typeof performanceDetail === 'object');

  return (
    <Card
      className="flex flex-col gap-4 rounded-lg border border-gray-200 p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={{
        animation: 'fadeInUp 0.6s ease-out both',
        animationDelay,
      }}
      data-testid="score-card"
    >
      {/* Header: Icon + Category + Weight Badge */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Category Icon in brand-light circle */}
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50"
            data-testid="category-icon"
          >
            <span className="text-lg font-semibold text-blue-600">
              {category.charAt(0).toUpperCase()}
            </span>
          </div>

          <div>
            <h3 className="text-base font-semibold text-gray-900">{category}</h3>
          </div>
        </div>

        {/* Weight Badge */}
        <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
          {weight}
        </span>
      </div>

      {/* Score Display */}
      {score === null ? (
        <div className="flex flex-col gap-2">
          <div className="text-sm text-gray-600">분석 불가</div>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-gray-900">{score}</span>
            <span className="text-lg font-medium text-gray-500">/100</span>
          </div>

          {/* Progress Bar */}
          <div className="flex flex-col gap-2">
            <Progress
              value={Math.min(score, 100)}
              className="h-2"
              style={{
                background: '#e2e6ea',
              }}
            />
            {/* Custom progress bar overlay for color */}
            <div
              className={`absolute left-0 right-0 mt-0 h-2 ${getProgressColor(score)}`}
              style={{
                width: `${(score / 100) * 100}%`,
                borderRadius: '9999px',
                margin: '0',
              }}
              role="progressbar"
              aria-valuenow={score}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </>
      )}

      {/* Expandable Details */}
      {hasDetails && (
        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex w-full items-center justify-between rounded px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <span>세부 사항</span>
            <ChevronDown
              size={18}
              className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          {isExpanded && (
            <div className="mt-3 space-y-2">
              {/* SEO/GEO Details */}
              {details?.map((detail, index) => (
                <div
                  key={index}
                  data-status={detail.status}
                  className="flex items-start gap-2 rounded bg-gray-50 p-2 text-sm"
                >
                  <span className={`${getStatusIcon(detail.status).color} flex-shrink-0 font-bold`}>
                    {getStatusIcon(detail.status).icon}
                  </span>
                  <div className="flex-1">
                    <div className="text-gray-900">{detail.item}</div>
                    <div className="text-xs text-gray-600">
                      {detail.points}/{detail.maxPoints ?? detail.points}점
                    </div>
                  </div>
                </div>
              ))}

              {/* Performance Details (Mobile/Desktop) */}
              {performanceDetail && (
                <>
                  <div className="flex items-start gap-2 rounded bg-gray-50 p-2 text-sm">
                    <span className={`${getStatusIcon(performanceDetail.mobileScore ? performanceDetail.mobileScore >= 70 ? 'pass' : 'fail' : 'fail').color} flex-shrink-0 font-bold`}>
                      {getStatusIcon(performanceDetail.mobileScore ? performanceDetail.mobileScore >= 70 ? 'pass' : 'fail' : 'fail').icon}
                    </span>
                    <div className="flex-1">
                      <div className="text-gray-900">모바일 성능</div>
                      <div className="text-xs text-gray-600">
                        {performanceDetail.mobileScore ?? 'N/A'}점
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded bg-gray-50 p-2 text-sm">
                    <span className={`${getStatusIcon(performanceDetail.desktopScore ? performanceDetail.desktopScore >= 70 ? 'pass' : 'fail' : 'fail').color} flex-shrink-0 font-bold`}>
                      {getStatusIcon(performanceDetail.desktopScore ? performanceDetail.desktopScore >= 70 ? 'pass' : 'fail' : 'fail').icon}
                    </span>
                    <div className="flex-1">
                      <div className="text-gray-900">데스크톱 성능</div>
                      <div className="text-xs text-gray-600">
                        {performanceDetail.desktopScore ?? 'N/A'}점
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

/**
 * ScoreCards Component
 * Displays 4 category score cards (SEO/GEO/Performance/AI) in a grid
 * Each card shows score, progress bar, weight %, and expandable details
 * Responsive: 2x2 on desktop, 1 column on mobile
 */
export default function ScoreCards({
  seoScore,
  geoScore,
  performanceScore,
  aiScore,
  seoDetails,
  geoDetails,
  performanceDetails,
}: ScoreCardsProps) {
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
        {/* SEO Card */}
        <CategoryCard
          category="SEO"
          weight="35%"
          score={seoScore}
          details={seoDetails}
          animationDelay="0.1s"
        />

        {/* GEO Card */}
        <CategoryCard
          category="GEO"
          weight="35%"
          score={geoScore}
          details={geoDetails}
          animationDelay="0.2s"
        />

        {/* Performance Card */}
        <CategoryCard
          category="성능"
          weight="20%"
          score={performanceScore}
          performanceDetail={performanceDetails}
          animationDelay="0.3s"
        />

        {/* AI Card */}
        <CategoryCard
          category="AI 분석"
          weight="10%"
          score={aiScore}
          animationDelay="0.4s"
        />
      </div>
    </div>
  );
}
