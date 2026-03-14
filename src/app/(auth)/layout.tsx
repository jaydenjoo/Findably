import Link from 'next/link'
import { SITE_NAME } from '@/config/site'

/**
 * Auth 공용 레이아웃 (Server Component)
 *
 * /login, /signup, /reset-password, /update-password 페이지가 공유
 * 구조: 전체 화면 중앙에 카드 1장 배치 (은행 앱 로그인 화면처럼)
 *
 * 라우트 그룹 (auth) → URL에는 영향 없음
 * 예: src/app/(auth)/login/page.tsx → URL은 /login
 */
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.JSX.Element {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-slate-50 bg-[radial-gradient(circle,#dde0e4_0.5px,transparent_0.5px)] bg-[length:22px_22px] px-4 py-8">
      {/* 로고 / 브랜딩 */}
      <Link
        href="/"
        className="mb-8 font-display text-2xl font-bold tracking-tight text-slate-900"
        aria-label={`${SITE_NAME} 홈으로 이동`}
      >
        {SITE_NAME}
      </Link>

      {/* 페이지별 콘텐츠 (카드) */}
      <div className="w-full max-w-[420px]">{children}</div>

      {/* 하단 안내 */}
      <p className="mt-8 text-center text-xs text-slate-400">
        계속 진행하면{' '}
        <Link href="/terms" className="underline hover:text-slate-600">
          이용약관
        </Link>
        {' 및 '}
        <Link href="/privacy" className="underline hover:text-slate-600">
          개인정보처리방침
        </Link>
        에 동의하는 것으로 간주됩니다.
      </p>
    </div>
  )
}
