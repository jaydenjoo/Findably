import type { CmsGuide } from '../types'

/** CMS별 Schema Markup 적용 가이드 */
export const CMS_GUIDES: Record<string, CmsGuide> = {
  WordPress: {
    cms: 'WordPress',
    displayName: 'WordPress',
    steps: [
      'WordPress 관리자 → 외모 → 테마 편집기에서 header.php를 엽니다.',
      '</head> 태그 바로 위에 아래 코드를 붙여넣습니다.',
      '저장 후 Google Rich Results Test로 검증합니다.',
    ],
    pluginRecommendation:
      '더 쉬운 방법: Yoast SEO 또는 Rank Math 플러그인을 설치하면 Schema Markup을 자동 관리할 수 있습니다.',
    codeLocation: 'header.php → </head> 위',
  },
  Shopify: {
    cms: 'Shopify',
    displayName: 'Shopify',
    steps: [
      'Shopify 관리자 → 온라인 스토어 → 테마 → 코드 편집을 클릭합니다.',
      'Layout 폴더에서 theme.liquid 파일을 엽니다.',
      '</head> 태그 바로 위에 아래 코드를 붙여넣습니다.',
      '저장 후 Google Rich Results Test로 검증합니다.',
    ],
    codeLocation: 'theme.liquid → </head> 위',
  },
  Wix: {
    cms: 'Wix',
    displayName: 'Wix',
    steps: [
      'Wix 대시보드 → 설정 → 고급 설정 → 커스텀 코드를 클릭합니다.',
      '"코드 추가" → "헤드에 코드 추가"를 선택합니다.',
      '아래 코드를 붙여넣고 "모든 페이지"에 적용합니다.',
      '저장 후 Google Rich Results Test로 검증합니다.',
    ],
    codeLocation: '설정 → 고급 → 커스텀 코드 → Head',
  },
  Squarespace: {
    cms: 'Squarespace',
    displayName: 'Squarespace',
    steps: [
      'Squarespace 설정 → 고급 → 코드 삽입을 클릭합니다.',
      '"Header" 영역에 아래 코드를 붙여넣습니다.',
      '저장 후 Google Rich Results Test로 검증합니다.',
    ],
    codeLocation: '설정 → 고급 → 코드 삽입 → Header',
  },
} as const

/** CMS 미감지 시 기본 가이드 */
export const DEFAULT_CMS_GUIDE: CmsGuide = {
  cms: 'default',
  displayName: '일반 HTML',
  steps: [
    'HTML 파일의 <head> 태그를 엽니다.',
    '</head> 태그 바로 위에 아래 <script type="application/ld+json"> 코드를 붙여넣습니다.',
    '파일을 저장하고 서버에 배포합니다.',
    'Google Rich Results Test (search.google.com/test/rich-results)로 검증합니다.',
  ],
  codeLocation: '<head> → </head> 위',
}
