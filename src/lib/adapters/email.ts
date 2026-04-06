import { Resend } from 'resend'

/** 싱글턴 — 빌드 시점 env 미설정 대비 lazy init */
let _client: Resend | null = null

function getClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY 환경변수가 설정되지 않았습니다.')
  }
  if (!_client) {
    _client = new Resend(apiKey)
  }
  return _client
}

/** 진단 완료 이메일 파라미터 */
export interface DiagnosisCompleteEmailParams {
  to: string
  score: number
  grade: string
  reportUrl: string
  siteUrl: string
}

/** 점수 → 색상 매핑 (이메일 HTML용 HEX) */
function getScoreColor(score: number): string {
  if (score >= 70) return '#22C55E'
  if (score >= 40) return '#F59E0B'
  return '#EF4444'
}

/** HTML 특수문자 이스케이프 (XSS 방어) */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** URL 프로토콜 검증 (javascript: 주입 차단) */
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

/** HTML 이메일 템플릿 생성 */
function buildEmailHtml(params: DiagnosisCompleteEmailParams): string {
  const { score, grade, reportUrl, siteUrl } = params
  const color = getScoreColor(score)
  const safeSiteUrl = escapeHtml(siteUrl)
  const safeGrade = escapeHtml(grade)
  const safeReportUrl = isSafeUrl(reportUrl) ? escapeHtml(reportUrl) : '#'

  return `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Pretendard',-apple-system,BlinkMacSystemFont,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <tr>
      <td style="padding:32px 32px 24px;text-align:center;">
        <p style="margin:0 0 8px;font-size:14px;color:#64748b;">마케팅 진단 완료</p>
        <p style="margin:0 0 4px;font-size:48px;font-weight:800;color:${color};font-family:'DM Sans',sans-serif;">${score}</p>
        <p style="margin:0;font-size:16px;font-weight:600;color:${color};">${safeGrade}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 24px;text-align:center;">
        <p style="margin:0 0 8px;font-size:14px;color:#334155;line-height:1.6;">
          <strong>${safeSiteUrl}</strong> 사이트의 마케팅 진단이 완료되었습니다.<br/>
          상세 결과를 확인하고 개선 방법을 알아보세요.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 32px;text-align:center;">
        <a href="${safeReportUrl}" style="display:inline-block;padding:14px 32px;background:#3B82F6;color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;">
          진단 결과 보기 →
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 32px;background:#f8fafc;text-align:center;">
        <p style="margin:0;font-size:12px;color:#94a3b8;">
          이 메일은 Findably 진단 요청에 따라 발송되었습니다.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * 진단 완료 이메일 발송
 *
 * 에러 시 로그만 남기고 throw 안 함 — 이메일 실패가 분석을 멈추면 안 됨.
 * 반환값: 성공 여부
 */
export async function sendDiagnosisCompleteEmail(
  params: DiagnosisCompleteEmailParams
): Promise<boolean> {
  try {
    const client = getClient()
    const html = buildEmailHtml(params)

    const { error } = await client.emails.send({
      from: 'Findably <noreply@findably.kr>',
      to: params.to,
      subject: `마케팅 진단 완료 — ${params.score}점 (${params.grade})`,
      html,
    })

    if (error) {
      console.error('[sendDiagnosisCompleteEmail] Resend API 에러:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[sendDiagnosisCompleteEmail] 이메일 발송 실패:', error)
    return false
  }
}
