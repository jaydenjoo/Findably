'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import { NavLink } from './NavLink'
import { DASHBOARD_NAV_ITEMS, isNavActive } from '@/config/navigation'
import { SITE_NAME, SITE_VERSION } from '@/config/site'
import { logoutAction } from '@/features/auth/actions/logout'

export function Sidebar(): React.JSX.Element {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex lg:h-full lg:w-[220px] lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white">
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
          const ariaLabel = item.locked
            ? `${item.label} — PRO 전용`
            : item.label

          const navLink = (
            <NavLink
              href={item.href}
              icon={Icon}
              label={item.label}
              active={active}
              locked={item.locked ?? false}
              ariaLabel={ariaLabel}
            />
          )

          if (item.locked) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger render={navLink} />
                <TooltipContent side="right">
                  유료 결제 후 이용 가능합니다
                </TooltipContent>
              </Tooltip>
            )
          }

          return <React.Fragment key={item.href}>{navLink}</React.Fragment>
        })}
      </nav>

      {/* 하단 */}
      <div className="relative z-10 mt-auto border-t border-slate-200 px-5 py-3">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-normal text-slate-600 transition-colors hover:bg-slate-50"
            aria-label="로그아웃"
          >
            <LogOut className="size-4" />
            <span>로그아웃</span>
          </button>
        </form>
        <p className="mt-2 text-xs text-slate-400">
          {SITE_NAME}{' '}
          <span className="font-mono text-[10px]">v{SITE_VERSION}</span>
        </p>
      </div>
    </aside>
  )
}
