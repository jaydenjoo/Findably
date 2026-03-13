'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { AuthSession } from '@supabase/supabase-js'

/**
 * 세션 만료 경고 컴포넌트
 *
 * RootLayout에 삽입되어 전체 앱에서 동작
 * 타이머 비유: 은행 앱처럼 "5분 후 자동 로그아웃됩니다" 알림
 *
 * 동작 순서:
 * 1. onAuthStateChange로 로그인 상태 감시
 * 2. 세션 만료 5분 전 → 상단 경고 배너 표시
 * 3. "계속 사용 →" 클릭 → 세션 자동 갱신 (은행 앱의 "연장" 버튼)
 * 4. 아무 조치 안 하면 → 만료 시 /login으로 이동
 */

const WARNING_BEFORE_EXPIRY_MS = 5 * 60 * 1000 // 5분

export function SessionExpiryWarning(): React.JSX.Element | null {
  const router = useRouter()
  const [showWarning, setShowWarning] = useState(false)
  const warningTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const supabaseRef = useRef(createClient())

  const clearTimers = useCallback((): void => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current)
  }, [])

  const setupTimers = useCallback(
    (expiresAt: number): void => {
      clearTimers()

      const now = Date.now()
      const expiresAtMs = expiresAt * 1000
      const timeUntilExpiry = expiresAtMs - now
      const timeUntilWarning = timeUntilExpiry - WARNING_BEFORE_EXPIRY_MS

      if (timeUntilExpiry <= 0) {
        router.push('/login')
        return
      }

      if (timeUntilWarning > 0) {
        warningTimerRef.current = setTimeout(() => {
          setShowWarning(true)
        }, timeUntilWarning)
      } else {
        // 이미 5분 이내 → 즉시 경고 표시
        setShowWarning(true)
      }

      expiryTimerRef.current = setTimeout(() => {
        setShowWarning(false)
        router.push('/login')
      }, timeUntilExpiry)
    },
    [clearTimers, router]
  )

  useEffect(() => {
    const supabase = supabaseRef.current

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: string, session: AuthSession | null) => {
        if (session?.expires_at) {
          setupTimers(session.expires_at)
        } else {
          clearTimers()
          setShowWarning(false)
        }
      }
    )

    // 컴포넌트 마운트 시 현재 세션 확인
    supabase.auth
      .getSession()
      .then(
        ({ data: { session } }: { data: { session: AuthSession | null } }) => {
          if (session?.expires_at) {
            setupTimers(session.expires_at)
          }
        }
      )

    return () => {
      subscription.unsubscribe()
      clearTimers()
    }
  }, [setupTimers, clearTimers])

  async function handleContinue(): Promise<void> {
    const { data, error } = await supabaseRef.current.auth.refreshSession()

    if (error || !data.session) {
      router.push('/login')
      return
    }

    setShowWarning(false)
    if (data.session.expires_at) {
      setupTimers(data.session.expires_at)
    }
  }

  if (!showWarning) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between border-b border-amber-400 bg-amber-50 px-4 py-3"
    >
      <p className="text-sm font-medium text-amber-700">
        세션이 곧 만료됩니다. 계속 사용하시겠습니까?
      </p>
      <Button size="sm" onClick={handleContinue} aria-label="세션 연장하기">
        계속 사용 →
      </Button>
    </div>
  )
}
