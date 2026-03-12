/**
 * Performance monitoring and reporting utilities
 * Integrates with web-vitals and supports PostHog/Sentry reporting
 */

export const PERFORMANCE_CONFIG = {
  // Lighthouse targets
  FCP_TARGET_MS: 1500, // First Contentful Paint
  TTI_TARGET_MS: 3000, // Time to Interactive
  PERFORMANCE_SCORE_TARGET: 80, // Lighthouse Performance score (0-100)

  // Image optimization
  IMAGE_QUALITY: 80, // Default quality for Next.js Image optimization
  IMAGE_LOADING_DEFAULT: 'lazy' as const,
  IMAGE_CACHE_TTL_DAYS: 30,

  // Formats for next.config image optimization
  IMAGE_FORMATS: ['image/avif', 'image/webp'],

  // Device and image sizes for responsive images
  IMAGE_DEVICE_SIZES: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  IMAGE_SIZES: [16, 32, 48, 64, 96, 128, 256, 384],
};

export interface WebVitalsMetric {
  name: string;
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

/**
 * Report Core Web Vitals and performance metrics
 * Can be extended to send to PostHog, Sentry, or custom analytics
 *
 * @param metric - Web Vitals metric to report
 */
export function reportWebVitals(metric: WebVitalsMetric): void {
  // Always log metrics (can be disabled by log level in production)
  console.log(
    `📊 Web Vitals [${metric.name}]:`,
    {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    }
  );

  // Log warnings for poor ratings
  if (metric.rating === 'poor') {
    console.warn(`⚠️ Poor ${metric.name}: ${metric.value}ms`);
  }

  // In production, you can send to PostHog, Sentry, or custom analytics
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    // Example: Send to PostHog
    // posthog?.capture('web_vitals', {
    //   metric: metric.name,
    //   value: metric.value,
    //   rating: metric.rating,
    // });
  }

  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    // Example: Send to Sentry if metric is poor
    // if (metric.rating === 'poor') {
    //   Sentry.captureMessage(`Poor ${metric.name}: ${metric.value}`, 'warning');
    // }
  }
}

/**
 * Check if a metric meets the performance target
 */
export function meetsPerformanceTarget(
  metric: WebVitalsMetric,
  targetMs: number
): boolean {
  return metric.value <= targetMs;
}

/**
 * Get performance recommendations based on metrics
 */
export function getPerformanceRecommendations(
  metrics: WebVitalsMetric[]
): string[] {
  const recommendations: string[] = [];

  const fcp = metrics.find((m) => m.name === 'FCP');
  if (fcp && fcp.value > PERFORMANCE_CONFIG.FCP_TARGET_MS) {
    recommendations.push(
      'FCP is high. Consider code-splitting and lazy-loading routes.'
    );
  }

  const tti = metrics.find((m) => m.name === 'TTI');
  if (tti && tti.value > PERFORMANCE_CONFIG.TTI_TARGET_MS) {
    recommendations.push(
      'TTI is high. Consider reducing JavaScript bundle size.'
    );
  }

  const cls = metrics.find((m) => m.name === 'CLS');
  if (cls && cls.value > 0.1) {
    recommendations.push(
      'CLS is high. Ensure images and dynamic content have reserved space.'
    );
  }

  return recommendations;
}
