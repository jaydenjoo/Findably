'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import { DASHBOARD_NAV_ITEMS, isNavActive } from '@/config/navigation'
import { SITE_NAME } from '@/config/site'

export function MobileMenu(): React.JSX.Element {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="메뉴 열기"
          />
        }
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

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-primary-50 font-semibold text-primary-700'
                    : 'font-normal text-slate-600 hover:bg-slate-50'
                } ${item.locked ? 'opacity-70' : ''}`}
                onClick={() => setOpen(false)}
                {...(active ? { 'aria-current': 'page' as const } : {})}
                aria-label={
                  item.locked ? `${item.label} — PRO 전용` : item.label
                }
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
                {item.locked && (
                  <>
                    <Badge
                      variant="secondary"
                      className="ml-auto h-4 px-1.5 text-[10px] font-semibold"
                    >
                      PRO
                    </Badge>
                    <Lock className="size-3" />
                  </>
                )}
              </Link>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
