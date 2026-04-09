'use client'

import { useActionState } from 'react'
import { updateMaintenanceNoticeAction } from '../_actions/update-maintenance-notice'
import type { MaintenanceNotice } from '@/features/admin/maintenance/types'

interface AdminMaintenanceFormProps {
  initialData: MaintenanceNotice
}

/**
 * 점검 공지 관리 폼 (Admin 전용)
 *
 * 필드:
 * - isActive: ON/OFF 체크박스
 * - title: 제목
 * - body: 본문 (줄바꿈 허용)
 * - etaText: 예상 복구 시간 (선택)
 * - contactEmail: 문의 이메일 (선택)
 */
export function AdminMaintenanceForm({
  initialData,
}: AdminMaintenanceFormProps): React.JSX.Element {
  const [state, formAction, isPending] = useActionState(
    updateMaintenanceNoticeAction,
    { message: '' }
  )

  return (
    <form
      action={formAction}
      className="rounded-lg border border-slate-200 bg-white p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">점검 공지</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            랜딩 페이지(/)에 표시되는 점검 모달을 관리합니다
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            initialData.isActive
              ? 'bg-warning-50 text-warning-700 ring-1 ring-warning-200'
              : 'bg-success-50 text-success-700 ring-1 ring-success-200'
          }`}
        >
          현재: {initialData.isActive ? '노출 중' : '비활성'}
        </span>
      </div>

      {/* ON/OFF 체크박스 */}
      <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 cursor-pointer">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={initialData.isActive}
          disabled={isPending}
          className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
        />
        <div className="flex-1">
          <span className="text-sm font-medium text-slate-800">공지 노출</span>
          <p className="text-xs text-slate-500 mt-0.5">
            체크하면 랜딩 페이지 첫 진입 시 점검 모달이 표시됩니다
          </p>
        </div>
      </label>

      {/* 제목 */}
      <div>
        <label
          htmlFor="maint-title"
          className="block text-xs font-medium text-slate-600 mb-1"
        >
          제목
        </label>
        <input
          id="maint-title"
          name="title"
          type="text"
          defaultValue={initialData.title}
          required
          maxLength={100}
          disabled={isPending}
          className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm disabled:opacity-50"
        />
      </div>

      {/* 본문 */}
      <div>
        <label
          htmlFor="maint-body"
          className="block text-xs font-medium text-slate-600 mb-1"
        >
          본문{' '}
          <span className="text-slate-400">
            (줄바꿈으로 단락 구분, 최대 2000자)
          </span>
        </label>
        <textarea
          id="maint-body"
          name="body"
          defaultValue={initialData.body}
          required
          maxLength={2000}
          rows={6}
          disabled={isPending}
          className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-relaxed disabled:opacity-50"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* ETA */}
        <div>
          <label
            htmlFor="maint-eta"
            className="block text-xs font-medium text-slate-600 mb-1"
          >
            예상 복구 시간 <span className="text-slate-400">(선택)</span>
          </label>
          <input
            id="maint-eta"
            name="etaText"
            type="text"
            defaultValue={initialData.etaText ?? ''}
            maxLength={200}
            placeholder="예: 2026-04-10 18:00 복구 예정"
            disabled={isPending}
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm disabled:opacity-50"
          />
        </div>

        {/* 이메일 */}
        <div>
          <label
            htmlFor="maint-email"
            className="block text-xs font-medium text-slate-600 mb-1"
          >
            문의 이메일 <span className="text-slate-400">(선택)</span>
          </label>
          <input
            id="maint-email"
            name="contactEmail"
            type="email"
            defaultValue={initialData.contactEmail ?? ''}
            placeholder="support@findably.kr"
            disabled={isPending}
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm disabled:opacity-50"
          />
        </div>
      </div>

      {/* 제출 + 메시지 */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50 cursor-pointer"
        >
          {isPending ? '저장 중...' : '저장'}
        </button>
        {state.message && (
          <span
            className={`text-sm font-medium ${
              state.success ? 'text-success-600' : 'text-danger-600'
            }`}
          >
            {state.message}
          </span>
        )}
      </div>
    </form>
  )
}
