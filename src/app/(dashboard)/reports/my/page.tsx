import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '내 리포트',
}

export default function ReportsMyPage(): React.JSX.Element {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">내 리포트</h1>
      <p className="mt-2 text-slate-500">
        생성된 리포트 목록이 여기에 표시됩니다.
      </p>
    </div>
  )
}
