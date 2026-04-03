'use client'

import { useActionState, useRef } from 'react'
import { createGiftCodeAction } from '../_actions/create-gift-code'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let random = ''
  for (let i = 0; i < 6; i++) {
    random += chars[Math.floor(Math.random() * chars.length)]
  }
  return `FDB-${random}`
}

export function AdminGiftCodeForm(): React.JSX.Element {
  const [state, formAction, isPending] = useActionState(createGiftCodeAction, {
    message: '',
  })
  const codeRef = useRef<HTMLInputElement>(null)

  return (
    <form
      action={formAction}
      className="rounded-lg border border-slate-200 bg-white p-4 space-y-3"
    >
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
              ref={codeRef}
              id="gc-code"
              name="code"
              type="text"
              placeholder="FRIEND-2026"
              required
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-mono uppercase"
            />
            <button
              type="button"
              onClick={() => {
                if (codeRef.current) codeRef.current.value = generateCode()
              }}
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
            name="maxUses"
            type="number"
            defaultValue={3}
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
            name="expiresInDays"
            type="number"
            defaultValue={30}
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
            name="description"
            type="text"
            placeholder="지인 테스트용"
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50 cursor-pointer"
        >
          {isPending ? '생성 중...' : '+ 생성'}
        </button>
        {state.message && (
          <span
            className={`text-sm font-medium ${state.message.startsWith('✓') ? 'text-success-600' : 'text-danger-600'}`}
          >
            {state.message}
          </span>
        )}
      </div>
    </form>
  )
}
