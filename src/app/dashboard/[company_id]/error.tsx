'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: unknown;
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">오류 발생</h1>
        <p className="text-gray-600 mb-6">
          대시보드를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={reset} variant="default">
            다시 시도
          </Button>
          <Link href="/dashboard">
            <Button variant="outline">대시보드로</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
