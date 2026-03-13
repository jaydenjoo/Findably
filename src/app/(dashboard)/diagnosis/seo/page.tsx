import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SEO 상세',
}

export default function DiagnosisSeoPage(): React.JSX.Element {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">SEO 상세</h1>
      <p className="mt-2 text-slate-500">
        검색 엔진 최적화 상세 분석이 여기에 표시됩니다.
      </p>
    </div>
  )
}
