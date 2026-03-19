import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: '프로필 설정 | Findably',
}

export default async function SettingsProfilePage(): Promise<React.JSX.Element> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const provider = user.app_metadata?.provider ?? 'email'
  const email = user.email ?? '(이메일 없음)'
  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—'

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">프로필 설정</h1>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">계정 정보</h2>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-slate-500">이메일</dt>
            <dd className="mt-1 text-sm text-slate-900">{email}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-slate-500">로그인 방식</dt>
            <dd className="mt-1 text-sm text-slate-900">
              {provider === 'google' ? 'Google' : '이메일/비밀번호'}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-slate-500">가입일</dt>
            <dd className="mt-1 text-sm text-slate-900">{createdAt}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">계정 삭제</h2>
        <p className="text-sm text-slate-500">
          계정 삭제를 원하시면{' '}
          <a
            href="mailto:support@findably.co.kr"
            className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            support@findably.co.kr
          </a>
          로 문의해 주세요.
        </p>
      </section>
    </div>
  )
}
