import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { CrawlData } from '@/features/crawling'
import { MetaTagContent } from './_components/MetaTagContent'

export const metadata: Metadata = {
  title: '메타태그 최적화 | Findably',
  description: '메타태그 분석 및 최적화 제안을 확인하세요.',
}

export default async function ActionsMetaTagsPage(): Promise<React.JSX.Element> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: diagnosis } = await supabase
    .from('diagnoses')
    .select('id, url, tier, crawl_data')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!diagnosis) {
    return (
      <MetaTagContent
        crawlData={null}
        url=""
        isPaid={false}
        cmsDetected={null}
      />
    )
  }

  const crawlData = diagnosis.crawl_data as CrawlData | null
  const isPaid = diagnosis.tier === 'paid'
  const cmsDetected = crawlData?.cms?.detected ?? null

  return (
    <MetaTagContent
      crawlData={crawlData}
      url={diagnosis.url}
      isPaid={isPaid}
      cmsDetected={cmsDetected}
    />
  )
}
