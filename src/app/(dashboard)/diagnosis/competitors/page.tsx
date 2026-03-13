import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '경쟁사 비교',
}

export default function DiagnosisCompetitorsPage(): React.JSX.Element {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">경쟁사 비교</h1>
      <p className="mt-2 text-slate-500">
        경쟁사 비교 분석이 여기에 표시됩니다.
      </p>
    </div>
  )
}
