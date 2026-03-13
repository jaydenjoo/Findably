import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '메타태그 최적화',
}

export default function ActionsMetaTagsPage(): React.JSX.Element {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">메타태그 최적화</h1>
      <p className="mt-2 text-slate-500">
        메타태그 최적화안이 여기에 표시됩니다.
      </p>
    </div>
  )
}
