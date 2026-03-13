import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '진단 결과',
}

export default function DiagnosisOverviewPage(): React.JSX.Element {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">진단 결과</h1>
      <p className="mt-2 text-slate-500">
        종합 점수와 카테고리별 분석이 여기에 표시됩니다.
      </p>
    </div>
  )
}
