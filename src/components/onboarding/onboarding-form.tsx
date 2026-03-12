"use client";

/**
 * Onboarding Form Component
 *
 * Client-side form component that manages the 3-step onboarding flow.
 * Uses useOnboarding hook for state management, validation, and submission.
 */

import { useState } from "react";
import { useOnboarding } from "@/lib/hooks/useOnboarding";
import ProgressIndicator from "./progress-indicator";
import StepUrl from "./step-url";
import StepIndustry from "./step-industry";
import StepCompanySize from "./step-company-size";

const TOTAL_STEPS = 3;

export default function OnboardingForm() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const {
    currentStep,
    formData,
    error,
    isSubmitting,
    nextStep,
    prevStep,
    updateFormData,
    handleSubmit,
  } = useOnboarding();

  const handleUrlChange = (url: string) => {
    updateFormData("url", url);
  };

  const handleIndustryChange = (industry: string) => {
    updateFormData("industry", industry);
  };

  const handleCompanySizeChange = (companySize: string) => {
    updateFormData("companySize", companySize);
  };

  const handleNextStepWithTransition = async () => {
    setIsTransitioning(true);
    // Animate transition
    setTimeout(() => {
      nextStep();
      setIsTransitioning(false);
    }, 150);
  };

  const handlePreviousStepWithTransition = () => {
    setIsTransitioning(true);
    // Animate transition
    setTimeout(() => {
      prevStep();
      setIsTransitioning(false);
    }, 150);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      {/* Background dot pattern and blob */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, #2b7cff 0.5px, transparent 0.5px)",
          backgroundSize: "22px 22px",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none opacity-6"
        style={{
          background: "radial-gradient(circle, #2b7cff 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* Main container */}
      <div className="relative z-10 w-full max-w-2xl">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {/* Header */}
          <div className="px-8 py-12 sm:px-12 border-b border-gray-100">
            <h1 className="sr-only">마케팅 진단 온보딩</h1>
            <ProgressIndicator
              currentStep={currentStep}
              totalSteps={TOTAL_STEPS}
            />
          </div>

          {/* Content */}
          <div className="px-8 py-12 sm:px-12">
            <form onSubmit={(e) => e.preventDefault()} noValidate>
              {/* Step content with fade animation */}
              <div
                className={`transition-opacity duration-300 ${
                  isTransitioning ? "opacity-0" : "opacity-100"
                }`}
              >
                {currentStep === 1 && (
                  <StepUrl
                    url={formData.url}
                    onUrlChange={handleUrlChange}
                    onNext={handleNextStepWithTransition}
                  />
                )}

                {currentStep === 2 && (
                  <StepIndustry
                    industry={formData.industry}
                    onIndustryChange={handleIndustryChange}
                    onNext={handleNextStepWithTransition}
                    onPrev={handlePreviousStepWithTransition}
                  />
                )}

                {currentStep === 3 && (
                  <StepCompanySize
                    companySize={formData.companySize}
                    onCompanySizeChange={handleCompanySizeChange}
                    onPrev={handlePreviousStepWithTransition}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                  />
                )}
              </div>

              {/* Error message display */}
              {error && (
                <div
                  id="onboarding-error"
                  role="alert"
                  className="mt-6 p-4 rounded-lg bg-red-50 border border-red-200 flex gap-3"
                  aria-live="assertive"
                  aria-atomic="true"
                >
                  <span className="text-xl" aria-hidden="true">
                    ⚠️
                  </span>
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              {/* Navigation buttons for steps 1-2 */}
              {currentStep < TOTAL_STEPS && (
                <div className="flex gap-3 justify-between mt-8" role="group" aria-label="온보딩 탐색">
                  <button
                    type="button"
                    onClick={handlePreviousStepWithTransition}
                    disabled={currentStep === 1}
                    className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition min-h-[44px] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                    aria-label={`이전 단계로 이동 (현재: ${currentStep}/${TOTAL_STEPS})`}
                  >
                    이전
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStepWithTransition}
                    className="px-6 py-3 rounded-lg bg-brand text-white font-medium hover:bg-brand-hover transition min-h-[44px] ml-auto focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white"
                    aria-label={`다음 단계로 이동 (현재: ${currentStep}/${TOTAL_STEPS})`}
                  >
                    다음
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-sm text-gray-700 mt-6">
          진단 완료까지 약 3분이 소요됩니다
        </p>
      </div>
    </div>
  );
}
