/**
 * 분석 대기 화면 상수
 *
 * AnalyzingScreen에서 사용하는 단계 정의, 폴링 간격, 예상 시간
 */

export const ANALYSIS_STAGES = [
  { key: 'crawling', label: '웹사이트 크롤링' },
  { key: 'technical', label: '기술 분석' },
  { key: 'seo', label: 'SEO 분석' },
  { key: 'content', label: '콘텐츠 분석' },
  { key: 'scoring', label: '점수 산출' },
] as const

/** 폴링 간격 (ms) */
export const ANALYSIS_POLL_INTERVAL = 5_000

/** 예상 분석 소요 시간 (초) */
export const ANALYSIS_ESTIMATED_SECONDS = 120
