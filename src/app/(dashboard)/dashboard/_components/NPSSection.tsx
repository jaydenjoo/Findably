'use client'

import { useState } from 'react'

interface NPSSectionProps {
  diagnosisId: string
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

/**
 * NPS (Net Promoter Score) 1문항 수집 섹션
 *
 * - 0-10 점수 + 선택 코멘트
 * - 제출 후 감사 메시지로 전환 (컴포넌트 내부 상태)
 * - POST /api/nps → 성공 응답 또는 중복(23505)도 submitted=true로 처리됨
 * - Activation-First 런칭 전략의 피드백 수집 지점
 */
export function NPSSection({
  diagnosisId,
}: NPSSectionProps): React.JSX.Element {
  const [selectedScore, setSelectedScore] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [state, setState] = useState<SubmitState>('idle')

  async function handleSubmit(): Promise<void> {
    if (selectedScore === null) return
    setState('submitting')
    try {
      const res = await fetch('/api/nps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosisId,
          score: selectedScore,
          comment: comment.trim() || undefined,
        }),
      })
      if (!res.ok) {
        setState('error')
        return
      }
      setState('success')
    } catch (error) {
      console.error('[NPSSection] 제출 실패', error)
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <section
        className="rounded-lg border border-success-100 bg-success-50 p-6 text-center"
        aria-live="polite"
        aria-label="NPS 제출 완료"
      >
        <p className="text-sm font-medium text-success-700">
          소중한 의견 감사합니다. 더 나은 리포트를 만드는 데 활용할게요.
        </p>
      </section>
    )
  }

  return (
    <section
      className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      aria-labelledby="nps-heading"
    >
      <div className="flex flex-col gap-1">
        <h2 id="nps-heading" className="text-lg font-semibold text-slate-900">
          이 리포트를 동료에게 추천하시겠어요?
        </h2>
        <p className="text-sm text-slate-500">
          0점(전혀 아니다) ~ 10점(매우 그렇다)
        </p>
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="radiogroup"
        aria-label="NPS 점수 선택"
      >
        {Array.from({ length: 11 }, (_, i) => i).map((score) => {
          const isSelected = selectedScore === score
          return (
            <button
              key={score}
              type="button"
              onClick={() => setSelectedScore(score)}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${score}점`}
              className={`flex h-10 w-10 items-center justify-center rounded-md border text-sm font-semibold transition-colors cursor-pointer ${
                isSelected
                  ? 'border-primary-500 bg-primary-500 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-primary-300 hover:bg-primary-50'
              }`}
            >
              {score}
            </button>
          )
        })}
      </div>

      {selectedScore !== null && (
        <div className="flex flex-col gap-2">
          <label
            htmlFor="nps-comment"
            className="text-sm font-medium text-slate-700"
          >
            의견 (선택)
          </label>
          <textarea
            id="nps-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="어떤 점이 좋았나요? 무엇이 개선되면 좋을까요?"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none"
          />
        </div>
      )}

      {state === 'error' && (
        <p role="alert" className="text-sm text-danger-600">
          제출에 실패했습니다. 잠시 후 다시 시도해주세요.
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={selectedScore === null || state === 'submitting'}
          className="inline-flex items-center gap-1 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-slate-300 cursor-pointer"
        >
          {state === 'submitting' ? '제출 중...' : '의견 보내기 →'}
        </button>
      </div>
    </section>
  )
}
