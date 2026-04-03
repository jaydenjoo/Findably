import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Zap,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
}

export interface DashboardNavItem {
  label: string
  href: string
  icon: LucideIcon
  locked?: boolean
}

export const PUBLIC_NAV_ITEMS: NavItem[] = [
  { label: '기능', href: '/#features' },
  { label: '요금제', href: '/pricing' },
  { label: '샘플 리포트', href: '/reports/sample' },
]

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { label: '대시보드', href: '/dashboard', icon: LayoutDashboard },
  { label: '진단 결과', href: '/diagnosis/overview', icon: ClipboardList },
  { label: '리포트', href: '/reports/my', icon: FileText },
  { label: '실행 도구', href: '/actions/schema', icon: Zap, locked: true },
  { label: '설정', href: '/settings/profile', icon: Settings },
]

/** pathname 기반 사이드바/헤더 active 판별 */
export function isNavActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname.startsWith(href.split('/').slice(0, 2).join('/'))
}

export const PAGE_TITLES: Record<string, string> = {
  '/dashboard': '대시보드',
  '/diagnosis/overview': '진단 결과',
  '/diagnosis/seo': 'SEO 상세',
  '/diagnosis/geo': 'GEO 상세',
  '/diagnosis/content': '콘텐츠 상세',
  '/reports/my': '내 리포트',
  '/reports/sample': '샘플 리포트',
  '/actions/schema': 'Schema Markup',
  '/actions/meta-tags': '메타태그 최적화',
  '/actions/roadmap': '90일 실행 계획',
  '/settings/profile': '프로필 설정',
  '/settings/billing': '결제 내역',
  '/onboarding/url': 'URL 입력',
  '/onboarding/info': '추가 정보',
  '/onboarding/analyzing': '분석 중',
}

/** 동적 경로([id] 등) 포함 pathname → 타이틀 매칭 */
export function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  // /reports/my/[id] → '상세 리포트'
  if (pathname.startsWith('/reports/my/')) return '상세 리포트'
  return ''
}
