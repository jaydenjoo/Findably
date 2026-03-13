import Link from 'next/link'
import { SITE_NAME } from '@/config/site'

export function Footer(): React.JSX.Element {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-500 md:flex-row">
        <p>
          &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </p>
        <div className="flex gap-4">
          <Link
            href="/terms"
            className="hover:text-slate-700 transition-colors"
          >
            이용약관
          </Link>
          <Link
            href="/privacy"
            className="hover:text-slate-700 transition-colors"
          >
            개인정보처리방침
          </Link>
        </div>
      </div>
    </footer>
  )
}
