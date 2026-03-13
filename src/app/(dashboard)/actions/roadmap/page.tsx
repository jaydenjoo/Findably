import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '90일 실행 계획',
}

export default function ActionsRoadmapPage(): React.JSX.Element {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">90일 실행 계획</h1>
      <p className="mt-2 text-slate-500">90일 실행 계획이 여기에 표시됩니다.</p>
    </div>
  )
}
