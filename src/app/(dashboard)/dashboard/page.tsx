import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '대시보드',
}

export default function DashboardPage(): React.JSX.Element {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">대시보드</h1>
      <p className="mt-2 text-slate-500">
        종합 마케팅 진단 결과가 여기에 표시됩니다.
      </p>
    </div>
  )
}
