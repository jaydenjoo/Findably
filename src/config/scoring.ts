import type { ScoreGrade } from '@/types/ui'
import type { RuleSeverity } from '@/features/diagnosis-free/types'

/**
 * 점수 등급 기준
 * 80+ excellent, 60+ good, 40+ warning, 0+ critical
 */
const GRADE_THRESHOLDS: readonly { min: number; grade: ScoreGrade }[] = [
  { min: 80, grade: 'excellent' },
  { min: 60, grade: 'good' },
  { min: 40, grade: 'warning' },
  { min: 0, grade: 'critical' },
] as const

/** 등급 한국어 라벨 */
const GRADE_LABELS: Record<ScoreGrade, string> = {
  excellent: '양호',
  good: '보통',
  warning: '주의',
  critical: '심각',
} as const

/** 등급별 Tailwind 클래스 */
const GRADE_COLORS: Record<
  ScoreGrade,
  { text: string; bg: string; stroke: string; border: string; bar: string }
> = {
  excellent: {
    text: 'text-success-700',
    bg: 'bg-success-50',
    stroke: 'stroke-success-500',
    border: 'border-success-500',
    bar: 'bg-success-500',
  },
  good: {
    text: 'text-primary-700',
    bg: 'bg-primary-50',
    stroke: 'stroke-primary-500',
    border: 'border-primary-500',
    bar: 'bg-primary-500',
  },
  warning: {
    text: 'text-warning-700',
    bg: 'bg-warning-50',
    stroke: 'stroke-warning-500',
    border: 'border-warning-500',
    bar: 'bg-warning-500',
  },
  critical: {
    text: 'text-danger-700',
    bg: 'bg-danger-50',
    stroke: 'stroke-danger-500',
    border: 'border-danger-500',
    bar: 'bg-danger-500',
  },
} as const

/** 점수 → 등급 */
function getScoreGrade(score: number): ScoreGrade {
  const clamped = Math.max(0, Math.min(100, score))
  const found = GRADE_THRESHOLDS.find((t) => clamped >= t.min)
  return found?.grade ?? 'critical'
}

/** 점수 → 색상 객체 */
function getScoreColor(score: number): {
  text: string
  bg: string
  stroke: string
  border: string
  bar: string
} {
  return GRADE_COLORS[getScoreGrade(score)]
}

/** 점수 → 한국어 라벨 */
function getScoreLabel(score: number): string {
  return GRADE_LABELS[getScoreGrade(score)]
}

/** 심각도 → 뱃지 스타일 */
const SEVERITY_STYLES: Record<
  RuleSeverity,
  { bg: string; text: string; label: string }
> = {
  critical: { bg: 'bg-danger-50', text: 'text-danger-700', label: '심각' },
  warning: { bg: 'bg-warning-50', text: 'text-warning-700', label: '주의' },
  info: { bg: 'bg-primary-50', text: 'text-primary-700', label: '참고' },
} as const

/** 심각도 → impact 바 색상 */
const SEVERITY_BAR_COLORS: Record<RuleSeverity, string> = {
  critical: 'bg-danger-500',
  warning: 'bg-warning-500',
  info: 'bg-primary-500',
} as const

// ─── Web Vitals 임계값 (Google 공식 기준) ───

/** LCP (ms): ≤2500 good, ≤4000 needs-improvement, >4000 poor */
const WEB_VITALS_THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 },
  cls: { good: 0.1, poor: 0.25 },
  inp: { good: 200, poor: 500 },
  ttfb: { good: 800, poor: 1800 },
  fcp: { good: 1800, poor: 3000 },
} as const

/** 성능 점수 가중치 (합계 = 1.0) */
const PERFORMANCE_WEIGHTS = {
  lcp: 0.3,
  cls: 0.25,
  inp: 0.2,
  ttfb: 0.15,
  fcp: 0.1,
} as const

// ─── SSL/보안 점수 설정 ───

/** SSL Labs 등급 → 점수 매핑 (40점 만점) */
const SSL_GRADE_SCORES: Record<string, number> = {
  'A+': 40,
  A: 36,
  'A-': 32,
  B: 28,
  C: 20,
  D: 10,
  E: 5,
  F: 0,
  T: 0,
  M: 0,
} as const

/** TLS 프로토콜 버전 → 점수 매핑 (최고 버전 기준, 15점 만점) */
const SSL_PROTOCOL_SCORES: Record<string, number> = {
  'TLS 1.3': 15,
  'TLS 1.2': 10,
  'TLS 1.1': 5,
  'TLS 1.0': 2,
} as const

/** 인증서 만료일까지 남은 일수 → 점수 구간 (15점 만점) */
const CERT_EXPIRY_THRESHOLDS = [
  { minDays: 90, score: 15 },
  { minDays: 30, score: 10 },
  { minDays: 7, score: 5 },
  { minDays: 0, score: 2 },
] as const

/** 보안 점수 카테고리별 최대 점수 (합계 = 100) */
const SECURITY_MAX_SCORES = {
  sslGrade: 40,
  sslProtocol: 15,
  certExpiry: 15,
  securityHeaders: 30,
} as const

// ─── GEO 점수 설정 ───

/** GEO 점수 카테고리별 최대 점수 (합계 = 100) */
const GEO_MAX_SCORES = {
  schemaOrg: 20,
  structuredData: 15,
  faqSchema: 10,
  contentLength: 10,
  imageAlt: 10,
  eeat: 5,
  llmsTxt: 15,
  canonical: 5,
  ogCompleteness: 5,
  hreflang: 5,
} as const

/** 콘텐츠 길이 → 점수 구간 (본문 텍스트 기준, 10점 만점) */
const GEO_CONTENT_LENGTH_THRESHOLDS = [
  { minChars: 1000, score: 10 },
  { minChars: 500, score: 5 },
] as const

/** OG 태그 필수 필드 목록 */
const GEO_OG_REQUIRED_FIELDS = [
  'og:title',
  'og:description',
  'og:image',
  'og:url',
  'og:type',
] as const

// ─── 매크로 점수 (5-Score 집계) ───

/** 매크로 점수 ID */
type MacroScoreId = 'seo' | 'geo' | 'performance' | 'ai' | 'security'

/** 매크로 점수 가중치 (합계 = 1.0) — AI 데이터 있을 때 */
const MACRO_SCORE_WEIGHTS: Record<MacroScoreId, number> = {
  seo: 0.2,
  geo: 0.25,
  performance: 0.2,
  ai: 0.25,
  security: 0.1,
} as const

/** 매크로 점수 가중치 (합계 = 1.0) — AI 데이터 없을 때 (무료) */
const MACRO_SCORE_WEIGHTS_NO_AI: Record<Exclude<MacroScoreId, 'ai'>, number> = {
  seo: 0.25,
  geo: 0.3,
  performance: 0.25,
  security: 0.2,
} as const

/** 7개 카테고리 → 5개 매크로 점수 매핑 */
const CATEGORY_TO_MACRO_MAP: Record<string, MacroScoreId> = {
  technical: 'seo',
  content: 'seo',
  mobile: 'seo',
  geo: 'geo',
  'social-ai': 'geo',
  performance: 'performance',
  security: 'security',
} as const

/** 데이터 완성도 → 리포트 신뢰도 임계값 */
const DATA_COMPLETENESS_THRESHOLDS = {
  high: 90, // ≥90%: 전체 데이터 기반 분석
  medium: 70, // 70-89%: 부분 데이터 경고
  // <70%: 재분석 권장
} as const

/** 매크로 점수 한국어 라벨 */
const MACRO_SCORE_LABELS: Record<MacroScoreId, string> = {
  seo: 'SEO 최적화',
  geo: 'GEO 최적화',
  performance: '성능',
  ai: 'AI 인용',
  security: '보안',
} as const

export type { MacroScoreId }

export const SCORING = {
  GRADE_THRESHOLDS,
  GRADE_LABELS,
  GRADE_COLORS,
  SEVERITY_STYLES,
  SEVERITY_BAR_COLORS,
  WEB_VITALS_THRESHOLDS,
  PERFORMANCE_WEIGHTS,
  SSL_GRADE_SCORES,
  SSL_PROTOCOL_SCORES,
  CERT_EXPIRY_THRESHOLDS,
  SECURITY_MAX_SCORES,
  GEO_MAX_SCORES,
  GEO_CONTENT_LENGTH_THRESHOLDS,
  GEO_OG_REQUIRED_FIELDS,
  MACRO_SCORE_WEIGHTS,
  MACRO_SCORE_WEIGHTS_NO_AI,
  CATEGORY_TO_MACRO_MAP,
  DATA_COMPLETENESS_THRESHOLDS,
  MACRO_SCORE_LABELS,
  getScoreGrade,
  getScoreColor,
  getScoreLabel,
} as const
