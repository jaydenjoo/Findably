'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, LogOut } from 'lucide-react'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import { DASHBOARD_NAV_ITEMS, isNavActive } from '@/config/navigation'
import { SITE_NAME } from '@/config/site'
import { NavLink } from './NavLink'
import { logoutAction } from '@/features/auth/actions/logout'

export function MobileMenu(): React.JSX.Element {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="inline-flex size-8 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none lg:hidden"
        aria-label="메뉴 열기"
      >
        <Menu className="size-5" />
      </SheetTrigger>

      <SheetContent side="left" className="w-[220px] p-0">
        <SheetTitle className="sr-only">내비게이션 메뉴</SheetTitle>

        {/* 로고 */}
        <div className="flex h-14 items-center border-b border-slate-200 px-5">
          <Link
            href="/dashboard"
            className="text-lg font-extrabold tracking-tight text-primary-600 font-display"
            onClick={() => setOpen(false)}
          >
            {SITE_NAME}
          </Link>
        </div>

        {/* 메뉴 */}
        <nav
          className="flex flex-col gap-1 p-3"
          aria-label="대시보드 내비게이션"
        >
          {DASHBOARD_NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = isNavActive(pathname, item.href)
            const ariaLabel = item.locked
              ? `${item.label} — PRO 전용`
              : item.label

            return (
              <NavLink
                key={item.href}
                href={item.href}
                icon={Icon}
                label={item.label}
                active={active}
                locked={item.locked ?? false}
                ariaLabel={ariaLabel}
                onClick={() => setOpen(false)}
              />
            )
          })}
        </nav>

        {/* 로그아웃 */}
        <div className="border-t border-slate-200 px-3 py-3">
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
        </div>
      </SheetContent>
    </Sheet>
  )
}
