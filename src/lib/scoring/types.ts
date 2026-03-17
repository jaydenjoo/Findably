/** Web Vitals 개별 메트릭 등급 */
export type VitalRating = 'good' | 'needs-improvement' | 'poor'

/** 개별 메트릭 점수 결과 */
export interface VitalScore {
  /** 원시 측정값 (ms 또는 소수) */
  value: number
  /** 0-100 정규화 점수 */
  score: number
  /** Google 공식 등급 */
  rating: VitalRating
}

/** 보안 카테고리별 점수 */
export interface SecurityCategoryScore {
  /** 획득 점수 */
  score: number
  /** 해당 카테고리 최대 점수 */
  maxScore: number
}

/** 보안 종합 점수 */
export interface SecurityScore {
  /** 종합 점수 (0-100) */
  overall: number
  /** 카테고리별 상세 */
  breakdown: {
    sslGrade: SecurityCategoryScore & { grade: string | null }
    sslProtocol: SecurityCategoryScore & { bestProtocol: string | null }
    certExpiry: SecurityCategoryScore & { daysRemaining: number | null }
    securityHeaders: SecurityCategoryScore & {
      grade: string | null
      issues: string[]
    }
  }
  /** 데이터 출처 */
  dataSource: 'full' | 'partial' | 'none'
}

/** GEO 카테고리별 점수 (SecurityCategoryScore 재사용) */
export type GeoCategoryScore = SecurityCategoryScore

/** GEO 종합 점수 */
export interface GeoScore {
  /** 종합 점수 (0-100) */
  overall: number
  /** 카테고리별 상세 (10개 항목) */
  breakdown: {
    schemaOrg: GeoCategoryScore & { count: number }
    structuredData: GeoCategoryScore & { hasJsonLd: boolean }
    faqSchema: GeoCategoryScore & { count: number }
    contentLength: GeoCategoryScore & { charCount: number }
    imageAlt: GeoCategoryScore & { ratio: number }
    eeat: GeoCategoryScore
    llmsTxt: GeoCategoryScore & { exists: boolean; hasFullVersion: boolean }
    canonical: GeoCategoryScore & { exists: boolean }
    ogCompleteness: GeoCategoryScore & { presentFields: string[] }
    hreflang: GeoCategoryScore & { languages: string[] }
  }
  /** 데이터 출처 */
  dataSource: 'full' | 'partial' | 'none'
}

/** 성능 종합 점수 */
export interface PerformanceScore {
  /** 가중 평균 종합 점수 (0-100) */
  overall: number
  /** 개별 메트릭 상세 */
  breakdown: {
    lcp: VitalScore | null
    cls: VitalScore | null
    inp: VitalScore | null
    ttfb: VitalScore | null
    fcp: VitalScore | null
  }
  /** 데이터 출처 */
  dataSource: 'pagespeed' | 'crux' | 'both' | 'none'
}
