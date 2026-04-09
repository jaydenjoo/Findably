'use client'

import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  INDUSTRY_LABELS,
  INDUSTRY_OPTIONS,
  isSmeIndustryId,
  type SmeIndustryId,
} from '@/config/revenue'

/**
 * 업종 선택 컴포넌트 (Phase D)
 *
 * KOSIS 소상공인실태조사 2023 대분류 11종을 사용자 친화 라벨로 제공.
 * 선택 입력 — 미선택 시 submit-info에서 industry undefined로 저장되고,
 * 리포트 렌더 시 BASE_MONTHLY_REVENUE(16,400,000) fallback으로 동작한다.
 *
 * 폼 통합: hidden input으로 name="industry" 전달. shadcn Select는 value=""를
 * 지원하지 않으므로 내부 상태는 undefined, hidden input만 ''로 직렬화한다.
 */
interface IndustrySelectProps {
  /** 폼 필드 이름 (기본 'industry') */
  name?: string
  /** 기본 선택값 (기존 진단 수정 시) */
  defaultValue?: SmeIndustryId
  /** 비활성화 여부 */
  disabled?: boolean
  /** 접근성용 id (Label htmlFor와 연결) */
  id?: string
  /** aria-describedby — 도움말 연결 */
  describedBy?: string
}

export function IndustrySelect({
  name = 'industry',
  defaultValue,
  disabled,
  id = 'industry',
  describedBy,
}: IndustrySelectProps): React.JSX.Element {
  const [value, setValue] = useState<SmeIndustryId | undefined>(defaultValue)

  return (
    <>
      <input type="hidden" name={name} value={value ?? ''} />
      <Select
        value={value}
        onValueChange={(next) => setValue(next as SmeIndustryId)}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          aria-describedby={describedBy}
          className="w-full"
        >
          <SelectValue placeholder="업종을 선택해주세요 (선택 사항)">
            {(selected: unknown) => {
              if (isSmeIndustryId(selected)) return INDUSTRY_LABELS[selected]
              return '업종을 선택해주세요 (선택 사항)'
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {INDUSTRY_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )
}
