import { z } from 'zod'

/**
 * 점검 공지 입력 스키마 (Admin Server Action 검증용)
 *
 * - isActive: true면 랜딩 페이지에 모달 노출
 * - title: 1~100자
 * - body: 1~2000자 (줄바꿈 \n 허용)
 * - contactEmail: 선택, 이메일 형식
 * - etaText: 선택, 예상 복구 시간 자유 텍스트
 */
export const maintenanceNoticeSchema = z.object({
  isActive: z.boolean(),
  title: z
    .string()
    .trim()
    .min(1, '제목을 입력하세요')
    .max(100, '제목은 100자 이하'),
  body: z
    .string()
    .trim()
    .min(1, '본문을 입력하세요')
    .max(2000, '본문은 2000자 이하'),
  contactEmail: z
    .string()
    .trim()
    .email('올바른 이메일 형식이 아닙니다')
    .nullable(),
  etaText: z.string().trim().max(200, 'ETA는 200자 이하').nullable(),
})

export type MaintenanceNotice = z.infer<typeof maintenanceNoticeSchema>

/**
 * DB 조회 실패 시 fallback — 랜딩 먹통 방지
 * is_active=false이므로 모달은 렌더되지 않음
 */
export const DEFAULT_MAINTENANCE_NOTICE: MaintenanceNotice = {
  isActive: false,
  title: '서비스 점검 중입니다',
  body: '',
  contactEmail: null,
  etaText: null,
}
