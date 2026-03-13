import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '분석 중',
}

export default function OnboardingAnalyzingPage(): React.JSX.Element {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">
        사이트를 분석하고 있습니다
      </h1>
      <p className="mt-2 text-slate-500">
        분석 대기 화면(프로그레스바)이 여기에 표시됩니다.
      </p>
    </div>
  )
}
