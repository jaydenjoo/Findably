'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Lock } from 'lucide-react'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import { useUserTier } from '@/lib/hooks/use-user-tier'

interface DiagnosisTab {
  label: string
  segment: string
  locked?: boolean
}

const DIAGNOSIS_TABS: DiagnosisTab[] = [
  { label: '종합', segment: 'overview' },
  { label: 'SEO', segment: 'seo' },
  { label: 'GEO', segment: 'geo' },
  { label: '콘텐츠', segment: 'content' },
  { label: '경쟁사', segment: 'competitors', locked: true },
]

export function DiagnosisTabNav(): React.JSX.Element {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const diagnosisId = searchParams.get('id')
  const { tier, isLoading } = useUserTier(diagnosisId)

  return (
    <nav
      className="overflow-x-auto border-b border-slate-200"
      aria-label="진단 카테고리 탭"
    >
      <div className="flex min-w-max gap-0">
        {DIAGNOSIS_TABS.map((tab) => {
          const query = diagnosisId ? `?id=${diagnosisId}` : ''
          const href = `/diagnosis/${tab.segment}${query}`
          const isActive = pathname === `/diagnosis/${tab.segment}`
          const isLocked = tab.locked && !isLoading && tier !== 'paid'

          const linkContent = (
            <Link
              href={href}
              className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'text-primary-600'
                  : 'text-slate-500 hover:text-slate-700'
              } ${isLocked ? 'text-slate-400' : ''}`}
              {...(isActive ? { 'aria-current': 'page' as const } : {})}
              aria-label={isLocked ? `${tab.label} — 유료 전용` : tab.label}
            >
              <span>{tab.label}</span>
              {isLocked && <Lock className="size-3.5" />}
              {isActive && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary-500" />
              )}
            </Link>
          )

          if (isLocked) {
            return (
              <Tooltip key={tab.segment}>
                <TooltipTrigger render={linkContent} />
                <TooltipContent side="bottom">
                  유료 결제 후 이용 가능합니다
                </TooltipContent>
              </Tooltip>
            )
          }

          return <Fragment key={tab.segment}>{linkContent}</Fragment>
        })}
      </div>
    </nav>
  )
}
