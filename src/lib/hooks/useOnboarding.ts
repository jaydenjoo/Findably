'use client';

/**
 * useOnboarding Hook
 *
 * Custom React hook for managing onboarding form state, validation, and submission.
 * Handles step navigation, form data updates, and server action calls.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { submitOnboarding } from '@/actions/onboarding';
import {
  OnboardingFormSchema,
  OnboardingFormData,
  URLValidationSchema,
} from '@/lib/validations/onboarding';

interface UseOnboardingState {
  currentStep: number;
  formData: OnboardingFormData;
  error: string | null;
  isSubmitting: boolean;
}

export function useOnboarding() {
  const router = useRouter();

  const [state, setState] = useState<UseOnboardingState>({
    currentStep: 1,
    formData: {
      url: '',
      industry: 'ecommerce',
      companySize: 'solo',
    },
    error: null,
    isSubmitting: false,
  });

  // Store form data in ref for accessing in handleSubmit
  const formDataRef = useRef(state.formData);

  // Update ref when form data changes
  useEffect(() => {
    formDataRef.current = state.formData;
  }, [state.formData]);

  /**
   * Validates the current step before advancing
   */
  const validateCurrentStep = useCallback((step: number, formData: OnboardingFormData): boolean => {
    switch (step) {
      case 1: {
        // Validate URL on Step 1
        const urlValidation = URLValidationSchema.safeParse({
          url: formData.url,
        });
        return urlValidation.success;
      }
      case 2: {
        // Industry has default value, always valid
        return true;
      }
      case 3: {
        // Company size has default value, always valid
        return true;
      }
      default:
        return true;
    }
  }, []);

  /**
   * Get validation error for a specific step
   */
  const getStepError = useCallback(
    (step: number): string | null => {
      switch (step) {
        case 1: {
          const urlValidation = URLValidationSchema.safeParse({
            url: state.formData.url,
          });
          if (!urlValidation.success) {
            return urlValidation.error.issues[0]?.message || '올바른 URL을 입력하세요';
          }
          return null;
        }
        case 2:
        case 3:
          return null;
        default:
          return null;
      }
    },
    [state.formData.url]
  );

  /**
   * Advance to next step with validation
   */
  const nextStep = useCallback(() => {
    setState((prev) => {
      if (prev.currentStep >= 3) {
        return prev;
      }

      // Validate current step before advancing
      if (!validateCurrentStep(prev.currentStep, prev.formData)) {
        return prev;
      }

      return {
        ...prev,
        currentStep: prev.currentStep + 1,
      };
    });
  }, [validateCurrentStep]);

  /**
   * Go back to previous step
   */
  const prevStep = useCallback(() => {
    setState((prev) => {
      if (prev.currentStep <= 1) {
        return prev;
      }

      return {
        ...prev,
        currentStep: prev.currentStep - 1,
      };
    });
  }, []);

  /**
   * Update form data field
   */
  const updateFormData = useCallback(
    (field: keyof OnboardingFormData, value: unknown) => {
      setState((prev) => ({
        ...prev,
        formData: {
          ...prev.formData,
          [field]: value,
        },
      }));
    },
    []
  );

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async () => {
    // Get current form data from ref
    const currentFormData = formDataRef.current;

    // Clear previous error and set submitting state
    setState((prev) => ({
      ...prev,
      error: null,
      isSubmitting: true,
    }));

    try {
      // Validate entire form
      const validation = OnboardingFormSchema.safeParse(currentFormData);
      if (!validation.success) {
        const errorMessage = validation.error.issues[0]?.message || '입력 정보를 확인하세요';
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          error: errorMessage,
        }));
        return;
      }

      // Call server action
      const result = await submitOnboarding(validation.data);

      if (!result.success) {
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          error: result.error || '서버 오류가 발생했습니다. 다시 시도해주세요.',
        }));
        return;
      }

      // Success: redirect to diagnosis page
      setState((prev) => ({
        ...prev,
        isSubmitting: false,
      }));

      router.push(`/onboarding/diagnosing?company_id=${result.companyId}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '서버 오류가 발생했습니다. 다시 시도해주세요.';

      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        error: errorMessage,
      }));
    }
  }, [router]);

  /**
   * Reset form to initial state
   */
  const reset = useCallback(() => {
    setState({
      currentStep: 1,
      formData: {
        url: '',
        industry: 'ecommerce',
        companySize: 'solo',
      },
      error: null,
      isSubmitting: false,
    });
  }, []);

  return {
    // State
    currentStep: state.currentStep,
    formData: state.formData,
    error: state.error,
    isSubmitting: state.isSubmitting,

    // Methods
    nextStep,
    prevStep,
    updateFormData,
    handleSubmit,
    reset,
    getStepError,
    validateCurrentStep,
  };
}
