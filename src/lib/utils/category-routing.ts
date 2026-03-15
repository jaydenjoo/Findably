import type { CategoryId } from '@/features/diagnosis-free/types'

/**
 * 카테고리 ID를 진단 상세 페이지 라우트로 매핑
 *
 * 매핑 규칙 (Task T-12):
 * - 'technical', 'performance', 'security', 'mobile' → /diagnosis/seo
 * - 'content' → /diagnosis/content
 * - 'geo', 'social-ai' → /diagnosis/geo
 */
export function getCategoryRoute(
  categoryId: CategoryId
): 'seo' | 'content' | 'geo' {
  switch (categoryId) {
    case 'technical':
    case 'performance':
    case 'security':
    case 'mobile':
      return 'seo'
    case 'content':
      return 'content'
    case 'geo':
    case 'social-ai':
      return 'geo'
    default:
      // 타입 안전성을 위한 exhaustiveness check
      const _exhaustive: never = categoryId
      return _exhaustive
  }
}

/**
 * 진단 상세 페이지 URL 생성
 *
 * @example
 * getDiagnosisDetailUrl('technical', 'abc123')
 * // → '/diagnosis/seo?id=abc123'
 */
export function getDiagnosisDetailUrl(
  categoryId: CategoryId,
  diagnosisId: string
): string {
  const route = getCategoryRoute(categoryId)
  return `/diagnosis/${route}?id=${diagnosisId}`
}
