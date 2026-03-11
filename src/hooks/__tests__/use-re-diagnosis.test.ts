import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useReDiagnosis } from '../use-re-diagnosis';
import * as reDiagnosisActions from '@/actions/re-diagnosis';
import { useRouter } from 'next/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock Server Actions
vi.mock('@/actions/re-diagnosis', () => ({
  checkCanReDiagnose: vi.fn(),
  triggerReDiagnosis: vi.fn(),
}));

describe('useReDiagnosis hook', () => {
  const mockRouter = {
    refresh: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(mockRouter as unknown as ReturnType<typeof useRouter>);
  });

  it('should initialize with idle state', () => {
    const { result } = renderHook(() => useReDiagnosis(1));

    expect(result.current.state).toBe('idle');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle successful re-diagnosis flow', async () => {
    vi.useFakeTimers();

    vi.mocked(reDiagnosisActions.checkCanReDiagnose).mockResolvedValue({
      success: true,
      data: {
        canReDiagnose: true,
        lastDiagnosedAt: null,
      },
    });

    vi.mocked(reDiagnosisActions.triggerReDiagnosis).mockResolvedValue({
      success: true,
      data: {
        message: '재진단이 시작되었습니다',
      },
    });

    const { result } = renderHook(() => useReDiagnosis(1));

    expect(result.current.state).toBe('idle');

    await act(async () => {
      await result.current.startReDiagnosis();
    });

    expect(result.current.state).toBe('complete');
    expect(result.current.error).toBeNull();

    // Wait for setTimeout to complete
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockRouter.refresh).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('should handle error when rediagnosis was recently done', async () => {
    vi.mocked(reDiagnosisActions.triggerReDiagnosis).mockResolvedValue({
      success: false,
      data: {
        error: '진단이 최근 이루어졌습니다. 1시간 후에 다시 시도하세요',
      },
    });

    const { result } = renderHook(() => useReDiagnosis(1));

    await act(async () => {
      await result.current.startReDiagnosis();
    });

    expect(result.current.state).toBe('error');
    expect(result.current.error).toContain('1시간 후');
  });

  it('should update state during re-diagnosis flow', async () => {
    vi.useFakeTimers();

    vi.mocked(reDiagnosisActions.checkCanReDiagnose).mockResolvedValue({
      success: true,
      data: {
        canReDiagnose: true,
        lastDiagnosedAt: null,
      },
    });

    vi.mocked(reDiagnosisActions.triggerReDiagnosis).mockResolvedValue({
      success: true,
      data: {
        message: '재진단이 시작되었습니다',
      },
    });

    const { result } = renderHook(() => useReDiagnosis(1));

    // Start the re-diagnosis
    await act(async () => {
      const promise = result.current.startReDiagnosis();
      await promise;
    });

    // State should progress through the flow
    expect(result.current.state).toBe('complete');
    expect(result.current.error).toBeNull();

    vi.useRealTimers();
  });

  it('should handle database errors', async () => {
    vi.mocked(reDiagnosisActions.triggerReDiagnosis).mockResolvedValue({
      success: false,
      data: {
        error: 'DB 에러가 발생했습니다',
      },
    });

    const { result } = renderHook(() => useReDiagnosis(1));

    await act(async () => {
      await result.current.startReDiagnosis();
    });

    expect(result.current.state).toBe('error');
    expect(result.current.error).toContain('DB 에러');
  });

  it('should reset state when calling reset', async () => {
    vi.mocked(reDiagnosisActions.triggerReDiagnosis).mockResolvedValue({
      success: false,
      data: {
        error: 'Test error',
      },
    });

    const { result } = renderHook(() => useReDiagnosis(1));

    await act(async () => {
      await result.current.startReDiagnosis();
    });

    expect(result.current.state).toBe('error');

    act(() => {
      result.current.reset();
    });

    expect(result.current.state).toBe('idle');
    expect(result.current.error).toBeNull();
  });
});
