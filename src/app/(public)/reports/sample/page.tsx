import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '샘플 리포트 — 그린테크',
}

export default function ReportsSamplePage(): React.JSX.Element {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">
        샘플 리포트 — 그린테크
      </h1>
      <p className="mt-2 text-slate-500">
        가상 회사 &quot;그린테크&quot;의 풀 리포트가 여기에 표시됩니다.
      </p>
    </div>
  )
}
