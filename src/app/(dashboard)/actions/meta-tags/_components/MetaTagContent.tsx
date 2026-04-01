'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { CrawlData } from '@/features/crawling'
import type { QuickWin } from '@/features/diagnosis-free/types'
import { AlertTriangle } from 'lucide-react'
import { CMS_META_GUIDES, DEFAULT_CMS_META_GUIDE } from '@/features/actions'
import { CmsGuideSection } from '@/components/shared/CmsGuideSection'
import {
  analyzeCurrentMetaTags,
  generateRecommendations,
  calculateMetaScore,
} from './meta-tag-utils'
import { CurrentMetaTagsSection } from './CurrentMetaTagsSection'
import { RecommendedMetaTagsSection } from './RecommendedMetaTagsSection'

interface CopyState {
  index: number
  success: boolean
}

interface MetaTagContentProps {
  crawlData: CrawlData | null
  url: string
  isPaid: boolean
  cmsDetected: string | null
  failedItems?: QuickWin[]
}

export function MetaTagContent({
  crawlData,
  url,
  isPaid,
  cmsDetected,
  failedItems = [],
}: MetaTagContentProps): React.JSX.Element {
  const [copyState, setCopyState] = useState<CopyState | null>(null)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    }
  }, [])

  const handleCopy = useCallback(
    async (code: string, index: number): Promise<void> => {
      try {
        await navigator.clipboard.writeText(code)
        setCopyState({ index, success: true })
      } catch (err) {
        console.error('[MetaTagContent.handleCopy]', err)
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

  // Empty state
  if (!crawlData) {
    return (
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">메타태그 최적화</h1>
          <p className="mt-2 text-sm text-slate-500">
            현재 메타태그를 분석하고 SEO 최적화 방안을 제안합니다.
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
            URL 진단 후 메타태그 분석 결과를 확인할 수 있습니다.
          </p>
        </div>
      </div>
    )
  }

  const meta = crawlData.layer1?.meta
  if (!meta) {
    return (
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">메타태그 최적화</h1>
          <p className="mt-2 text-sm text-slate-500">
            현재 메타태그를 분석하고 SEO 최적화 방안을 제안합니다.
          </p>
          {url && <p className="mt-1 truncate text-xs text-slate-400">{url}</p>}
        </div>
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-warning-50">
            <span className="text-lg text-warning-500" aria-hidden="true">
              !
            </span>
          </div>
          <p className="text-sm font-medium text-slate-700">
            메타태그 상세 데이터를 수집하지 못했습니다
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            크롤링 시 일부 사이트에서 HTML 메타태그 수집이 제한될 수 있습니다.
            <br />
            다시 진단을 실행하면 최신 데이터를 가져올 수 있습니다.
          </p>
          <a
            href="/onboarding/url"
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors"
          >
            다시 진단하기 →
          </a>
        </div>
      </div>
    )
  }

  const items = analyzeCurrentMetaTags(meta)
  const recommendations = generateRecommendations(meta, url)
  const score = calculateMetaScore(items)

  const metaGuide =
    cmsDetected && cmsDetected in CMS_META_GUIDES
      ? (CMS_META_GUIDES[cmsDetected] ?? DEFAULT_CMS_META_GUIDE)
      : DEFAULT_CMS_META_GUIDE

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">메타태그 최적화</h1>
        <p className="mt-2 text-sm text-slate-500">
          현재 메타태그를 분석하고 SEO 최적화 방안을 제안합니다.
        </p>
        {url && <p className="mt-1 truncate text-xs text-slate-400">{url}</p>}
      </div>

      {/* Score summary */}
      <div className="flex items-center gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div
          className={`flex size-16 items-center justify-center rounded-full font-display text-2xl font-extrabold tabular-nums ${
            score >= 70
              ? 'bg-success-50 text-success-600'
              : score >= 40
                ? 'bg-warning-50 text-warning-600'
                : 'bg-danger-50 text-danger-600'
          }`}
          role="meter"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`메타태그 점수 ${score}점`}
        >
          {score}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">
            메타태그 적합도
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {items.length}개 항목 중{' '}
            {items.filter((i) => i.status === 'ok').length}개 양호
          </p>
        </div>
      </div>

      {/* 진단에서 발견된 메타태그 문제 */}
      {failedItems.length > 0 &&
        (() => {
          const metaRelated = failedItems.filter(
            (item) =>
              item.ruleName.toLowerCase().includes('title') ||
              item.ruleName.toLowerCase().includes('description') ||
              item.ruleName.toLowerCase().includes('og') ||
              item.ruleName.toLowerCase().includes('meta') ||
              item.ruleName.toLowerCase().includes('canonical') ||
              item.ruleName.toLowerCase().includes('twitter') ||
              item.category === 'content' ||
              item.category === 'social-ai'
          )
          if (metaRelated.length === 0) return null
          return (
            <div className="rounded-xl border border-warning-200 bg-warning-50/50 p-5">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="size-4 text-warning-600" />
                <h2 className="text-sm font-semibold text-slate-900">
                  진단에서 발견된 메타태그 문제 ({metaRelated.length}건)
                </h2>
              </div>
              <div className="space-y-2">
                {metaRelated.map((item) => (
                  <div
                    key={item.ruleId}
                    className="flex items-start gap-3 rounded-lg bg-white p-3 text-sm"
                  >
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-warning-100 text-[10px] font-bold text-warning-700">
                      !
                    </span>
                    <div>
                      <p className="font-medium text-slate-900">
                        {item.ruleName}
                      </p>
                      <p className="mt-0.5 text-slate-500">{item.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

      {/* Current meta tags — always visible */}
      <CurrentMetaTagsSection items={items} />

      {/* Recommendations — BlurOverlay for free users */}
      <RecommendedMetaTagsSection
        recommendations={recommendations}
        isPaid={isPaid}
        copyState={copyState}
        onCopy={handleCopy}
      />

      {/* CMS별 메타태그 적용 가이드 */}
      <CmsGuideSection guide={metaGuide} />
    </div>
  )
}
