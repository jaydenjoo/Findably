/**
 * Error boundary for diagnosing page
 */

'use client';

import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function DiagnosingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Diagnosing page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#fafbfc] to-white p-4">
      {/* Decorative blob background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-20 w-96 h-96 bg-gradient-to-br from-[#2b7cff] to-transparent rounded-full opacity-5 blur-3xl" />
      </div>

      {/* Error card */}
      <Card className="w-full max-w-lg rounded-2xl shadow-lg border border-[#fccece] bg-white p-8 relative z-10">
        <div className="text-center">
          {/* Error icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#ffecec] rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-[#dc3545]" />
          </div>

          {/* Error heading */}
          <h1 className="text-2xl font-bold text-[#2b3038] mb-2">
            진단 중 오류 발생
          </h1>

          {/* Error message */}
          <p className="text-base text-[#6c757d] mb-4">
            진단 페이지를 로드하는 중 문제가 발생했습니다.
          </p>

          {/* Error details (if available) */}
          {error.message && (
            <div className="bg-[#fafbfc] border border-[#e2e6ea] rounded-lg p-3 mb-6 text-left">
              <p className="text-xs text-[#6c757d] font-mono break-words">
                {error.message}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              onClick={reset}
              className="flex-1 bg-[#2b7cff] text-white hover:bg-[#1a5bc4] rounded-lg font-medium py-2 transition-all"
            >
              다시 시도
            </Button>
            <Button
              onClick={() => (window.location.href = '/onboarding')}
              className="flex-1 border border-[#e2e6ea] text-[#2b3038] hover:bg-[#fafbfc] rounded-lg font-medium py-2 transition-all"
            >
              온보딩으로
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
