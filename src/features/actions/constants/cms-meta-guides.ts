import type { CmsGuide } from '../types'

/** CMS별 메타태그 적용 가이드 */
export const CMS_META_GUIDES: Record<string, CmsGuide> = {
  WordPress: {
    cms: 'WordPress',
    displayName: 'WordPress',
    steps: [
      'WordPress 관리자 → 게시물/페이지 편집 화면을 엽니다.',
      'Yoast SEO (또는 Rank Math) 메타 박스에서 "SEO 제목"과 "메타 설명"을 수정합니다.',
      'OG 이미지는 "소셜" 탭에서 별도 설정할 수 있습니다.',
      '변경사항을 저장하고 미리보기로 확인합니다.',
    ],
    pluginRecommendation:
      'Yoast SEO 또는 Rank Math 플러그인을 사용하면 페이지별로 메타태그를 쉽게 관리할 수 있습니다.',
    codeLocation: 'SEO 플러그인 → 각 페이지 편집 화면',
  },
  Shopify: {
    cms: 'Shopify',
    displayName: 'Shopify',
    steps: [
      'Shopify 관리자 → 온라인 스토어 → 페이지(또는 상품)를 선택합니다.',
      '하단 "검색엔진 목록" 영역에서 "웹사이트 SEO 편집"을 클릭합니다.',
      '페이지 제목과 설명을 수정합니다.',
      'OG 이미지는 theme.liquid에서 직접 설정하거나 SEO 앱을 사용합니다.',
    ],
    codeLocation: '각 페이지/상품 → 검색엔진 목록',
  },
  Wix: {
    cms: 'Wix',
    displayName: 'Wix',
    steps: [
      'Wix 에디터에서 수정할 페이지를 엽니다.',
      '메뉴 → 페이지 SEO(기본) 탭을 클릭합니다.',
      '제목 태그, 메타 설명을 입력합니다.',
      'OG 이미지는 "소셜 공유" 탭에서 설정합니다.',
      '게시 버튼을 눌러 반영합니다.',
    ],
    codeLocation: '페이지 설정 → SEO(기본) 탭',
  },
  Squarespace: {
    cms: 'Squarespace',
    displayName: 'Squarespace',
    steps: [
      '수정할 페이지에서 톱니바퀴 아이콘(페이지 설정)을 클릭합니다.',
      '"SEO" 탭에서 SEO 제목과 SEO 설명을 입력합니다.',
      '"소셜 이미지" 탭에서 OG 이미지를 설정합니다.',
      '저장 후 라이브 사이트에서 확인합니다.',
    ],
    codeLocation: '페이지 설정 → SEO 탭',
  },
} as const

/** CMS 미감지 시 기본 메타태그 가이드 */
export const DEFAULT_CMS_META_GUIDE: CmsGuide = {
  cms: 'default',
  displayName: '일반 HTML',
  steps: [
    'HTML 파일의 <head> 영역을 엽니다.',
    '<meta name="title">, <meta name="description"> 태그를 추가하거나 수정합니다.',
    '<meta property="og:title">, <meta property="og:description">, <meta property="og:image"> 태그를 추가합니다.',
    '<link rel="canonical"> 태그로 대표 URL을 지정합니다.',
    '파일을 저장하고 서버에 배포한 뒤 소셜 공유 디버거로 확인합니다.',
  ],
  codeLocation: '<head> 영역',
}
