import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Schema Markup',
}

export default function ActionsSchemaPage(): React.JSX.Element {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Schema Markup</h1>
      <p className="mt-2 text-slate-500">
        Schema Markup 코드 생성 도구가 여기에 표시됩니다.
      </p>
    </div>
  )
}
