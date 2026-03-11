'use client';

/**
 * DiagnosingClient Component
 *
 * Displays diagnosis progress with polling for completion.
 * Features:
 * - Polls /api/diagnosis/status every 2 seconds
 * - Shows progress steps (크롤링 → AI 분석 → 결과 생성)
 * - Auto-redirects to dashboard on completion
 * - Shows timeout message after 10 retries (20 seconds)
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

interface DiagnosingClientProps {
  companyId: number;
}

type DiagnosisStatus = 'crawling' | 'analyzing' | 'complete' | 'failed';

interface StepState {
  name: string;
  status: 'pending' | 'active' | 'completed';
}

export default function DiagnosingClient({ companyId }: DiagnosingClientProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<DiagnosisStatus>('crawling');
  const [progressMessage, setProgressMessage] = useState('진단 중... (크롤링 대기 중)');
  const [retryCount, setRetryCount] = useState(0);
  const [isPolling, setIsPolling] = useState(true);
  const maxRetries = 10;

  // Compute steps based on current status
  const getSteps = (): StepState[] => {
    if (currentStatus === 'crawling') {
      return [
        { name: '크롤링', status: 'active' },
        { name: 'AI 분석', status: 'pending' },
        { name: '결과 생성', status: 'pending' },
      ];
    } else if (currentStatus === 'analyzing') {
      return [
        { name: '크롤링', status: 'completed' },
        { name: 'AI 분석', status: 'active' },
        { name: '결과 생성', status: 'pending' },
      ];
    } else if (currentStatus === 'complete') {
      return [
        { name: '크롤링', status: 'completed' },
        { name: 'AI 분석', status: 'completed' },
        { name: '결과 생성', status: 'completed' },
      ];
    }
    // Default for 'failed' or initial state
    return [
      { name: '크롤링', status: 'active' },
      { name: 'AI 분석', status: 'pending' },
      { name: '결과 생성', status: 'pending' },
    ];
  };

  const steps = getSteps();

  // Polling effect
  useEffect(() => {
    if (!isPolling) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(
          `/api/diagnosis/status?company_id=${companyId}`
        );

        if (!response.ok) {
          console.error('Failed to fetch diagnosis status:', response.status);
          return;
        }

        const data = await response.json();
        setCurrentStatus(data.status);
        setProgressMessage(data.message);

        // Handle completion
        if (data.status === 'complete') {
          setIsPolling(false);
          // Auto-redirect after brief delay to show completion message
          setTimeout(() => {
            router.push(`/dashboard/${companyId}`);
          }, 1500);
          return;
        }

        // Handle failure
        if (data.status === 'failed') {
          setIsPolling(false);
          return;
        }

        // Reset retry count on successful poll
        setRetryCount(0);
      } catch (error) {
        console.error('Error polling diagnosis status:', error);
        setRetryCount((prev) => prev + 1);

        // Stop polling after max retries
        if (retryCount + 1 >= maxRetries) {
          setIsPolling(false);
          setCurrentStatus('failed');
          setProgressMessage('크롤링이 실패했습니다. 잠시 후 다시 시도하세요');
        }
      }
    };

    // Initial poll immediately
    pollStatus();

    // Then set up interval for subsequent polls (every 2 seconds)
    const interval = setInterval(pollStatus, 2000);

    return () => clearInterval(interval);
  }, [isPolling, companyId, retryCount, router]);

  const handleRetry = () => {
    setRetryCount(0);
    setProgressMessage('진단 중... (크롤링 대기 중)');
    setCurrentStatus('crawling');
    setIsPolling(true);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#fafbfc] to-white p-4">
      {/* Decorative blob background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-20 w-96 h-96 bg-gradient-to-br from-[#2b7cff] to-transparent rounded-full opacity-5 blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-gradient-to-tr from-[#2b7cff] to-transparent rounded-full opacity-3 blur-3xl" />
      </div>

      {/* Main content */}
      <Card className="w-full max-w-lg rounded-2xl shadow-lg border border-[#e2e6ea] bg-white p-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#2b3038] mb-2">
            진단 중입니다
          </h1>
          <p className="text-base text-[#6c757d]">{progressMessage}</p>
        </div>

        {/* Animated spinner */}
        <div className="flex justify-center mb-8">
          <Loader2 className="w-16 h-16 text-[#2b7cff] animate-spin" />
        </div>

        {/* Progress steps */}
        <div className="space-y-4 mb-8">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-4">
              {/* Step icon */}
              <div className="relative w-10 h-10 flex-shrink-0">
                {step.status === 'completed' ? (
                  <div className="w-10 h-10 rounded-full bg-[#2a9d5c] flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                ) : step.status === 'active' ? (
                  <div className="w-10 h-10 rounded-full bg-[#2b7cff] flex items-center justify-center shadow-sm animate-pulse">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#e2e6ea] flex items-center justify-center">
                    <Circle className="w-5 h-5 text-[#adb5bd]" />
                  </div>
                )}
              </div>

              {/* Step label and badge */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-medium ${
                      step.status === 'completed'
                        ? 'text-[#2a9d5c]'
                        : step.status === 'active'
                          ? 'text-[#2b7cff]'
                          : 'text-[#adb5bd]'
                    }`}
                  >
                    {step.name}
                  </span>
                  {step.status === 'completed' && (
                    <span className="px-2 py-0.5 text-xs font-semibold text-[#2a9d5c] bg-[#e7f5ed] rounded-full">
                      완료
                    </span>
                  )}
                  {step.status === 'active' && (
                    <span className="px-2 py-0.5 text-xs font-semibold text-[#2b7cff] bg-[#e7f0ff] rounded-full animate-pulse">
                      진행 중
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Error state - show retry button */}
        {currentStatus === 'failed' && (
          <div className="text-center">
            <p className="text-sm text-[#dc3545] mb-4 font-medium">
              {progressMessage}
            </p>
            <Button
              onClick={handleRetry}
              className="bg-[#2b7cff] text-white hover:bg-[#1a5bc4] rounded-lg font-medium py-2 px-6 transition-all"
            >
              다시 시도
            </Button>
          </div>
        )}

        {/* Success state - show completion message */}
        {currentStatus === 'complete' && (
          <div className="text-center">
            <p className="text-sm text-[#2a9d5c] font-medium">
              진단이 완료되었습니다! 대시보드로 이동 중입니다...
            </p>
          </div>
        )}

        {/* Loading state info */}
        {currentStatus !== 'failed' && currentStatus !== 'complete' && (
          <p className="text-xs text-center text-[#adb5bd] mt-4">
            최대 20초 소요될 수 있습니다
          </p>
        )}
      </Card>
    </div>
  );
}
