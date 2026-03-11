"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="relative w-full py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gray-900 overflow-hidden">
      {/* Background Blob */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(43, 124, 255, 0.1) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-4xl">
        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white text-center mb-6 leading-tight">
          지금 바로 무료 진단을 시작하세요
        </h2>

        {/* Subtitle */}
        <p className="text-lg text-gray-300 text-center mb-10 max-w-2xl mx-auto">
          URL만 입력하면 3분 안에 마케팅 진단 결과를 받아볼 수 있습니다
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* Primary Button */}
          <Link href="/signup">
            <Button
              size="lg"
              className="rounded-xl bg-white text-gray-900 hover:bg-gray-100 font-semibold px-8 h-12 flex items-center gap-2 transition-all duration-200 hover:shadow-lg"
            >
              무료 진단 시작하기
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>

          {/* Secondary Button */}
          <Link href="#pricing">
            <Button
              size="lg"
              variant="outline"
              className="rounded-xl border-white text-white hover:bg-white hover:bg-opacity-10 font-semibold px-8 h-12 transition-all duration-200"
            >
              가격 플랜 보기
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
