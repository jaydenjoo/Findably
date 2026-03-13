import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'URL 입력',
}

export default function OnboardingUrlPage(): React.JSX.Element {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">
        진단할 URL을 입력하세요
      </h1>
      <p className="mt-2 text-slate-500">
        분석할 웹사이트 주소를 입력해주세요.
      </p>
    </div>
  )
}
