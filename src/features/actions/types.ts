/** 파싱된 Schema Markup 항목 */
export interface ParsedSchema {
  type: string
  properties: string[]
  isValid: boolean
  raw: string
  issues: string[]
}

/** 추천 Schema 코드 */
export interface RecommendedSchema {
  type: string
  description: string
  code: string
  priority: 'high' | 'medium' | 'low'
}

/** CMS 적용 가이드 */
export interface CmsGuide {
  cms: string
  displayName: string
  steps: string[]
  pluginRecommendation?: string
  codeLocation?: string
}
