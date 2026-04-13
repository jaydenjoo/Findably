/**
 * 카나리 자가진단 기대값
 *
 * findably.kr을 정기 진단하여, 아래 항목이 passed가 아니면 오진 의심 → 알림.
 * 새 SEO 기능을 추가하면 여기에도 기대값을 추가해야 합니다.
 */

/** 카나리 대상 URL */
export const CANARY_URL = 'https://findably.kr/'

/** 반드시 passed여야 하는 룰 ID + 설명 */
export const CANARY_EXPECTED_RULES: {
  ruleId: string
  name: string
  /** skipped는 허용하는가? (SSL Labs 등 외부 의존성이 있는 경우) */
  allowSkipped: boolean
}[] = [
  {
    ruleId: 'tech-01',
    name: 'H1 태그 존재',
    allowSkipped: false,
  },
  {
    ruleId: 'tech-04',
    name: '대표 URL (Canonical) 설정',
    allowSkipped: false,
  },
  {
    ruleId: 'soc-01',
    name: 'OG Title 존재',
    allowSkipped: false,
  },
  {
    ruleId: 'soc-03',
    name: 'OG Image 존재',
    allowSkipped: false,
  },
  {
    ruleId: 'cont-07',
    name: 'Schema Markup 존재',
    allowSkipped: false,
  },
  {
    ruleId: 'cont-08',
    name: '내부 링크 존재',
    allowSkipped: false,
  },
  {
    ruleId: 'sec-03',
    name: 'SSL 인증서 유효',
    allowSkipped: true, // SSL Labs 폴링 실패 시 skipped 허용
  },
]

/** 알림 수신 이메일 */
export const CANARY_ALERT_EMAIL = 'hidream72@gmail.com'
