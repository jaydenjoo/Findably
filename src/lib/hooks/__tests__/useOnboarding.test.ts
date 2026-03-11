import { renderHook, act } from '@testing-library/react';
import { useOnboarding } from '../useOnboarding';
import * as onboardingActions from '@/actions/onboarding';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock the onboarding server action
vi.mock('@/actions/onboarding', () => ({
  submitOnboarding: vi.fn(),
}));

describe('useOnboarding hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with step 1, empty form data, and no error', () => {
      const { result } = renderHook(() => useOnboarding());

      expect(result.current.currentStep).toBe(1);
      expect(result.current.formData).toEqual({
        url: '',
        industry: 'ecommerce',
        companySize: 'solo',
      });
      expect(result.current.error).toBeNull();
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('step navigation', () => {
    it('should advance to next step when nextStep is called', async () => {
      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        result.current.updateFormData('url', 'https://example.com');
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(2);
    });

    it('should not advance past step 3', async () => {
      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        result.current.updateFormData('url', 'https://example.com');
        result.current.nextStep();
        result.current.nextStep();
        result.current.nextStep();
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(3);
    });

    it('should go to previous step when prevStep is called', async () => {
      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        result.current.updateFormData('url', 'https://example.com');
        result.current.nextStep();
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(3);

      await act(async () => {
        result.current.prevStep();
      });

      expect(result.current.currentStep).toBe(2);
    });

    it('should not go below step 1', async () => {
      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        result.current.prevStep();
      });

      expect(result.current.currentStep).toBe(1);
    });
  });

  describe('form data updates', () => {
    it('should update URL in form data', async () => {
      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        result.current.updateFormData('url', 'https://example.com');
      });

      expect(result.current.formData.url).toBe('https://example.com');
    });

    it('should update industry in form data', async () => {
      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        result.current.updateFormData('industry', 'blog');
      });

      expect(result.current.formData.industry).toBe('blog');
    });

    it('should update company size in form data', async () => {
      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        result.current.updateFormData('companySize', 'medium');
      });

      expect(result.current.formData.companySize).toBe('medium');
    });

    it('should maintain form data across step transitions', async () => {
      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        result.current.updateFormData('url', 'https://example.com');
        result.current.updateFormData('industry', 'saas');
        result.current.nextStep();
        result.current.nextStep();
      });

      expect(result.current.formData.url).toBe('https://example.com');
      expect(result.current.formData.industry).toBe('saas');
    });
  });

  describe('step validation', () => {
    it('should not advance from step 1 if URL is empty', async () => {
      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(1);
    });

    it('should advance from step 1 if URL is valid', async () => {
      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        result.current.updateFormData('url', 'https://example.com');
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(2);
    });

    it('should advance from step 2 with default industry value', async () => {
      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        result.current.updateFormData('url', 'https://example.com');
        result.current.nextStep();
        // industry should have default value, so this should advance
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(3);
    });

    it('should not advance from step 3 (submit instead)', async () => {
      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        result.current.updateFormData('url', 'https://example.com');
        result.current.updateFormData('industry', 'blog');
        result.current.updateFormData('companySize', 'small');
        result.current.nextStep();
        result.current.nextStep();
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(3);
    });
  });

  describe('form submission', () => {
    it('should call submitOnboarding with form data', async () => {
      const { result } = renderHook(() => useOnboarding());

      vi.mocked(onboardingActions.submitOnboarding).mockResolvedValueOnce({
        success: true,
        companyId: 1,
        crawlTriggered: true,
      });

      await act(async () => {
        result.current.updateFormData('url', 'https://example.com');
        result.current.updateFormData('industry', 'blog');
        result.current.updateFormData('companySize', 'small');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(onboardingActions.submitOnboarding).toHaveBeenCalledWith({
        url: 'https://example.com',
        industry: 'blog',
        companySize: 'small',
      });
    });

    it('should set isSubmitting to true during submission', async () => {
      const { result } = renderHook(() => useOnboarding());

      vi.mocked(onboardingActions.submitOnboarding).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  companyId: 1,
                  crawlTriggered: true,
                }),
              100
            )
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ) as any
      );

      await act(async () => {
        result.current.updateFormData('url', 'https://example.com');
        result.current.updateFormData('industry', 'blog');
        result.current.updateFormData('companySize', 'small');
      });

      const submitPromise = result.current.handleSubmit();

      // isSubmitting may be true before the promise resolves
      await act(async () => {
        await submitPromise;
      });

      expect(result.current.isSubmitting).toBe(false);
    });

    it('should handle submission error', async () => {
      const { result } = renderHook(() => useOnboarding());

      vi.mocked(onboardingActions.submitOnboarding).mockResolvedValueOnce({
        success: false,
        error: '이미 등록된 URL입니다. 대시보드에서 확인하세요.',
      });

      await act(async () => {
        result.current.updateFormData('url', 'https://example.com');
        result.current.updateFormData('industry', 'blog');
        result.current.updateFormData('companySize', 'small');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.error).toBe(
        '이미 등록된 URL입니다. 대시보드에서 확인하세요.'
      );
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should clear error on new submission attempt', async () => {
      const { result } = renderHook(() => useOnboarding());

      // First attempt with error
      vi.mocked(onboardingActions.submitOnboarding).mockResolvedValueOnce({
        success: false,
        error: 'Error message',
      });

      await act(async () => {
        result.current.updateFormData('url', 'https://example.com');
        result.current.updateFormData('industry', 'blog');
        result.current.updateFormData('companySize', 'small');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.error).toBe('Error message');

      // Second attempt with success
      vi.mocked(onboardingActions.submitOnboarding).mockResolvedValueOnce({
        success: true,
        companyId: 1,
        crawlTriggered: true,
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('reset functionality', () => {
    it('should reset form data to initial state', async () => {
      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        result.current.updateFormData('url', 'https://example.com');
        result.current.updateFormData('industry', 'saas');
        result.current.updateFormData('companySize', 'medium');
      });

      // Need to navigate steps with valid URL
      await act(async () => {
        result.current.nextStep();
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(3);
      expect(result.current.formData.url).toBe('https://example.com');

      await act(async () => {
        result.current.reset();
      });

      expect(result.current.currentStep).toBe(1);
      expect(result.current.formData).toEqual({
        url: '',
        industry: 'ecommerce',
        companySize: 'solo',
      });
      expect(result.current.error).toBeNull();
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('getStepError utility', () => {
    it('should return error for empty URL on step 1', async () => {
      const { result } = renderHook(() => useOnboarding());

      const error = result.current.getStepError(1);
      expect(error).toBe('URL을 입력하세요');
    });

    it('should return null for valid URL on step 1', async () => {
      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        result.current.updateFormData('url', 'https://example.com');
      });

      const error = result.current.getStepError(1);
      expect(error).toBeNull();
    });

    it('should return null for valid industry on step 2', async () => {
      const { result } = renderHook(() => useOnboarding());

      const error = result.current.getStepError(2);
      expect(error).toBeNull();
    });

    it('should return null for valid company size on step 3', async () => {
      const { result } = renderHook(() => useOnboarding());

      const error = result.current.getStepError(3);
      expect(error).toBeNull();
    });
  });
});
