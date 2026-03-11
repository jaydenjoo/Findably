/**
 * Loading Skeleton for Onboarding Page
 *
 * Displays a skeleton/loading state while the onboarding page is loading.
 */

export default function OnboardingLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #2b7cff 0.5px, transparent 0.5px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* Main container skeleton */}
      <div className="relative z-10 w-full max-w-2xl">
        {/* Card skeleton */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {/* Header skeleton */}
          <div className="px-8 py-12 sm:px-12 border-b border-gray-100">
            <div className="space-y-4">
              {/* Step counter skeleton */}
              <div className="h-6 bg-gray-200 rounded w-24 mx-auto animate-pulse" />

              {/* Progress bar skeleton */}
              <div className="h-2 w-full rounded-full bg-gray-200" />

              {/* Step labels skeleton */}
              <div className="flex justify-between gap-4 mt-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                    <div className="h-3 bg-gray-100 rounded w-full mt-2 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content skeleton */}
          <div className="px-8 py-12 sm:px-12">
            <div className="space-y-4">
              {/* Title skeleton */}
              <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />

              {/* Description skeleton */}
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />

              {/* Form content skeleton */}
              <div className="mt-8 space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-gray-100 rounded-lg border border-gray-300 animate-pulse"
                  />
                ))}
              </div>

              {/* Button skeleton */}
              <div className="flex gap-3 justify-between mt-8">
                <div className="h-12 bg-gray-200 rounded-lg w-20 animate-pulse" />
                <div className="h-12 bg-brand/20 rounded-lg w-28 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer text skeleton */}
        <div className="h-4 bg-gray-200 rounded w-40 mx-auto mt-6 animate-pulse" />
      </div>
    </div>
  );
}
