import Link from 'next/link'
import { SITE_NAME } from '@/config/site'

/**
 * Onboarding 전용 레이아웃 (Server Component)
 *
 * 로그인 필수이지만 사이드바 불필요.
 * 심플 구조: 로고 상단 + 중앙 콘텐츠
 */
export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.JSX.Element {
  return (
    <div className="flex min-h-svh flex-col bg-slate-50 bg-[radial-gradient(circle,#dde0e4_0.5px,transparent_0.5px)] bg-[length:22px_22px]">
      {/* 상단 로고 */}
      <header className="flex h-14 items-center border-b border-slate-200 bg-white px-4">
        <Link
          href="/dashboard"
          className="font-display text-lg font-extrabold tracking-tight text-primary-600 transition-opacity duration-200 hover:opacity-70"
          aria-label={`${SITE_NAME} 대시보드로 이동`}
        >
          {SITE_NAME}
        </Link>
      </header>

      {/* 중앙 콘텐츠 */}
      <main className="flex flex-1 flex-col items-center px-4 py-10">
        <div className="w-full max-w-2xl">{children}</div>
      </main>
    </div>
  )
}
