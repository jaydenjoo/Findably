import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '콘텐츠 상세',
}

export default function DiagnosisContentPage(): React.JSX.Element {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">콘텐츠 상세</h1>
      <p className="mt-2 text-slate-500">
        콘텐츠 품질 상세 분석이 여기에 표시됩니다.
      </p>
    </div>
  )
}
