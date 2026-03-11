"use client";

/**
 * Onboarding Form Component
 *
 * Client-side form component that manages the 3-step onboarding flow.
 * Handles step transitions, form validation, and submission.
 */

import { useState } from "react";
import ProgressIndicator from "./progress-indicator";
import StepUrl from "./step-url";
import StepIndustry from "./step-industry";
import StepCompanySize from "./step-company-size";

const TOTAL_STEPS = 3;

interface FormData {
  url: string;
  industry: string;
  companySize: string;
}

export default function OnboardingForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    url: "",
    industry: "ecommerce",
    companySize: "solo",
  });

  const handleUrlChange = (url: string) => {
    setFormData((prev) => ({ ...prev, url }));
  };

  const handleIndustryChange = (industry: string) => {
    setFormData((prev) => ({ ...prev, industry }));
  };

  const handleCompanySizeChange = (companySize: string) => {
    setFormData((prev) => ({ ...prev, companySize }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // TODO: Task 4.5 will implement actual API submission
    // For now, just show loading state briefly
    setTimeout(() => {
      setIsSubmitting(false);
    }, 2000);
  };

  const handleNextStep = async () => {
    if (currentStep < TOTAL_STEPS) {
      setIsTransitioning(true);
      // Animate transition
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsTransitioning(false);
      }, 150);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setIsTransitioning(true);
      // Animate transition
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsTransitioning(false);
      }, 150);
    }
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
      />
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none opacity-6"
        style={{
          background: "radial-gradient(circle, #2b7cff 0%, transparent 70%)",
        }}
      />

      {/* Main container */}
      <div className="relative z-10 w-full max-w-2xl">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {/* Header */}
          <div className="px-8 py-12 sm:px-12 border-b border-gray-100">
            <ProgressIndicator
              currentStep={currentStep}
              totalSteps={TOTAL_STEPS}
            />
          </div>

          {/* Content */}
          <div className="px-8 py-12 sm:px-12">
            <form onSubmit={(e) => e.preventDefault()}>
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
                    onNext={handleNextStep}
                  />
                )}

                {currentStep === 2 && (
                  <StepIndustry
                    industry={formData.industry}
                    onIndustryChange={handleIndustryChange}
                    onNext={handleNextStep}
                    onPrev={handlePreviousStep}
                  />
                )}

                {currentStep === 3 && (
                  <StepCompanySize
                    companySize={formData.companySize}
                    onCompanySizeChange={handleCompanySizeChange}
                    onPrev={handlePreviousStep}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                  />
                )}
              </div>

              {/* Navigation buttons for steps 1-2 */}
              {currentStep < TOTAL_STEPS && (
                <div className="flex gap-3 justify-between mt-8">
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    disabled={currentStep === 1}
                    className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition min-h-[44px]"
                  >
                    이전
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-3 rounded-lg bg-brand text-white font-medium hover:bg-brand-hover transition min-h-[44px] ml-auto"
                  >
                    다음
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-sm text-gray-600 mt-6">
          진단 완료까지 약 3분이 소요됩니다
        </p>
      </div>
    </div>
  );
}
