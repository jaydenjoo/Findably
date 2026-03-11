import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';

/**
 * Login Page
 * Renders the login form with auth layout
 * Route: /login
 */
export default function LoginPage() {
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
            다시 시작하기
          </h1>
          <p className="text-gray-600 text-sm">
            Findably에 로그인하세요
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <LoginForm />
        </div>

        {/* Footer divider */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            아직 계정이 없으신가요?{' '}
            <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
