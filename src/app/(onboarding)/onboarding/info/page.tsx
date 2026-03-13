import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '추가 정보',
}

export default function OnboardingInfoPage(): React.JSX.Element {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">추가 정보 (선택)</h1>
      <p className="mt-2 text-slate-500">
        타겟 키워드, 경쟁사, 업종 정보를 입력하면 더 정확한 진단이 가능합니다.
      </p>
    </div>
  )
}
