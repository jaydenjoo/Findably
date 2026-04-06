'use client'

import { useState, useSyncExternalStore } from 'react'
import { Wrench, X } from 'lucide-react'

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

/**
 * 개발 중 공지 모달
 *
 * 랜딩 페이지 첫 진입 시 1회 표시. 세션 내에서는 "알겠습니다" 후 재표시 안 됨.
 * 크롤링 파이프라인 점검 중 — 사용자가 진단을 시도하면 실패하므로
 * 사전에 안내하는 목적.
 *
 * React 19 `useSyncExternalStore`로 SSR 안전하게 sessionStorage 동기화.
 */
export default function MaintenanceNotice(): React.JSX.Element | null {
  const storageDismissed = useSyncExternalStore(
    subscribeStorage,
    getClientSnapshot,
    getServerSnapshot
  )
  const [locallyDismissed, setLocallyDismissed] = useState(false)

  const isDismissed = storageDismissed || locallyDismissed

  const handleClose = (): void => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY, 'true')
    }
    setLocallyDismissed(true)
  }

  if (isDismissed) return null

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
            서비스 점검 중입니다
          </h2>

          {/* 본문 */}
          <div
            id="maintenance-description"
            className="space-y-3 text-center text-sm leading-relaxed text-slate-600"
          >
            <p>
              <strong className="font-semibold text-slate-800">
                Findably는 현재 개발 및 점검 중
              </strong>
              이라 진단 서비스를 이용하실 수 없습니다.
            </p>
            <p>
              더 안정적이고 정확한 진단을 제공해드리기 위해 작업 중이니 조금만
              기다려 주세요. 서비스가 정상화되면 공지해드릴게요.
            </p>
            <p className="pt-2 text-xs text-slate-500">
              문의:{' '}
              <a
                href="mailto:support@findably.kr"
                className="font-medium text-primary-600 underline-offset-2 hover:underline"
              >
                support@findably.kr
              </a>
            </p>
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
