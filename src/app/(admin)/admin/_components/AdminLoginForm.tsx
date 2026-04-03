'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export function AdminLoginForm(): React.JSX.Element {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogin(): Promise<void> {
    if (!email || !password || isLoading) return
    setIsLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setIsLoading(false)
      return
    }

    router.refresh()
  }

  return (
    <div className="rounded-lg border border-warning-200 bg-warning-50 p-4 space-y-3">
      <p className="text-sm font-semibold text-warning-700">
        관리자 로그인이 필요합니다
      </p>
      <p className="text-xs text-slate-500">
        코드 생성 등 관리 기능을 사용하려면 관리자 계정으로 로그인하세요.
      </p>
      {error && <p className="text-xs text-danger-600">{error}</p>}
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          className="flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          placeholder="비밀번호"
          className="flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={handleLogin}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : '로그인'}
        </button>
      </div>
    </div>
  )
}
