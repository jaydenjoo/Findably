'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#fafbfc] to-white pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      {/* Background blob with brand color at 5-10% opacity */}
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(43,124,255,0.06) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Dot pattern background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle, #dde0e4 0.5px, transparent 0.5px)',
          backgroundSize: '22px 22px',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left column: Badge, title, subtitle, CTAs, trust metrics */}
          <div className="lg:col-span-6 space-y-8 animate-fade-in" style={{ animationDelay: '0s' }}>
            {/* Badge */}
            <div
              className="inline-block animate-fade-in"
              style={{ animationDelay: '0.1s' }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold tracking-wide">
                <span className="inline-block w-2 h-2 bg-blue-600 rounded-full" />
                AI 마케팅 자동화 플랫폼
              </span>
            </div>

            {/* H1 Title */}
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter leading-tight animate-fade-in"
              style={{ animationDelay: '0.2s', letterSpacing: '-0.03em' }}
            >
              <span className="text-gray-900">
                URL 하나로
                <br />
                마케팅 전체를
                <br />
                진단받으세요
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className="text-lg text-gray-500 leading-relaxed max-w-xl animate-fade-in"
              style={{ animationDelay: '0.3s' }}
            >
              AI가 SEO, 콘텐츠, 검색 노출을 분석하고
              <br />
              즉시 실행 가능한 개선안을 제공합니다
            </p>

            {/* CTA Buttons */}
            <div
              className="flex flex-col sm:flex-row gap-4 animate-fade-in"
              style={{ animationDelay: '0.4s' }}
            >
              {/* Primary CTA */}
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold transition-all duration-200 hover:bg-blue-700 hover:shadow-lg hover:translate-y-[-2px] shadow-md"
              >
                무료 진단 시작하기 <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Secondary CTA */}
              <Link
                href="#demo"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold bg-white transition-all duration-200 hover:border-blue-600 hover:text-blue-600 hover:shadow-md hover:translate-y-[-2px]"
              >
                데모 보기
              </Link>
            </div>

            {/* Trust metrics */}
            <div
              className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 animate-fade-in"
              style={{ animationDelay: '0.5s' }}
            >
              <div className="text-center sm:text-left">
                <div className="text-2xl font-black text-blue-600">500+</div>
                <p className="text-sm text-gray-500">기업 진단</p>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-2xl font-black text-blue-600">32%</div>
                <p className="text-sm text-gray-500">평균 검색 노출 개선</p>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-2xl font-black text-blue-600">3분</div>
                <p className="text-sm text-gray-500">완료</p>
              </div>
            </div>
          </div>

          {/* Right column: Hero illustration/screenshot placeholder */}
          <div
            className="lg:col-span-6 animate-fade-in"
            style={{ animationDelay: '0.3s' }}
            role="region"
            aria-label="Hero illustration"
          >
            {/* Dashboard mockup placeholder with gradient background */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-blue-50 via-white to-gray-50 border border-gray-200 aspect-square lg:aspect-auto lg:h-96">
              {/* Mockup content */}
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="space-y-4 w-full">
                  {/* Mock header */}
                  <div className="h-8 bg-gray-200 rounded-lg w-32" />

                  {/* Mock content bars */}
                  <div className="space-y-3">
                    <div className="h-4 bg-blue-100 rounded w-full" />
                    <div className="h-4 bg-blue-100 rounded w-5/6" />
                    <div className="h-4 bg-gray-100 rounded w-4/6" />
                  </div>

                  {/* Mock score circle */}
                  <div className="flex justify-center mt-8">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-black text-3xl">
                      87
                    </div>
                  </div>
                </div>
              </div>

              {/* Float animation overlay */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-full h-full pointer-events-none" />
            </div>
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
