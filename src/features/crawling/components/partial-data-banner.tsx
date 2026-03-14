import { AlertTriangle } from 'lucide-react'

interface PartialDataBannerProps {
  blockedReason?: string
}

/**
 * 크롤링 데이터가 부분적일 때 표시하는 경고 배너
 *
 * crawl_data.is_partial === true인 경우 대시보드 상단에 배치.
 * robots.txt 차단 사유 + GSC 연동 유도 (Phase 2 비활성).
 */
export function PartialDataBanner({ blockedReason }: PartialDataBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-warning-200 bg-warning-50 p-4"
    >
      <AlertTriangle
        className="mt-0.5 size-5 shrink-0 text-warning-600"
        aria-hidden="true"
      />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-semibold text-slate-900">
          일부 항목이 제한되었습니다
        </p>
        <p className="text-sm text-slate-600">
          {blockedReason ? `사유: ${blockedReason}. ` : ''}
          robots.txt 또는 서버 설정으로 인해 직접 크롤링(HTML 분석)이 제한되어,
          Google API 및 보안 검사 결과만 포함되었습니다.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Google Search Console을 연동하면 더 정확한 진단이 가능합니다.{' '}
          <span className="text-slate-400">(Phase 2 예정)</span>
        </p>
      </div>
    </div>
  )
}
