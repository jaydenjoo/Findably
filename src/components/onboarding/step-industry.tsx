"use client";

/**
 * Step 2: Industry/Category Selector Component
 *
 * Renders radio-button style cards for user to select their industry.
 * Includes 5 industry options with icons and visual feedback.
 * Next button advances to Step 3, Previous button goes back to Step 1.
 */

import { ShoppingCart, FileText, Monitor, MapPin, Settings } from "lucide-react";

interface StepIndustryProps {
  industry: string;
  onIndustryChange: (industry: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

interface IndustryOption {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const INDUSTRY_OPTIONS: IndustryOption[] = [
  {
    value: "ecommerce",
    label: "전자상거래",
    description: "온라인 쇼핑몰, 상품 판매",
    icon: <ShoppingCart className="w-5 h-5" />,
  },
  {
    value: "blog",
    label: "블로그/미디어",
    description: "블로그, 미디어, 콘텐츠 사이트",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    value: "saas",
    label: "SaaS/소프트웨어",
    description: "소프트웨어 제품, 서비스",
    icon: <Monitor className="w-5 h-5" />,
  },
  {
    value: "local_business",
    label: "지역 비즈니스",
    description: "의료, 미용, 음식점 등 지역 서비스",
    icon: <MapPin className="w-5 h-5" />,
  },
  {
    value: "other",
    label: "기타",
    description: "위의 카테고리에 해당하지 않음",
    icon: <Settings className="w-5 h-5" />,
  },
];

export default function StepIndustry({
  industry,
  onIndustryChange,
  onNext,
  onPrev,
}: StepIndustryProps) {
  const handleIndustryClick = (value: string) => {
    onIndustryChange(value);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        업종을 선택하세요
      </h2>
      <p className="text-gray-600 text-sm mb-8">
        비즈니스에 맞는 진단을 제공하기 위해 필요합니다
      </p>

      {/* Industry grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
        data-testid="industry-grid"
      >
        {INDUSTRY_OPTIONS.map((option) => {
          const isSelected = industry === option.value;
          return (
            <button
              key={option.value}
              type="button"
              data-industry={option.value}
              onClick={() => handleIndustryClick(option.value)}
              className={`
                relative p-4 rounded-xl border-2 transition-all duration-200
                text-left flex gap-4 items-start
                hover:shadow-md hover:-translate-y-1 min-h-[44px]
                ${
                  isSelected
                    ? "border-brand bg-brand-light"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }
              `}
            >
              {/* Icon background */}
              <div
                className="flex-shrink-0 rounded-full bg-brand-light w-10 h-10 flex items-center justify-center text-brand"
                data-testid="industry-icon"
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
              {isSelected && (
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-brand flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
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
          );
        })}
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3 justify-between">
        <button
          type="button"
          onClick={onPrev}
          className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition min-h-[44px]"
        >
          이전
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-6 py-3 rounded-lg bg-brand text-white font-medium hover:bg-brand-hover transition min-h-[44px] ml-auto"
        >
          다음
        </button>
      </div>
    </div>
  );
}
