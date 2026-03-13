'use client'

import { useSyncExternalStore } from 'react'
import { WifiOff } from 'lucide-react'

function subscribe(callback: () => void): () => void {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

function getSnapshot(): boolean {
  return !navigator.onLine
}

/** SSR에서는 항상 온라인으로 간주 — navigator API 미존재, 하이드레이션 후 클라이언트에서 실제 상태 반영 */
function getServerSnapshot(): boolean {
  return false
}

/**
 * 오프라인 감지 배너 — 네트워크 끊기면 상단 고정 표시
 * 온라인 복구 시 자동 숨김
 */
export function OfflineBanner(): React.JSX.Element | null {
  const isOffline = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )

  if (!isOffline) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-0 z-50 flex w-full items-center justify-center gap-2 bg-warning-50 px-4 py-2 text-sm font-medium text-warning-600"
    >
      <WifiOff className="size-4" />
      인터넷 연결을 확인해주세요
    </div>
  )
}
