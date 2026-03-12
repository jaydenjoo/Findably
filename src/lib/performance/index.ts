/**
 * Performance optimization utilities
 *
 * Includes:
 * - Image optimization via OptimizedImage component
 * - Web Vitals monitoring and reporting
 * - Performance configuration constants
 */

export {
  reportWebVitals,
  meetsPerformanceTarget,
  getPerformanceRecommendations,
  PERFORMANCE_CONFIG,
  type WebVitalsMetric,
} from './metrics';

export { initWebVitals, webVitalsReporter } from './web-vitals';

// Component is exported from ui components
export { OptimizedImage } from '@/components/ui/optimized-image';
