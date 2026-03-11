'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ScoreCircle from './score-circle';

interface DashboardTabsProps {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export default function DashboardTabs({ score, grade }: DashboardTabsProps) {
  const categoryScores = {
    seo: Math.floor(score * 0.35),
    geo: Math.floor(score * 0.35),
    performance: Math.floor(score * 0.2),
    ai: Math.floor(score * 0.1),
  };

  return (
    <Tabs defaultValue="score" className="w-full">
      <TabsList className="grid w-full grid-cols-5 border-b bg-white p-0 h-auto">
        <TabsTrigger
          value="score"
          className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-brand data-[state=active]:bg-white"
        >
          종합 점수
        </TabsTrigger>
        <TabsTrigger
          value="actions"
          className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-brand data-[state=active]:bg-white"
        >
          개선 항목
        </TabsTrigger>
        <TabsTrigger
          value="schema"
          className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-brand data-[state=active]:bg-white"
        >
          Schema Markup
        </TabsTrigger>
        <TabsTrigger
          value="meta"
          className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-brand data-[state=active]:bg-white"
        >
          메타 태그
        </TabsTrigger>
        <TabsTrigger
          value="insights"
          className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-brand data-[state=active]:bg-white"
        >
          AI 인사이트
        </TabsTrigger>
      </TabsList>

      {/* Score Tab */}
      <TabsContent value="score" className="p-6 space-y-8">
        <div className="flex flex-col items-center justify-center">
          <ScoreCircle score={score} grade={grade} />
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            귀사 마케팅 건강도: {grade}등급 ({score}점) 🎉
          </h2>
        </div>

        {/* Category breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <div className="text-sm font-medium text-blue-700 mb-2">
              SEO (35% 가중치)
            </div>
            <div className="text-3xl font-bold text-blue-900">
              {categoryScores.seo}
            </div>
            <div className="text-xs text-blue-600 mt-1">/100</div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-6 border border-emerald-200">
            <div className="text-sm font-medium text-emerald-700 mb-2">
              GEO (35% 가중치)
            </div>
            <div className="text-3xl font-bold text-emerald-900">
              {categoryScores.geo}
            </div>
            <div className="text-xs text-emerald-600 mt-1">/100</div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-6 border border-amber-200">
            <div className="text-sm font-medium text-amber-700 mb-2">
              성능 (20% 가중치)
            </div>
            <div className="text-3xl font-bold text-amber-900">
              {categoryScores.performance}
            </div>
            <div className="text-xs text-amber-600 mt-1">/100</div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
            <div className="text-sm font-medium text-purple-700 mb-2">
              AI 분석 (10% 가중치)
            </div>
            <div className="text-3xl font-bold text-purple-900">
              {categoryScores.ai}
            </div>
            <div className="text-xs text-purple-600 mt-1">/100</div>
          </div>
        </div>
      </TabsContent>

      {/* Action Items Tab */}
      <TabsContent value="actions" className="p-6">
        <div className="text-center text-gray-500 py-12">
          개선 항목은 다음 Task에서 구현됩니다
        </div>
      </TabsContent>

      {/* Schema Tab */}
      <TabsContent value="schema" className="p-6">
        <div className="text-center text-gray-500 py-12">
          Schema Markup 생성은 다음 Task에서 구현됩니다
        </div>
      </TabsContent>

      {/* Meta Tags Tab */}
      <TabsContent value="meta" className="p-6">
        <div className="text-center text-gray-500 py-12">
          메타 태그 최적화는 다음 Task에서 구현됩니다
        </div>
      </TabsContent>

      {/* Insights Tab */}
      <TabsContent value="insights" className="p-6">
        <div className="text-center text-gray-500 py-12">
          AI 인사이트는 다음 Task에서 구현됩니다
        </div>
      </TabsContent>
    </Tabs>
  );
}
