/**
 * Progress Indicator Component
 *
 * Shows the current step and visual progress bar for the onboarding flow.
 * Displays step labels and animated progress.
 */

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const STEP_LABELS = ["URL 입력", "업종 선택", "규모 선택"];

export default function ProgressIndicator({
  currentStep,
  totalSteps,
}: ProgressIndicatorProps) {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="space-y-4">
      {/* Step Counter */}
      <div className="text-center">
        <p className="text-sm font-medium text-gray-600">
          단계 {currentStep} / {totalSteps}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full">
        <div
          className="h-2 w-full rounded-full bg-gray-200 overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(progressPercentage)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`진행 상황 ${currentStep} / ${totalSteps}`}
        >
          <div
            className="h-full bg-brand transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Step Labels */}
      <div className="flex justify-between gap-4 mt-6" role="group" aria-label="온보딩 단계">
        {STEP_LABELS.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <div key={label} className="flex-1">
              <div
                className={`text-xs font-medium text-center transition-colors ${
                  isActive
                    ? "text-brand"
                    : isCompleted
                      ? "text-green-600"
                      : "text-gray-500"
                }`}
                aria-current={isActive ? "step" : undefined}
                aria-label={`${label}: ${isCompleted ? "완료됨" : isActive ? "진행 중" : "시작되지 않음"}`}
              >
                {isCompleted ? "✓" : stepNumber}
              </div>
              <p className="text-xs text-gray-700 text-center mt-1 leading-tight">
                {label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
