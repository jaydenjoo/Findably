import { createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/types/database'

/** 추적 가능한 퍼널 이벤트 */
export type AnalyticsEvent =
  | 'url_submitted'
  | 'diagnosis_completed'
  | 'report_viewed'
  | 'payment_started'
  | 'payment_completed'
  | 'quickwin_clicked'
  | 'pdf_downloaded'
  | 'self_report_submitted'
  | 'nps_submitted'

/** trackEvent 파라미터 */
export interface TrackEventParams {
  /** 사용자 ID (웹훅 등 세션 없는 컨텍스트에서는 직접 전달) */
  userId: string
  /** 이벤트 이름 */
  event: AnalyticsEvent
  /** 추가 속성 (진단 ID, 점수, URL 등) */
  properties?: Record<string, unknown>
}

/**
 * 퍼널 이벤트 기록
 *
 * Supabase analytics_events 테이블에 INSERT.
 * 에러 시 로그만 남기고 throw 안 함 — analytics 실패가 핵심 플로우를 멈추면 안 됨.
 */
export async function trackEvent(params: TrackEventParams): Promise<boolean> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase.from('analytics_events').insert({
      user_id: params.userId,
      event: params.event,
      properties: (params.properties ?? {}) as Json,
    })

    if (error) {
      console.error('[trackEvent] INSERT 실패:', error.message)
      return false
    }

    return true
  } catch (error) {
    console.error('[trackEvent] 이벤트 기록 실패:', error)
    return false
  }
}
