/** 유료 전환 BlurOverlay 공통 CTA 설정 */
export const BLUR_OVERLAY_CTA = {
  ctaLabel: '상세 분석 받기 — 9.9만원',
  ctaHref: '/pricing',
  sampleLabel: '샘플 먼저 보기 →',
  sampleHref: '/reports/sample',
  /** 디자인 시스템 기준: 상단 25% 선명 노출 */
  visiblePercent: 25,
} as const

/**
 * AI 인용 추적 0% (데이터 미수집) 상태일 때 표시할 안내 문구.
 * 웹 리포트(CitationTrackingSection) + PDF 리포트(PdfCitationTracking) 공통 사용.
 * Jayden 지시문 (docs/paid-report-audit-v1.md Task 4-2) 기반.
 */
export const CITATION_EMPTY_INFO = {
  title: '아직 AI가 이 사이트를 인용하지 않고 있어요',
  body: '현재 Schema Markup과 구조화된 콘텐츠가 부족해 AI가 답변에 참조할 근거가 부족합니다.',
  cta: '→ 아래 GEO 개선 항목을 적용하면 인용률이 올라갑니다.',
} as const
