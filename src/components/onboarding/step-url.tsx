"use client";

/**
 * Step 1: URL Input Component
 *
 * Renders a form input for user to enter their website URL.
 * Validates URL format in real-time and provides error feedback.
 * Next button is disabled until URL is valid.
 */

import { useState } from "react";
import { URLValidationSchema } from "@/lib/validations/onboarding";

interface StepUrlProps {
  url: string;
  onUrlChange: (url: string) => void;
  onNext: () => void;
}

export default function StepUrl({ url, onUrlChange, onNext }: StepUrlProps) {
  const [error, setError] = useState<string>("");
  const [touched, setTouched] = useState(false);

  // Validate URL on change
  const validateUrl = (urlValue: string) => {
    if (!urlValue.trim()) {
      setError("");
      return false;
    }

    const result = URLValidationSchema.safeParse({ url: urlValue });
    if (!result.success) {
      const firstError = result.error.issues[0];
      setError(firstError.message);
      return false;
    }

    setError("");
    return true;
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    onUrlChange(newUrl);

    // Validate on change if already touched
    if (touched) {
      validateUrl(newUrl);
    }
  };

  // Handle input blur - trigger validation
  const handleBlur = () => {
    setTouched(true);
    validateUrl(url);
  };

  // Check if URL is valid for button state
  const isValid = url.trim() !== "" && URLValidationSchema.safeParse({ url }).success;

  const handleNext = () => {
    if (isValid) {
      onNext();
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        웹사이트 URL을 입력하세요
      </h2>
      <p className="text-gray-600 text-sm mb-6">
        진단할 웹사이트 주소를 입력하세요
      </p>

      <div>
        <label htmlFor="url-input" className="block text-sm font-medium text-gray-700 mb-2">
          웹사이트 URL
        </label>
        <input
          id="url-input"
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:border-transparent ${
            touched && error
              ? "border-red-500 bg-red-50 focus:ring-red-200"
              : "border-gray-300 bg-gray-50 focus:ring-blue-200"
          }`}
        />

        {/* Error message */}
        {touched && error && (
          <p className="text-red-500 text-sm mt-2 block">{error}</p>
        )}

        {/* Helper text when no error */}
        {!error && (
          <p className="text-gray-500 text-xs mt-2">
            예: https://example.com, http://shop.example.com
          </p>
        )}
      </div>

      {/* Next button - disabled until URL is valid */}
      <div className="mt-8">
        <button
          type="button"
          onClick={handleNext}
          disabled={!isValid}
          className="w-full px-6 py-3 rounded-lg bg-brand text-white font-medium hover:bg-brand-hover disabled:bg-gray-300 disabled:cursor-not-allowed transition min-h-[44px]"
        >
          다음
        </button>
      </div>
    </div>
  );
}
