"use client";

/**
 * Step 3: Company Size Selector Component
 *
 * Renders radio-button style cards for user to select their company size.
 * Includes 3 company size options with icons and visual feedback.
 * Previous button goes back to Step 2, Start button submits the form.
 * Shows loading state when isSubmitting is true.
 */

import { User, Users, Building2 } from "lucide-react";

interface StepCompanySizeProps {
  companySize: string;
  onCompanySizeChange: (size: string) => void;
  onPrev: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

interface CompanySizeOption {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const COMPANY_SIZE_OPTIONS: CompanySizeOption[] = [
  {
    value: "solo",
    label: "1인",
    description: "혼자 운영하는 비즈니스",
    icon: <User className="w-5 h-5" />,
  },
  {
    value: "small",
    label: "소규모 (2-10명)",
    description: "2-10명 규모의 팀",
    icon: <Users className="w-5 h-5" />,
  },
  {
    value: "medium",
    label: "중규모 (11-50명)",
    description: "11-50명 규모의 조직",
    icon: <Building2 className="w-5 h-5" />,
  },
];

export default function StepCompanySize({
  companySize,
  onCompanySizeChange,
  onPrev,
  onSubmit,
  isSubmitting,
}: StepCompanySizeProps) {
  const handleCompanySizeClick = (value: string) => {
    if (!isSubmitting) {
      onCompanySizeChange(value);
    }
  };

  const isSelected = (value: string) => companySize === value;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        회사 규모를 선택하세요
      </h2>
      <p className="text-gray-600 text-sm mb-8">
        맞춤형 진단 기준을 설정하기 위해 필요합니다
      </p>

      {/* Company size grid */}
      <div
        className="grid grid-cols-1 gap-4 mb-8"
        data-testid="company-size-grid"
      >
        {COMPANY_SIZE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            data-company-size={option.value}
            onClick={() => handleCompanySizeClick(option.value)}
            disabled={isSubmitting}
            className={`
              relative p-4 rounded-xl border-2 transition-all duration-200
              text-left flex gap-4 items-start
              hover:shadow-md hover:-translate-y-1 min-h-[44px]
              ${
                isSelected(option.value)
                  ? "border-brand bg-brand-light"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }
              ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}
            `}
            aria-disabled={isSubmitting}
            data-testid={`company-size-option-${option.value}`}
          >
            {/* Icon background */}
            <div
              className="flex-shrink-0 rounded-full bg-brand-light w-10 h-10 flex items-center justify-center text-brand"
              data-testid="company-size-icon"
            >
              {option.icon}
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">
                {option.label}
              </p>
              <p className="text-gray-600 text-xs mt-0.5">
                {option.description}
              </p>
            </div>

            {/* Selection indicator */}
            {isSelected(option.value) && (
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-brand flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  data-testid="checkmark"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3 justify-between">
        <button
          type="button"
          onClick={onPrev}
          disabled={isSubmitting}
          className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="prev-button"
        >
          이전
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={!companySize || isSubmitting}
          className="px-6 py-3 rounded-lg bg-brand text-white font-medium hover:bg-brand-hover transition min-h-[44px] ml-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          data-testid="submit-button"
        >
          {isSubmitting ? (
            <>
              <svg
                className="w-4 h-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                data-testid="spinner"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              진단 시작 중...
            </>
          ) : (
            <>
              시작하기 →
            </>
          )}
        </button>
      </div>
    </div>
  );
}
