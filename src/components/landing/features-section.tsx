'use client';

import { Brain, Zap, TrendingUp } from 'lucide-react';

export default function FeaturesSection() {
  return (
    <section className="relative w-full bg-white py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div
          className="text-center mb-16 animate-fade-in"
          style={{ animationDelay: '0s' }}
        >
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4"
            style={{ letterSpacing: '-0.02em' }}
          >
            왜 Findably인가요?
          </h2>
          <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
            AI 기반 마케팅 진단으로 당신의 웹사이트가 검색 엔진과 고객에게
            얼마나 최적화되어 있는지 즉시 파악하세요.
          </p>
        </div>

        {/* Asymmetric Grid: 1 large + 2 small cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Large Featured Card - AI Based Marketing Diagnosis */}
          <div
            className="lg:col-span-2 animate-fade-in relative overflow-hidden rounded-2xl p-8 sm:p-12 bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
            style={{ animationDelay: '0.1s' }}
          >
            {/* Background accent blob inside card */}
            <div
              className="absolute -top-20 -right-20 w-48 h-48 rounded-full pointer-events-none opacity-20"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
              }}
              aria-hidden="true"
            />

            <div className="relative z-10 space-y-6">
              {/* Icon in brand-light circle */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20">
                <Brain className="w-8 h-8 text-white" />
              </div>

              {/* Title */}
              <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                AI 기반 마케팅 진단
              </h3>

              {/* Description */}
              <p className="text-base sm:text-lg text-blue-100 leading-relaxed">
                AI가 웹사이트를 분석하고 SEO, 콘텐츠, 검색 노출도를 종합 평가해
                즉시 실행 가능한 개선안을 제공합니다.
              </p>
            </div>
          </div>

          {/* Small Card 1 - Schema Markup */}
          <div
            className="animate-fade-in relative overflow-hidden rounded-2xl p-8 bg-white border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            style={{ animationDelay: '0.2s' }}
          >
            {/* Icon in brand-light circle */}
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 mb-6">
              <Zap className="w-7 h-7 text-blue-600" />
            </div>

            {/* Title */}
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
              Schema Markup 자동 생성
            </h3>

            {/* Description */}
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              검색엔진이 이해하는 구조화 데이터를 자동으로 생성하여 AI 검색 노출도를
              즉시 높입니다.
            </p>
          </div>

          {/* Small Card 2 - Real-time Monitoring */}
          <div
            className="animate-fade-in relative overflow-hidden rounded-2xl p-8 bg-white border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            style={{ animationDelay: '0.3s' }}
          >
            {/* Icon in brand-light circle */}
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 mb-6">
              <TrendingUp className="w-7 h-7 text-blue-600" />
            </div>

            {/* Title */}
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
              실시간 모니터링
            </h3>

            {/* Description */}
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              검색 순위와 AI 인용 변화를 주간 단위로 추적하여 개선 효과를
              시각적으로 확인할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </section>
  );
}
