import { Calendar, Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ReportHeaderProps {
  url: string
  createdAt: string
  diagnosisId: string
  isPaid: boolean
}

export function ReportHeader({
  url,
  createdAt,
  diagnosisId,
  isPaid,
}: ReportHeaderProps): React.JSX.Element {
  const formattedDate = new Date(createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <header className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        {url} 종합 분석 리포트
      </h1>
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex items-center gap-1.5 text-sm text-slate-500">
          <Calendar className="size-4" aria-hidden="true" />
          {formattedDate}
        </span>
        {isPaid ? (
          <a
            href={`/api/reports/${diagnosisId}/pdf`}
            download
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-primary-200 hover:text-primary-600 hover:shadow-md"
            aria-label="PDF 리포트 다운로드"
          >
            <Download className="size-4" aria-hidden="true" />
            PDF 다운로드
          </a>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled
            aria-label="PDF 다운로드 (유료 전용)"
          >
            <FileText className="size-4" aria-hidden="true" />
            PDF 다운로드
          </Button>
        )}
      </div>
    </header>
  )
}
