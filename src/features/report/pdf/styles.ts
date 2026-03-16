import { Font, StyleSheet } from '@react-pdf/renderer'

// ─── 폰트 등록 (Pretendard CDN) ───

const PRETENDARD_VERSION = '1.3.9'
const PRETENDARD_CDN = `https://cdn.jsdelivr.net/npm/pretendard@${PRETENDARD_VERSION}/dist/public/static`

Font.register({
  family: 'Pretendard',
  fonts: [
    { src: `${PRETENDARD_CDN}/Pretendard-Regular.otf`, fontWeight: 400 },
    { src: `${PRETENDARD_CDN}/Pretendard-SemiBold.otf`, fontWeight: 600 },
    { src: `${PRETENDARD_CDN}/Pretendard-Bold.otf`, fontWeight: 700 },
  ],
})

// 한국어 하이픈 처리 비활성화
Font.registerHyphenationCallback((word) => [word])

// ─── 색상 토큰 ───

export const colors = {
  primary500: '#3B82F6',
  primary50: '#EFF6FF',
  success50: '#F0FDF4',
  success500: '#22C55E',
  success700: '#15803D',
  warning50: '#FFFBEB',
  warning500: '#F59E0B',
  warning700: '#B45309',
  danger50: '#FEF2F2',
  danger500: '#EF4444',
  danger700: '#B91C1C',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate500: '#64748B',
  slate700: '#334155',
  slate900: '#0F172A',
  white: '#FFFFFF',
} as const

// ─── 스타일 ───

export const styles = StyleSheet.create({
  // 페이지
  page: {
    padding: 40,
    fontFamily: 'Pretendard',
    fontSize: 10,
    color: colors.slate700,
    lineHeight: 1.6,
  },

  // 타이포그래피
  h1: {
    fontSize: 22,
    fontWeight: 700,
    color: colors.slate900,
    marginBottom: 4,
  },
  h2: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.slate900,
    marginBottom: 8,
  },
  h3: {
    fontSize: 11,
    fontWeight: 600,
    color: colors.slate900,
    marginBottom: 4,
  },
  body: {
    fontSize: 10,
    color: colors.slate700,
    lineHeight: 1.6,
  },
  caption: {
    fontSize: 8,
    color: colors.slate500,
  },

  // 레이아웃
  section: {
    marginBottom: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 8,
    border: `1px solid ${colors.slate200}`,
    padding: 16,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridItem: {
    width: '48%',
  },

  // 뱃지
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 600,
  },

  // 테이블
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.slate50,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tableCell: {
    fontSize: 9,
    color: colors.slate700,
  },

  // 구분선
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
    marginVertical: 16,
  },

  // 불릿 리스트
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bullet: {
    width: 12,
    fontSize: 10,
    color: colors.slate500,
  },
  listText: {
    flex: 1,
    fontSize: 10,
    color: colors.slate700,
    lineHeight: 1.5,
  },
})
