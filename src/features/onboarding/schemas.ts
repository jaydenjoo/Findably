import { z } from 'zod'

// ─── URL 입력 스키마 (필수) ───

/** 온보딩 URL 입력 폼 검증 */
export const urlSchema = z.object({
  url: z
    .string()
    .min(1, 'URL을 입력해주세요')
    .url('올바른 URL 형식이 아닙니다')
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      'http:// 또는 https://로 시작해야 합니다'
    ),
})

// ─── 선택 정보 스키마 (모두 optional) ───

/** 온보딩 추가 정보 폼 검증 */
export const infoSchema = z.object({
  targetKeywords: z.string().optional(),
  competitorUrls: z.string().optional(),
  industry: z.string().max(100, '업종은 100자 이내로 입력해주세요').optional(),
})

// ─── 타입 추출 ───

export type UrlInput = z.infer<typeof urlSchema>
export type InfoInput = z.infer<typeof infoSchema>
