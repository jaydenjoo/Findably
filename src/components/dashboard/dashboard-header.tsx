'use client';

import { Button } from '@/components/ui/button';
import { RotateCw } from 'lucide-react';
import { useReDiagnosis } from '@/hooks/use-re-diagnosis';

interface DashboardHeaderProps {
  companyName: string;
  url: string;
  diagnosedAt: string;
  companyId: number;
}

export default function DashboardHeader({
  companyName,
  url,
  diagnosedAt,
  companyId,
}: DashboardHeaderProps) {
  const { state, isLoading, error, startReDiagnosis } =
    useReDiagnosis(companyId);

  // Format timestamp
  const diagnosedDate = new Date(diagnosedAt);
  const formattedTime = diagnosedDate.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col gap-4">
          {/* Top row: Company info and button */}
          <div className="flex items-center justify-between gap-4">
            {/* Left: Company info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {companyName}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand hover:underline"
                >
                  {url}
                </a>
                <span className="text-xs text-gray-500">
                  {formattedTime} 기준
                </span>
              </div>
            </div>

            {/* Right: Re-diagnose button */}
            <Button
              onClick={startReDiagnosis}
              disabled={isLoading}
              variant="outline"
              className="gap-2"
            >
              <RotateCw
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              />
              재진단
            </Button>
          </div>

          {/* Error message */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-md">
              {state === 'confirming' && '재진단 조건을 확인하는 중입니다...'}
              {state === 'loading' &&
                '크롤링과 진단을 수행하는 중입니다. 잠시만 기다려주세요...'}
            </div>
          )}

          {/* Success state */}
          {state === 'complete' && (
            <div className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-md">
              ✓ 재진단 완료! 점수가 업데이트되었습니다
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
