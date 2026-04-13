import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Findably — AI 마케팅 진단',
    short_name: 'Findably',
    description: 'URL 하나로 SEO + GEO 통합 마케팅 진단. 60개+ 항목 자동 분석.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafbfc',
    theme_color: '#3b82f6',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
