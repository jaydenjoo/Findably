import type { MetadataRoute } from 'next'
import { SEO } from '@/config/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/onboarding', '/settings', '/api'],
      },
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'ClaudeBot',
          'PerplexityBot',
          'Google-Extended',
          'anthropic-ai',
          'Claude-Web',
          'Yeti',
        ],
        allow: '/',
      },
    ],
    sitemap: `${SEO.siteUrl}/sitemap.xml`,
  }
}
