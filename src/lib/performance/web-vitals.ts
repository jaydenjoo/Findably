'use client';

/**
 * Web Vitals integration module
 * Hooks into Next.js web-vitals reporting to track Core Web Vitals metrics
 *
 * Usage in app/layout.tsx:
 * ```tsx
 * import { initWebVitals } from '@/lib/performance/web-vitals';
 *
 * export default function RootLayout({ children }) {
 *   useEffect(() => {
 *     initWebVitals();
 *   }, []);
 *   // ...
 * }
 * ```
 */

import { reportWebVitals as reportMetric, type WebVitalsMetric } from './metrics';

/**
 * Initialize web-vitals reporting
 * Call this once in your root layout or app initialization
 */
export function initWebVitals(): void {
  // Dynamic import of web-vitals to avoid increasing bundle size
  if (typeof window !== 'undefined') {
    Promise.resolve()
      .then(() => import('web-vitals' as string))
      .then(
        (module: {
          getCLS: (callback: typeof reportMetric) => void;
          getFID: (callback: typeof reportMetric) => void;
          getFCP: (callback: typeof reportMetric) => void;
          getLCP: (callback: typeof reportMetric) => void;
          getTTFB: (callback: typeof reportMetric) => void;
        }) => {
          const { getCLS, getFID, getFCP, getLCP, getTTFB } = module;
          getCLS(reportMetric);
          getFID(reportMetric);
          getFCP(reportMetric);
          getLCP(reportMetric);
          getTTFB(reportMetric);
        }
      );
  }
}

/**
 * Report a single web vital metric
 * Used by Next.js web-vitals module
 */
export function webVitalsReporter(metric: WebVitalsMetric): void {
  reportMetric(metric);
}
