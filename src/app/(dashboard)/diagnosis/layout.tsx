import { Suspense } from 'react'
import { DiagnosisTabNav } from '@/components/dashboard/DiagnosisTabNav'

interface LayoutProps {
  children: React.ReactNode
}

export default function DiagnosisLayout({
  children,
}: LayoutProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      <Suspense
        fallback={<div className="h-[49px] border-b border-slate-200" />}
      >
        <DiagnosisTabNav />
      </Suspense>
      {children}
    </div>
  )
}
