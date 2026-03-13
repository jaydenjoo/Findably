import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '프로필 설정',
}

export default function SettingsProfilePage(): React.JSX.Element {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">프로필 설정</h1>
      <p className="mt-2 text-slate-500">프로필 수정이 여기에 표시됩니다.</p>
    </div>
  )
}
