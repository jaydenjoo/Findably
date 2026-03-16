import { Calendar, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ReportHeaderProps {
  url: string
  createdAt: string
}

export function ReportHeader({
  url,
  createdAt,
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
        <Button
          variant="outline"
          size="sm"
          disabled
          aria-label="PDF 다운로드 (준비 중)"
        >
          <FileText className="size-4" aria-hidden="true" />
          PDF 다운로드
        </Button>
      </div>
    </header>
  )
}
