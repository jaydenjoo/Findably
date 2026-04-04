import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export function GET(): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#070a13',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* 배경 장식 */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)',
        }}
      />

      {/* 로고 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px',
            fontWeight: 800,
          }}
        >
          F
        </div>
        <span
          style={{
            fontSize: '48px',
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-0.02em',
          }}
        >
          Findably
        </span>
      </div>

      {/* 메인 텍스트 */}
      <div
        style={{
          fontSize: '28px',
          fontWeight: 600,
          color: '#94a3b8',
          textAlign: 'center',
          lineHeight: 1.4,
          maxWidth: '700px',
        }}
      >
        AI 마케팅 진단 — URL 하나로 SEO + GEO 통합 분석
      </div>

      {/* 서브 텍스트 */}
      <div
        style={{
          fontSize: '18px',
          color: '#64748b',
          marginTop: '16px',
        }}
      >
        findably.kr
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    }
  )
}
