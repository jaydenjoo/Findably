/**
 * Google Analytics 4 (GA4) 헬퍼
 * 환경변수 NEXT_PUBLIC_GA_MEASUREMENT_ID가 설정된 경우에만 작동
 */

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ''

/** GA4가 활성화되어 있는지 확인 */
export function isGAEnabled(): boolean {
  return GA_MEASUREMENT_ID !== '' && typeof window !== 'undefined'
}

/** 페이지뷰 전송 */
export function pageview(url: string): void {
  if (!isGAEnabled()) return
  window.gtag('config', GA_MEASUREMENT_ID, { page_path: url })
}

/** 커스텀 이벤트 전송 */
export function gtagEvent({
  action,
  category,
  label,
  value,
}: {
  action: string
  category: string
  label?: string
  value?: number
}): void {
  if (!isGAEnabled()) return
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value,
  })
}

/** Findably 전환 이벤트 */
export const GA_EVENTS = {
  /** 회원가입 완료 */
  signUp: () => gtagEvent({ action: 'sign_up', category: 'engagement' }),
  /** 무료 진단 시작 */
  startFreeDiagnosis: (url: string) =>
    gtagEvent({
      action: 'start_free_diagnosis',
      category: 'conversion',
      label: url,
    }),
  /** 유료 결제 완료 */
  purchase: (diagnosisId: string) =>
    gtagEvent({
      action: 'purchase',
      category: 'conversion',
      label: diagnosisId,
      value: 99000,
    }),
  /** 샘플 리포트 조회 */
  viewSampleReport: () =>
    gtagEvent({ action: 'view_sample_report', category: 'engagement' }),
  /** PDF 다운로드 */
  downloadPdf: (diagnosisId: string) =>
    gtagEvent({
      action: 'download_pdf',
      category: 'engagement',
      label: diagnosisId,
    }),
} as const

/** window.gtag 타입 선언 */
declare global {
  interface Window {
    gtag: (
      command: string,
      targetId: string,
      config?: Record<string, unknown>
    ) => void
  }
}
