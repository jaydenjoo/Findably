'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import { PUBLIC_NAV_ITEMS } from '@/config/navigation'
import { SITE_NAME } from '@/config/site'

export function GNB(): React.JSX.Element {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <nav
        className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4"
        aria-label="메인 내비게이션"
      >
        {/* 좌: 로고 */}
        <Link
          href="/"
          className="text-xl font-extrabold tracking-tight text-primary-600 font-display"
          aria-label={`${SITE_NAME} 홈으로 이동`}
        >
          {SITE_NAME}
        </Link>

        {/* 중: 데스크톱 메뉴 */}
        <ul className="hidden items-center gap-6 md:flex">
          {PUBLIC_NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary-600 ${
                  pathname === item.href ? 'text-primary-700' : 'text-slate-600'
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* 우: CTA (데스크톱) */}
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm" render={<Link href="/login" />}>
            로그인
          </Button>
          <Button size="sm" render={<Link href="/signup" />}>
            무료 진단 시작 →
          </Button>
        </div>

        {/* 모바일 햄버거 */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="메뉴 열기"
              />
            }
          >
            <Menu className="size-5" />
          </SheetTrigger>

          <SheetContent side="right" className="w-72 p-0">
            <SheetTitle className="sr-only">메뉴</SheetTitle>
            <div className="flex flex-col gap-1 p-4">
              <Link
                href="/"
                className="mb-4 text-lg font-extrabold tracking-tight text-primary-700 font-display"
                onClick={() => setOpen(false)}
              >
                {SITE_NAME}
              </Link>

              {PUBLIC_NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-50 ${
                    pathname === item.href
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600'
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              <hr className="my-3 border-slate-200" />

              <Button
                variant="ghost"
                size="sm"
                className="justify-start"
                render={<Link href="/login" onClick={() => setOpen(false)} />}
              >
                로그인
              </Button>
              <Button
                size="sm"
                render={<Link href="/signup" onClick={() => setOpen(false)} />}
              >
                무료 진단 시작 →
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  )
}
