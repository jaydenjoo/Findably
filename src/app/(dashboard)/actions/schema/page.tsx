import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { CrawlData } from '@/features/crawling'
import { SchemaContent } from './_components/SchemaContent'

export const metadata: Metadata = {
  title: 'Schema Markup | Findably',
  description: 'Schema Markup 코드를 자동 생성합니다.',
}

export default async function ActionsSchemaPage(): Promise<React.JSX.Element> {
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
    return <SchemaContent crawlData={null} url="" isPaid={false} />
  }

  const crawlData = diagnosis.crawl_data as CrawlData | null
  const isPaid = diagnosis.tier === 'paid'

  return (
    <SchemaContent crawlData={crawlData} url={diagnosis.url} isPaid={isPaid} />
  )
}
