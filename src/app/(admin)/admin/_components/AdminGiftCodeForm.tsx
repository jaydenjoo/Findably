'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'

export function AdminGiftCodeForm(): React.JSX.Element {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [maxUses, setMaxUses] = useState('3')
  const [expiresInDays, setExpiresInDays] = useState('30')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  function generateRandomCode(): void {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let random = ''
    for (let i = 0; i < 6; i++) {
      random += chars[Math.floor(Math.random() * chars.length)]
    }
    setCode(`FDB-${random}`)
  }

  function handleCreate(): void {
    if (!code.trim() || isLoading) return
    setIsLoading(true)
    setMessage('요청 중...')

    fetch('/api/admin/gift-codes', {
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
      .then(async (response) => {
        const text = await response.text()
        let result: { success?: boolean; error?: string } = {}
        try {
          result = JSON.parse(text) as { success?: boolean; error?: string }
        } catch {
          setMessage(`파싱 실패: ${text.slice(0, 100)}`)
          setIsLoading(false)
          return
        }

        if (!response.ok || !result.success) {
          setMessage(result.error ?? `실패 (${response.status})`)
          setIsLoading(false)
          return
        }

        setMessage('코드 생성 완료!')
        setCode('')
        setDescription('')
        setIsLoading(false)
        router.refresh()
      })
      .catch((err: unknown) => {
        setMessage(`오류: ${err instanceof Error ? err.message : String(err)}`)
        setIsLoading(false)
      })
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
          <div className="flex gap-1.5">
            <input
              id="gc-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="FDB-A3K7X2"
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-mono"
            />
            <button
              type="button"
              onClick={generateRandomCode}
              className="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
              title="자동 생성"
            >
              🎲
            </button>
          </div>
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
            className={`text-xs font-medium ${message.includes('완료') ? 'text-success-600' : 'text-danger-600'}`}
          >
            {message}
          </span>
        )}
      </div>
    </div>
  )
}
