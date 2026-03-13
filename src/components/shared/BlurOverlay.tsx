import Link from 'next/link'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BlurOverlayProps } from '@/types/ui'

/**
 * 유료 전환 블러 오버레이 — 상단 일부만 선명하게 보여주고 나머지는 블러
 *
 * @example
 * <BlurOverlay ctaHref="/pricing" sampleHref="/reports/sample">
 *   <DetailedReport data={data} />
 * </BlurOverlay>
 */
export function BlurOverlay({
  children,
  visiblePercent = 25,
  ctaLabel = '상세 분석 받기 — 9.9만원',
  ctaHref = '/pricing',
  sampleLabel = '샘플 먼저 보기 →',
  sampleHref = '/reports/sample',
}: BlurOverlayProps): React.JSX.Element {
  return (
    <div className="relative overflow-hidden">
      {/* 실제 콘텐츠 (블러 뒤에 깔림) */}
      <div aria-hidden="true" className="select-none">
        {children}
      </div>

      {/* 블러 그라데이션 */}
      <div
        aria-hidden="true"
        className="blur-overlay-gradient pointer-events-none absolute inset-0"
        style={
          {
            '--blur-start': `${visiblePercent}%`,
            '--blur-mid': `${visiblePercent + 10}%`,
            '--blur-end': `${visiblePercent + 30}%`,
          } as React.CSSProperties
        }
      />

      {/* CTA 영역 */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-4 pb-12 pt-8">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary-50">
          <Lock className="size-5 text-primary-500" />
        </div>

        <p className="text-sm font-medium text-slate-700">
          전체 분석 결과를 확인하세요
        </p>

        <div className="flex flex-col items-center gap-2 sm:flex-row">
          <Button
            render={<Link href={ctaHref} />}
            aria-label={`${ctaLabel} — 유료 상세 분석으로 이동`}
          >
            {ctaLabel}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            render={<Link href={sampleHref} />}
            aria-label="그린테크 샘플 리포트 보기"
          >
            {sampleLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
