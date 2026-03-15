import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface CtaBannerProps {
  variant: 'mid' | 'bottom'
}

export function CtaBanner({ variant }: CtaBannerProps): React.JSX.Element {
  if (variant === 'mid') {
    return (
      <section
        className="flex flex-col items-center gap-4 rounded-xl border border-primary-200 bg-primary-50 px-6 py-10 text-center"
        aria-label="진단 시작 안내"
      >
        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          내 사이트는 몇 점일까?
        </h2>
        <p className="max-w-md text-sm text-slate-600">
          URL 하나만 입력하면 2분 안에 무료 진단 결과를 받아볼 수 있습니다.
        </p>
        <Link
          href="/onboarding/url"
          className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-primary-600 hover:shadow-md"
        >
          무료 진단 시작
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    )
  }

  return (
    <section
      className="flex flex-col items-center gap-5 rounded-xl bg-slate-900 px-6 py-12 text-center"
      aria-label="무료 진단 안내"
    >
      <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
        무료로 내 사이트 진단하기
      </h2>
      <p className="max-w-lg text-sm text-slate-300">
        그린테크처럼 상세한 분석 결과를 받아보세요. URL 입력만으로 시작할 수
        있습니다.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/onboarding/url"
          className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-primary-600 hover:shadow-md"
        >
          무료 진단 시작
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-6 py-3 text-sm font-semibold text-slate-300 transition-all hover:-translate-y-0.5 hover:border-slate-400 hover:text-white"
        >
          요금제 보기
        </Link>
      </div>
    </section>
  )
}
