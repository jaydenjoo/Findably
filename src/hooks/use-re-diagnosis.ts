'use client';

/**
 * useReDiagnosis Custom Hook
 * Manages re-diagnosis state machine and flow
 *
 * State flow: idle → loading → complete OR error
 * - idle: Ready to start re-diagnosis
 * - confirming: User has clicked button, waiting for confirmation check
 * - loading: Crawling and diagnosis in progress
 * - complete: Re-diagnosis finished successfully
 * - error: An error occurred during process
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  checkCanReDiagnose,
  triggerReDiagnosis,
} from '@/actions/re-diagnosis';

type ReDiagnosisState = 'idle' | 'confirming' | 'loading' | 'complete' | 'error';

interface UseReDiagnosisReturn {
  state: ReDiagnosisState;
  isLoading: boolean;
  error: string | null;
  startReDiagnosis: () => Promise<void>;
  reset: () => void;
}

/**
 * Custom hook for managing re-diagnosis flow
 *
 * Usage:
 * ```tsx
 * const { state, isLoading, error, startReDiagnosis, reset } = useReDiagnosis(companyId);
 *
 * return (
 *   <>
 *     <button onClick={startReDiagnosis} disabled={isLoading}>
 *       재진단
 *     </button>
 *     {error && <p className="text-red-600">{error}</p>}
 *   </>
 * );
 * ```
 *
 * @param companyId - Company ID to re-diagnose
 * @returns State and control functions
 */
export function useReDiagnosis(companyId: number): UseReDiagnosisReturn {
  const router = useRouter();
  const [state, setState] = useState<ReDiagnosisState>('idle');
  const [error, setError] = useState<string | null>(null);

  const startReDiagnosis = useCallback(async () => {
    try {
      setState('confirming');
      setError(null);

      // Step 1: Check if re-diagnosis is allowed
      const checkResult = await checkCanReDiagnose(companyId);
      if (!checkResult.success) {
        setState('error');
        setError(checkResult.data.error);
        return;
      }

      if (!checkResult.data.canReDiagnose) {
        setState('error');
        setError(
          '진단이 최근 이루어졌습니다. 1시간 후에 다시 시도하세요'
        );
        return;
      }

      // Step 2: Trigger re-diagnosis
      setState('loading');
      const triggerResult = await triggerReDiagnosis(companyId);

      if (!triggerResult.success) {
        setState('error');
        setError(triggerResult.data.error);
        return;
      }

      // Step 3: Mark as complete and refresh
      setState('complete');

      // Show success toast and refresh dashboard
      // In a real app, use a toast library. For now, we just refresh.
      setTimeout(() => {
        router.refresh();
        setState('idle');
      }, 1000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '알 수 없는 오류';
      setState('error');
      setError(errorMessage);
    }
  }, [companyId, router]);

  const reset = useCallback(() => {
    setState('idle');
    setError(null);
  }, []);

  return {
    state,
    isLoading: state === 'loading' || state === 'confirming',
    error,
    startReDiagnosis,
    reset,
  };
}
