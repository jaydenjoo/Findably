import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '상세 리포트',
}

export default function ReportDetailPage(): React.JSX.Element {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">상세 리포트</h1>
      <p className="mt-2 text-slate-500">
        상세 리포트와 PDF 다운로드가 여기에 표시됩니다.
      </p>
    </div>
  )
}
