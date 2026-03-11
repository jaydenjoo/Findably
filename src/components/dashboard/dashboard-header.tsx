'use client';

import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { RotateCw } from 'lucide-react';

interface DashboardHeaderProps {
  companyName: string;
  url: string;
  diagnosedAt: string;
  onReDiagnose?: () => Promise<void>;
}

export default function DashboardHeader({
  companyName,
  url,
  diagnosedAt,
  onReDiagnose,
}: DashboardHeaderProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleReDiagnose = async () => {
    if (!onReDiagnose) return;

    setIsLoading(true);
    try {
      await onReDiagnose();
    } finally {
      setIsLoading(false);
    }
  };

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
        <div className="flex items-center justify-between gap-4">
          {/* Left: Company info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{companyName}</h1>
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
            onClick={handleReDiagnose}
            disabled={isLoading}
            variant="outline"
            className="gap-2"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            재진단
          </Button>
        </div>
      </div>
    </header>
  );
}
