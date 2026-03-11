/**
 * Loading skeleton for diagnosing page
 */

import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function DiagnosingLoading() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#fafbfc] to-white p-4">
      {/* Decorative blob background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-20 w-96 h-96 bg-gradient-to-br from-[#2b7cff] to-transparent rounded-full opacity-5 blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-gradient-to-tr from-[#2b7cff] to-transparent rounded-full opacity-3 blur-3xl" />
      </div>

      {/* Loading card */}
      <Card className="w-full max-w-lg rounded-2xl shadow-lg border border-[#e2e6ea] bg-white p-8 relative z-10 animate-pulse">
        {/* Header skeleton */}
        <div className="text-center mb-8">
          <div className="h-8 bg-[#e2e6ea] rounded-lg w-2/3 mx-auto mb-3" />
          <div className="h-5 bg-[#f1f3f5] rounded-lg w-4/5 mx-auto" />
        </div>

        {/* Spinner skeleton */}
        <div className="flex justify-center mb-8">
          <Loader2 className="w-16 h-16 text-[#2b7cff] animate-spin opacity-40" />
        </div>

        {/* Steps skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#e2e6ea] flex-shrink-0" />
              <div className="flex-1 h-5 bg-[#e2e6ea] rounded-lg" />
            </div>
          ))}
        </div>

        {/* Info text skeleton */}
        <div className="mt-8 h-4 bg-[#f1f3f5] rounded-lg w-3/4 mx-auto" />
      </Card>
    </div>
  );
}
