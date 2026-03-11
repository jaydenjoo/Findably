'use client';

import { Link as LinkIcon, Sparkles, BarChart3 } from 'lucide-react';

interface StepProps {
  number: number;
  title: string;
  description: string;
  time: string;
  icon: React.ReactNode;
  delay: string;
}

function Step({ number, title, description, time, icon, delay }: StepProps) {
  return (
    <div
      className="animate-fade-in flex flex-col items-center text-center relative px-4 py-8 rounded-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-md group"
      style={{ animationDelay: delay }}
    >
      {/* Number Badge */}
      <div className="mb-6 inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-lg shadow-md">
        {number}
      </div>

      {/* Icon in light background circle */}
      <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50">
        {icon}
      </div>

      {/* Step Title */}
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
        {title}
      </h3>

      {/* Step Description */}
      <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-xs leading-relaxed">
        {description}
      </p>

      {/* Time Badge */}
      <div className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
        {time}
      </div>
    </div>
  );
}

export default function HowItWorksSection() {
  return (
    <section className="relative w-full bg-white py-20 px-4 sm:px-6 lg:px-8">
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
            어떻게 작동하나요?
          </h2>
          <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
            3단계로 마케팅 진단을 완료하세요
          </p>
        </div>

        {/* Steps Container */}
        <div className="relative">
          {/* Grid: 1 column mobile, 3 columns desktop */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Step 1: URL Input */}
            <Step
              number={1}
              title="URL을 입력하세요"
              description="웹사이트 주소만 입력하면 AI가 자동으로 분석을 시작합니다"
              time="30초"
              icon={<LinkIcon className="w-10 h-10 text-blue-600" />}
              delay="0.1s"
            />

            {/* Step 2: AI Analysis */}
            <Step
              number={2}
              title="AI가 분석합니다"
              description="SEO, 콘텐츠, Schema Markup, 성능까지 종합 진단합니다"
              time="2-3분"
              icon={<Sparkles className="w-10 h-10 text-blue-600" />}
              delay="0.2s"
            />

            {/* Step 3: Review Results */}
            <Step
              number={3}
              title="결과를 확인하세요"
              description="종합 점수와 즉시 실행 가능한 개선안을 받아보세요"
              time="바로 확인"
              icon={<BarChart3 className="w-10 h-10 text-blue-600" />}
              delay="0.3s"
            />
          </div>

          {/* Connecting Line (Desktop Only) */}
          <div className="hidden md:block absolute top-8 left-[16.67%] right-[16.67%] h-1 pointer-events-none">
            <svg
              className="w-full h-full"
              viewBox="0 0 1000 4"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <line
                x1="0"
                y1="2"
                x2="1000"
                y2="2"
                stroke="#d1d5db"
                strokeWidth="2"
                strokeDasharray="8,4"
              />
            </svg>
          </div>

          {/* Mobile Connecting Lines (Vertical) */}
          <div className="md:hidden absolute left-1/2 top-20 bottom-0 w-0.5 bg-gray-300 transform -translate-x-1/2 pointer-events-none" />
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
