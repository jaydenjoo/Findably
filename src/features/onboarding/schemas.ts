import { z } from 'zod'
import { validateUrlSecurity } from '@/shared/utils/url-security'

// ─── URL 입력 스키마 (필수) ───

/** 온보딩 URL 입력 폼 검증 */
export const urlSchema = z.object({
  url: z
    .string()
    .min(1, 'URL을 입력해주세요')
    .max(2048, 'URL이 너무 깁니다 (최대 2,048자)')
    .transform((val) => {
      const trimmed = val.trim()
      // 프로토콜 없으면 https:// 자동 추가
      if (
        trimmed &&
        !trimmed.startsWith('http://') &&
        !trimmed.startsWith('https://')
      ) {
        return `https://${trimmed}`
      }
      return trimmed
    })
    .refine(
      (url) => url !== 'https://' && url !== 'http://',
      'URL을 입력해주세요'
    )
    .refine((url) => {
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    }, '올바른 URL 형식이 아닙니다')
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      'http:// 또는 https://로 시작해야 합니다'
    )
    .superRefine((url, ctx) => {
      const result = validateUrlSecurity(url)
      if (!result.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: result.error ?? '허용되지 않는 URL입니다',
        })
      }
    }),
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
