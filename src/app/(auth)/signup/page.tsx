import Link from 'next/link';
import { SignupForm } from '@/components/auth/signup-form';

/**
 * Signup Page
 * Renders the signup form with auth layout
 * Route: /signup
 */
export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      {/* Background blur effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
      </div>

      {/* Content container */}
      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ letterSpacing: '-0.02em' }}>
            Findably 시작하기
          </h1>
          <p className="text-gray-600 text-sm">
            URL을 분석하여 마케팅을 자동화하세요
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <SignupForm />
        </div>

        {/* Footer divider */}
        <div className="mt-6 text-center text-sm text-gray-600">
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
