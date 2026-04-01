'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { CrawlData } from '@/features/crawling'
import type { QuickWin } from '@/features/diagnosis-free/types'
import { AlertTriangle } from 'lucide-react'
import {
  parseSchemaMarkup,
  generateRecommendedSchemas,
  CMS_GUIDES,
  DEFAULT_CMS_GUIDE,
} from '@/features/actions'
import { ExistingSchemaSection } from './ExistingSchemaSection'
import { RecommendedSchemaSection } from './RecommendedSchemaSection'
import { CmsGuideSection } from '@/components/shared/CmsGuideSection'

interface CopyState {
  index: number
  success: boolean
}

interface SchemaContentProps {
  crawlData: CrawlData | null
  url: string
  isPaid: boolean
  failedItems?: QuickWin[]
}

export function SchemaContent({
  crawlData,
  url,
  isPaid,
  failedItems = [],
}: SchemaContentProps): React.JSX.Element {
  const [copyState, setCopyState] = useState<CopyState | null>(null)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    }
  }, [])

  const handleCopy = useCallback(
    async (code: string, index: number): Promise<void> => {
      const wrappedCode = `<script type="application/ld+json">\n${code}\n</script>`
      try {
        await navigator.clipboard.writeText(wrappedCode)
        setCopyState({ index, success: true })
      } catch (err) {
        console.error('[handleCopy]', err)
        setCopyState({ index, success: false })
      }

      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
      copyTimerRef.current = setTimeout(() => {
        setCopyState(null)
        copyTimerRef.current = null
      }, 2000)
    },
    []
  )

  if (!crawlData) {
    return (
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Schema Markup</h1>
          <p className="mt-2 text-sm text-slate-500">
            사이트의 구조화 데이터를 분석하고, 추천 Schema 코드를 생성합니다.
          </p>
        </div>
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-slate-100">
            <span className="text-lg text-slate-400" aria-hidden="true">
              ?
            </span>
          </div>
          <p className="text-sm font-medium text-slate-700">
            진단을 먼저 실행해주세요
          </p>
          <p className="text-xs text-slate-500">
            URL 진단 후 Schema Markup 분석 결과를 확인할 수 있습니다.
          </p>
        </div>
      </div>
    )
  }

  const rawSchemas = crawlData.layer1?.schema_markup ?? []
  const parsedSchemas = parseSchemaMarkup(rawSchemas)

  const existingTypes = parsedSchemas.map((s) => s.type)
  const recommendations = generateRecommendedSchemas({
    url,
    title: crawlData.layer1?.meta.title ?? null,
    description: crawlData.layer1?.meta.description ?? null,
    existingTypes,
  })

  const detectedCms = crawlData.cms?.detected ?? null
  const guide =
    detectedCms && detectedCms in CMS_GUIDES
      ? (CMS_GUIDES[detectedCms] ?? DEFAULT_CMS_GUIDE)
      : DEFAULT_CMS_GUIDE

  // Schema 관련 실패 항목 필터링
  const schemaRelatedItems = failedItems.filter(
    (item) =>
      item.ruleName.toLowerCase().includes('schema') ||
      item.ruleName.toLowerCase().includes('og') ||
      item.ruleName.toLowerCase().includes('json-ld') ||
      item.category === 'social-ai' ||
      item.category === 'content'
  )

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Schema Markup</h1>
        <p className="mt-2 text-sm text-slate-500">
          사이트의 구조화 데이터를 분석하고, 추천 Schema 코드를 생성합니다.
        </p>
      </div>

      {/* 진단에서 발견된 문제 */}
      {schemaRelatedItems.length > 0 && (
        <div className="rounded-xl border border-warning-200 bg-warning-50/50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="size-4 text-warning-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              진단에서 발견된 구조화 데이터 문제 ({schemaRelatedItems.length}건)
            </h2>
          </div>
          <div className="space-y-2">
            {schemaRelatedItems.map((item) => (
              <div
                key={item.ruleId}
                className="flex items-start gap-3 rounded-lg bg-white p-3 text-sm"
              >
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-warning-100 text-[10px] font-bold text-warning-700">
                  !
                </span>
                <div>
                  <p className="font-medium text-slate-900">{item.ruleName}</p>
                  <p className="mt-0.5 text-slate-500">{item.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ExistingSchemaSection schemas={parsedSchemas} />

      <RecommendedSchemaSection
        recommendations={recommendations}
        isPaid={isPaid}
        copyState={copyState}
        onCopy={handleCopy}
      />

      <CmsGuideSection guide={guide} />
    </div>
  )
}
