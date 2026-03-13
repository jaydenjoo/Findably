'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import { DASHBOARD_NAV_ITEMS, isNavActive } from '@/config/navigation'
import { SITE_NAME, SITE_VERSION } from '@/config/site'

export function Sidebar(): React.JSX.Element {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex lg:w-[220px] lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white">
      {/* 로고 */}
      <div className="flex h-14 items-center border-b border-slate-200 px-5">
        <Link
          href="/dashboard"
          className="text-lg font-extrabold tracking-tight text-primary-700 font-display"
        >
          {SITE_NAME}
        </Link>
      </div>

      {/* 메뉴 */}
      <nav
        className="flex flex-1 flex-col gap-1 p-3"
        aria-label="대시보드 내비게이션"
      >
        {DASHBOARD_NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = isNavActive(pathname, item.href)

          if (item.locked) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger
                  render={
                    <div
                      role="link"
                      aria-disabled="true"
                      className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm font-normal text-slate-400 opacity-60"
                      aria-label={`${item.label} — PRO 전용`}
                    />
                  }
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                  <Badge
                    variant="secondary"
                    className="ml-auto h-4 px-1.5 text-[10px] font-semibold"
                  >
                    PRO
                  </Badge>
                  <Lock className="size-3" />
                </TooltipTrigger>
                <TooltipContent side="right">
                  유료 결제 후 이용 가능합니다
                </TooltipContent>
              </Tooltip>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? 'bg-primary-50 font-semibold text-primary-700'
                  : 'font-normal text-slate-600 hover:bg-slate-50'
              }`}
              {...(active ? { 'aria-current': 'page' as const } : {})}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* 하단 */}
      <div className="border-t border-slate-200 px-5 py-3">
        <p className="text-xs text-slate-400">
          {SITE_NAME}{' '}
          <span className="font-mono text-[10px]">v{SITE_VERSION}</span>
        </p>
      </div>
    </aside>
  )
}
