'use client'

import { useEffect, useState } from 'react'
import type { UserTier } from '@/lib/access-control/get-user-tier'
import { getUserTier } from '@/lib/access-control/get-user-tier'

interface UseUserTierResult {
  tier: UserTier | null
  isLoading: boolean
  error: string | null
}

/**
 * 진단 ID 기반 사용자 티어 조회 훅
 * - Server Action 래핑 → 클라이언트에서 사용
 * - diagnosisId가 null이면 로딩 없이 즉시 반환
 */
export function useUserTier(diagnosisId: string | null): UseUserTierResult {
  const [tier, setTier] = useState<UserTier | null>(null)
  const [isLoading, setIsLoading] = useState(!!diagnosisId)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!diagnosisId) return

    let cancelled = false

    getUserTier(diagnosisId).then((result) => {
      if (cancelled) return

      if (result.error) {
        setError(result.error)
        setTier(null)
      } else if (result.data) {
        setTier(result.data.tier)
        setError(null)
      }

      setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [diagnosisId])

  return { tier, isLoading, error }
}
