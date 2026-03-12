import Image, { ImageProps } from 'next/image';
import { PERFORMANCE_CONFIG } from '@/lib/performance/metrics';

interface OptimizedImageProps extends Omit<ImageProps, 'alt'> {
  /** Alt text is required for accessibility */
  alt: string;
  /** Enable priority loading for above-fold images (disables lazy loading) */
  priority?: boolean;
  /** Custom sizes for responsive images */
  sizes?: string;
  /** Custom quality (1-100, default 80) */
  quality?: number;
}

/**
 * OptimizedImage component wraps Next.js Image with sensible defaults for performance:
 * - Lazy loading by default (unless priority is set)
 * - Quality optimized to 80 for best balance of size/quality
 * - Responsive sizing support
 * - Enforced alt text for accessibility
 *
 * Usage:
 * ```tsx
 * // Below the fold (lazy loaded)
 * <OptimizedImage src="/image.jpg" alt="Description" width={800} height={600} />
 *
 * // Above the fold (eager loading)
 * <OptimizedImage src="/hero.jpg" alt="Hero" width={1200} height={600} priority />
 *
 * // With responsive sizes
 * <OptimizedImage
 *   src="/image.jpg"
 *   alt="Description"
 *   width={800}
 *   height={600}
 *   sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
 * />
 * ```
 */
export function OptimizedImage({
  alt,
  priority = false,
  quality = PERFORMANCE_CONFIG.IMAGE_QUALITY,
  sizes,
  ...props
}: OptimizedImageProps) {
  return (
    <Image
      alt={alt}
      quality={quality}
      priority={priority}
      loading={priority ? undefined : 'lazy'}
      sizes={
        sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
      }
      {...props}
    />
  );
}
