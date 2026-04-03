'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'

interface CreateGiftCodeResponse {
  success: boolean
  error?: string
}

export function AdminGiftCodeForm(): React.JSX.Element {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [maxUses, setMaxUses] = useState('3')
  const [expiresInDays, setExpiresInDays] = useState('30')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleCreate(): Promise<void> {
    if (!code.trim() || isLoading) return
    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/gift-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          maxUses: parseInt(maxUses, 10) || 1,
          expiresInDays: parseInt(expiresInDays, 10) || 30,
          description: description.trim(),
        }),
      })
      const result = (await response.json()) as CreateGiftCodeResponse

      if (!response.ok || !result.success) {
        setMessage(result.error ?? '코드 생성 실패')
        setIsLoading(false)
        return
      }

      setMessage('코드 생성 완료!')
      setCode('')
      setDescription('')
      setIsLoading(false)
      router.refresh()
    } catch {
      setMessage('네트워크 오류')
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
      <h3 className="text-sm font-semibold text-slate-700">새 코드 생성</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label
            htmlFor="gc-code"
            className="block text-xs text-slate-500 mb-1"
          >
            코드
          </label>
          <input
            id="gc-code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="FRIEND-2026"
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-mono"
          />
        </div>
        <div>
          <label htmlFor="gc-max" className="block text-xs text-slate-500 mb-1">
            최대 사용 횟수
          </label>
          <input
            id="gc-max"
            type="number"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            min={1}
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="gc-expires"
            className="block text-xs text-slate-500 mb-1"
          >
            유효기간 (일)
          </label>
          <input
            id="gc-expires"
            type="number"
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(e.target.value)}
            min={1}
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="gc-desc"
            className="block text-xs text-slate-500 mb-1"
          >
            메모
          </label>
          <input
            id="gc-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="지인 테스트용"
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleCreate}
          disabled={!code.trim() || isLoading}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Plus className="size-3.5" />
          )}
          생성
        </button>
        {message && (
          <span
            className={`text-xs ${message.includes('완료') ? 'text-success-600' : 'text-danger-600'}`}
          >
            {message}
          </span>
        )}
      </div>
    </div>
  )
}
