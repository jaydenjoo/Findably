import Link from 'next/link'
import { SearchX } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button-variants'

export default function NotFound(): React.JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div
        role="alert"
        aria-live="polite"
        className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <SearchX className="h-7 w-7 text-red-500" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-xl font-bold text-slate-900">
          찾으시는 페이지가 없습니다
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          주소를 다시 확인하거나 홈으로 이동해주세요.
        </p>
        <Link
          href="/"
          className={buttonVariants({
            variant: 'default',
            size: 'lg',
            className: 'mt-6',
          })}
        >
          홈으로 돌아가기 →
        </Link>
      </div>
    </div>
  )
}
