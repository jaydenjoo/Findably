/**
 * Error Boundary for Onboarding Page
 *
 * Handles errors that occur during the onboarding flow.
 * Provides user-friendly error message and retry option.
 */

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function OnboardingError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Onboarding error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          문제가 발생했습니다
        </h1>
        <p className="text-gray-600 text-sm mb-6">
          온보딩 중에 예기치 않은 오류가 발생했습니다. 다시 시도해주세요.
        </p>
        <Button
          onClick={reset}
          className="bg-brand text-white hover:bg-brand-hover w-full"
        >
          다시 시도
        </Button>
        <Link
          href="/"
          className="block mt-4 text-brand text-sm hover:underline"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
