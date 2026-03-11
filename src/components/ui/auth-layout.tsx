import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

/**
 * Auth Layout Component
 * Minimal wrapper for authentication pages (signup, login)
 * Provides centered form container with header and background styling
 */
export function AuthLayout({
  children,
  title = 'Findably',
  subtitle = 'URL을 분석하여 마케팅을 자동화하세요',
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      {/* Background dot pattern and blob */}
      <style>{`
        body {
          background: #fafbfc;
          background-image: radial-gradient(
            circle,
            #dde0e4 0.5px,
            transparent 0.5px
          );
          background-size: 22px 22px;
        }
      `}</style>

      {/* Decorative blob - brand color at 5% opacity */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-5 pointer-events-none"
          style={{ backgroundColor: '#2b7cff' }}
        />
      </div>

      {/* Content container */}
      <div className="relative w-full max-w-md z-10">
        {/* Header with logo and title */}
        <div className="text-center mb-8">
          {/* Logo */}
          <Link href="/" className="inline-block mb-4">
            <div
              className="text-3xl font-bold"
              style={{
                color: '#2b7cff',
                fontFamily: 'DM Sans, sans-serif',
                letterSpacing: '-0.02em',
              }}
            >
              Findably
            </div>
          </Link>

          {/* Title */}
          <h1
            className="text-3xl font-bold text-gray-900 mb-2"
            style={{ letterSpacing: '-0.02em' }}
          >
            {title}
          </h1>

          {/* Subtitle */}
          <p className="text-gray-600 text-sm">{subtitle}</p>
        </div>

        {/* Form card with shadow and border */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          {/* 2-layer shadow for depth */}
          <style>{`
            .auth-card {
              box-shadow:
                0 2px 8px rgba(0,0,0,0.04),
                0 4px 16px rgba(0,0,0,0.06);
            }
          `}</style>
          <div className="auth-card rounded-2xl">{children}</div>
        </div>

        {/* Footer text - typically for terms/privacy */}
        <div className="mt-6 text-center text-xs text-gray-600">
          <p>
            이 서비스를 이용하면{' '}
            <Link href="/terms" className="text-blue-600 hover:text-blue-700 font-medium">
              이용약관
            </Link>
            과{' '}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-700 font-medium">
              개인정보처리방침
            </Link>
            에 동의하는 것입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
