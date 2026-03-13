'use client'

import { usePathname } from 'next/navigation'
import { getPageTitle } from '@/config/navigation'
import { MobileMenu } from '@/components/dashboard/MobileMenu'

export function Header(): React.JSX.Element {
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname) || '대시보드'

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
      {/* 좌: 모바일 메뉴 + 타이틀 */}
      <div className="flex items-center gap-3">
        <MobileMenu />
        <h1 className="text-lg font-semibold text-slate-900">{pageTitle}</h1>
      </div>

      {/* 우: 유저 아바타 */}
      <div
        className="flex size-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700"
        aria-label="사용자 프로필"
      >
        U
      </div>
    </header>
  )
}
