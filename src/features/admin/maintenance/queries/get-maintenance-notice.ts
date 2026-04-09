import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_MAINTENANCE_NOTICE, type MaintenanceNotice } from '../types'

/** revalidateTag로 캐시 무효화할 때 사용 */
export const MAINTENANCE_NOTICE_TAG = 'maintenance-notice'

/**
 * 점검 공지 단일 row 조회 (id=1 고정)
 *
 * Next.js `unstable_cache`로 감싸 랜딩 페이지 매 요청마다 DB 조회하지 않도록 함.
 * Admin Server Action에서 저장 직후 `revalidateTag(MAINTENANCE_NOTICE_TAG)` 호출
 * 시 즉시 무효화. 안전망으로 5분 TTL 설정.
 *
 * DB 조회 실패 시 DEFAULT_MAINTENANCE_NOTICE fallback — 랜딩 먹통 방지.
 *
 * 주의: 2026-04-09 learnings — `.select()`에 필요한 컬럼을 모두 명시해야 함.
 */
export const getMaintenanceNotice = unstable_cache(
  async (): Promise<MaintenanceNotice> => {
    try {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('findably_maintenance_notices')
        .select('is_active, title, body, contact_email, eta_text')
        .eq('id', 1)
        .single()

      if (error || !data) {
        console.error('[getMaintenanceNotice]', error)
        return DEFAULT_MAINTENANCE_NOTICE
      }

      return {
        isActive: data.is_active,
        title: data.title,
        body: data.body,
        contactEmail: data.contact_email,
        etaText: data.eta_text,
      }
    } catch (err) {
      console.error('[getMaintenanceNotice] unexpected', err)
      return DEFAULT_MAINTENANCE_NOTICE
    }
  },
  ['maintenance-notice'],
  {
    tags: [MAINTENANCE_NOTICE_TAG],
    revalidate: 300, // 5분 안전망
  }
)
