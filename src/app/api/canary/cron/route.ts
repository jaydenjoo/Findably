import { CANARY_ALERT_EMAIL, CANARY_URL } from '@/config/canary'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://findably.kr'

/**
 * GET /api/canary/cron
 *
 * Vercel Cron으로 매일 09:00 KST (00:00 UTC) 실행.
 * /api/canary를 호출하여 불일치 발견 시 이메일 알림.
 */
export async function GET(request: Request): Promise<Response> {
  // Vercel Cron 인증 (CRON_SECRET)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    // 카나리 API 호출
    const canaryResponse = await fetch(`${SITE_URL}/api/canary`, {
      headers: { 'Cache-Control': 'no-cache' },
    })

    if (!canaryResponse.ok) {
      console.error(
        '[canary/cron] 카나리 API 응답 실패:',
        canaryResponse.status
      )
      return new Response('Canary API failed', { status: 500 })
    }

    const result = (await canaryResponse.json()) as {
      success: boolean
      data?: {
        ok: boolean
        totalScore: number
        diagnosisId: string
        mismatches: { ruleId: string; name: string; actual: string }[]
      }
    }

    if (!result.success || !result.data) {
      console.error('[canary/cron] 카나리 데이터 없음')
      return new Response('No canary data', { status: 500 })
    }

    const { ok, mismatches, totalScore, diagnosisId } = result.data

    if (ok) {
      console.log(
        `[canary/cron] 정상 — ${CANARY_URL} ${totalScore}점, 불일치 0건`
      )
      return new Response('OK - no mismatches', { status: 200 })
    }

    // 불일치 발견 → 이메일 알림
    console.warn(`[canary/cron] 오진 의심! ${mismatches.length}건 불일치`)

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      console.error('[canary/cron] RESEND_API_KEY 미설정, 이메일 생략')
      return new Response('Mismatch found, email skipped', { status: 200 })
    }

    const resend = new Resend(resendKey)
    const mismatchList = mismatches
      .map((m) => `- ${m.name} (${m.ruleId}): 기대=passed, 실제=${m.actual}`)
      .join('\n')

    await resend.emails.send({
      from: 'Findably 카나리 <noreply@findably.kr>',
      to: CANARY_ALERT_EMAIL,
      subject: `[Findably 카나리] 오진 의심 ${mismatches.length}건 — ${CANARY_URL}`,
      text: `Findably 카나리 자가진단에서 불일치가 발견되었습니다.

대상: ${CANARY_URL}
진단 ID: ${diagnosisId}
종합 점수: ${totalScore}점
불일치 ${mismatches.length}건:

${mismatchList}

확인: ${SITE_URL}/admin
카나리 API: ${SITE_URL}/api/canary

이 메일은 Vercel Cron에 의해 자동 발송되었습니다.`,
    })

    console.log('[canary/cron] 알림 이메일 발송 완료')
    return new Response(`Alert sent - ${mismatches.length} mismatches`, {
      status: 200,
    })
  } catch (err) {
    console.error('[canary/cron] 실행 실패:', err)
    return new Response('Cron execution failed', { status: 500 })
  }
}
