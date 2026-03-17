import { z } from 'zod'

/**
 * crawl_data JSONB 구조 검증용 Zod 스키마
 *
 * 타입 정의(types.ts)와 1:1 대응.
 * n8n에서 콜백으로 보내는 데이터를 서버에서 검증할 때 사용.
 * (실제 검증 로직은 Task 3.10 crawl_data 저장 시 활용)
 */

const layer1Schema = z.object({
  meta: z.object({
    title: z.string().nullable(),
    description: z.string().nullable(),
    canonical: z.string().nullable(),
    charset: z.string().nullable(),
    viewport: z.string().nullable(),
    og: z.record(z.string(), z.string()),
    robots_meta: z.string().nullable(),
  }),
  headings: z.object({
    h1: z.array(z.string()),
    h2: z.array(z.string()),
    h3: z.array(z.string()),
    h4: z.array(z.string()),
    h5: z.array(z.string()),
    h6: z.array(z.string()),
  }),
  schema_markup: z.array(z.unknown()),
  links: z.object({
    internal: z.number(),
    external: z.number(),
    broken: z.array(
      z.object({
        url: z.string(),
        status: z.number(),
      })
    ),
  }),
  images: z.object({
    total: z.number(),
    without_alt: z.number(),
    large_images: z.array(
      z.object({
        src: z.string(),
        size_kb: z.number(),
      })
    ),
  }),
  page_size_bytes: z.number(),
  load_time_ms: z.number(),
  html_lang: z.string().nullable(),
})

const robotsTxtSchema = z.object({
  exists: z.boolean(),
  allows_googlebot: z.boolean(),
  ai_bots: z.record(
    z.string(),
    z.enum(['allowed', 'blocked', 'not_mentioned'])
  ),
  sitemap_urls: z.array(z.string()),
  raw: z.string().optional(),
})

const sitemapSchema = z.object({
  exists: z.boolean(),
  url_count: z.number(),
  last_modified: z.string().nullable(),
})

const llmsTxtSchema = z.object({
  exists: z.boolean(),
  content: z.string().nullable(),
})

const cmsSchema = z.object({
  detected: z.string().nullable(),
  confidence: z.number(),
  technologies: z.array(z.string()),
})

const mobileSchema = z.object({
  viewport_configured: z.boolean(),
  touch_friendly: z.boolean(),
  issues: z.array(z.string()),
})

const layer2Schema = z.object({
  pagespeed: z
    .object({
      performance_score: z.number(),
      lcp_ms: z.number(),
      fid_ms: z.number(),
      cls: z.number(),
      ttfb_ms: z.number(),
    })
    .nullable(),
  crux: z
    .object({
      lcp_ms: z.number(),
      inp_ms: z.number(),
      cls: z.number(),
      ttfb_ms: z.number(),
      fcp_ms: z.number(),
      form_factors: z
        .object({
          phone: z.number(),
          desktop: z.number(),
          tablet: z.number(),
        })
        .nullable(),
      collection_period: z.object({
        first_date: z.string(),
        last_date: z.string(),
      }),
    })
    .nullable(),
  safe_browsing: z
    .object({
      is_safe: z.boolean(),
      threats: z.array(z.string()),
    })
    .nullable(),
})

const layer3Schema = z.object({
  ssl: z
    .object({
      grade: z.string().nullable(),
      valid: z.boolean(),
      expires_at: z.string().nullable(),
      issuer: z.string().nullable(),
    })
    .nullable(),
  observatory: z
    .object({
      grade: z.string().nullable(),
      score: z.number().nullable(),
      issues: z.array(z.string()),
    })
    .nullable(),
})

/** 통합 크롤링 데이터 Zod 스키마 */
export const crawlDataSchema = z.object({
  crawled_at: z.string(),
  duration_ms: z.number(),
  is_partial: z.boolean(),
  blocked_reason: z.string().optional(),
  layer1: layer1Schema.nullable(),
  robots_txt: robotsTxtSchema.nullable(),
  sitemap: sitemapSchema.nullable(),
  llms_txt: llmsTxtSchema.nullable(),
  cms: cmsSchema.nullable(),
  mobile: mobileSchema.nullable(),
  layer2: layer2Schema.nullable(),
  layer3: layer3Schema.nullable(),
  markdownContent: z.string().nullable(),
  siteUrls: z.array(z.string()).nullable(),
  firecrawlUsed: z.boolean(),
})

export type CrawlDataInput = z.infer<typeof crawlDataSchema>
