'use client'

import { useState, useSyncExternalStore } from 'react'
import { Wrench, X, Clock } from 'lucide-react'
import type { MaintenanceNotice as MaintenanceNoticeData } from '@/features/admin/maintenance/types'

const STORAGE_KEY = 'findably.maintenance-dismissed'

/**
 * 세션 스토리지 변경을 구독 — 다른 탭에서 변경 시 반영.
 * 동일 탭 내 변경은 setLocallyDismissed로 처리.
 */
function subscribeStorage(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

/** 클라이언트: 세션 스토리지에서 dismissed 여부 조회 */
function getClientSnapshot(): boolean {
  if (typeof window === 'undefined') return true
  return sessionStorage.getItem(STORAGE_KEY) === 'true'
}

/** 서버: SSR/hydration 기간 동안은 "dismissed"로 취급 — 모달 미표시 */
function getServerSnapshot(): boolean {
  return true
}

interface MaintenanceNoticeProps {
  notice: MaintenanceNoticeData
}

/**
 * 서비스 점검 공지 모달
 *
 * 랜딩 페이지 첫 진입 시 1회 표시. 세션 내에서는 "알겠습니다" 후 재표시 안 됨.
 * 내용은 Admin UI(/admin)에서 수정 가능. notice 데이터는 서버에서 전달받음.
 *
 * React 19 `useSyncExternalStore`로 SSR 안전하게 sessionStorage 동기화.
 */
export default function MaintenanceNotice({
  notice,
}: MaintenanceNoticeProps): React.JSX.Element | null {
  const storageDismissed = useSyncExternalStore(
    subscribeStorage,
    getClientSnapshot,
    getServerSnapshot
  )
  const [locallyDismissed, setLocallyDismissed] = useState(false)

  // Admin에서 공지 비활성화한 경우 아예 렌더하지 않음
  if (!notice.isActive) return null

  const isDismissed = storageDismissed || locallyDismissed

  const handleClose = (): void => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY, 'true')
    }
    setLocallyDismissed(true)
  }

  if (isDismissed) return null

  // 본문 줄바꿈 분리 — 빈 줄은 건너뜀
  const bodyParagraphs = notice.body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="maintenance-title"
      aria-describedby="maintenance-description"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* 백드롭 */}
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
        onClick={handleClose}
        aria-label="공지 배경 닫기"
      />

      {/* 모달 카드 */}
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="공지 닫기"
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="p-8">
          {/* 아이콘 */}
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-warning-50">
            <Wrench
              className="h-7 w-7 text-warning-600"
              aria-hidden="true"
              strokeWidth={2}
            />
          </div>

          {/* 제목 */}
          <h2
            id="maintenance-title"
            className="mb-3 text-center text-xl font-bold tracking-tight text-slate-900"
          >
            {notice.title}
          </h2>

          {/* 본문 */}
          <div
            id="maintenance-description"
            className="space-y-3 text-center text-sm leading-relaxed text-slate-600"
          >
            {bodyParagraphs.map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}

            {/* 예상 복구 시간 */}
            {notice.etaText && (
              <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-lg bg-warning-50 px-3 py-2 text-xs font-medium text-warning-700 ring-1 ring-warning-100">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{notice.etaText}</span>
              </div>
            )}

            {/* 문의 이메일 */}
            {notice.contactEmail && (
              <p className="pt-2 text-xs text-slate-500">
                문의:{' '}
                <a
                  href={`mailto:${notice.contactEmail}`}
                  className="font-medium text-primary-600 underline-offset-2 hover:underline"
                >
                  {notice.contactEmail}
                </a>
              </p>
            )}
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={handleClose}
            className="mt-6 w-full rounded-lg bg-primary-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          >
            알겠습니다
          </button>
        </div>
      </div>
    </div>
  )
}
