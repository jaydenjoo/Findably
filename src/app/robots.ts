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
          // OpenAI
          'GPTBot',
          'ChatGPT-User',
          'OAI-SearchBot',
          // Anthropic
          'ClaudeBot',
          'anthropic-ai',
          'Claude-Web',
          // Google AI
          'Google-Extended',
          'GoogleOther',
          // Perplexity
          'PerplexityBot',
          // Meta
          'Meta-ExternalAgent',
          // Apple
          'Applebot-Extended',
          // Cohere
          'cohere-ai',
          // Common Crawl (AI 학습 데이터)
          'CCBot',
          // Naver
          'Yeti',
        ],
        allow: '/',
      },
    ],
    sitemap: `${SEO.siteUrl}/sitemap.xml`,
  }
}
