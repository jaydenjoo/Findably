'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signInAction, signInWithGoogleAction } from '@/actions/auth';

/**
 * LoginForm component
 * Handles user login with email/password and OAuth
 * Implements design system with:
 * - Pretendard font for body text
 * - DM Sans for display text
 * - Proper spacing and shadow hierarchy
 * - Responsive design
 */
export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signInAction({
        email,
        password,
      });

      if (!result.success) {
        setError(result.error || '로그인에 실패했습니다');
      }
      // Success redirect handled by Server Action
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await signInWithGoogleAction();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Google 로그인에 실패했습니다';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6" noValidate>
      {/* Error message */}
      {error && (
        <div
          id="password-error"
          role="alert"
          className="p-4 rounded-lg bg-red-50 border border-red-200 flex gap-3"
          aria-live="assertive"
          aria-atomic="true"
        >
          <span className="text-xl" aria-hidden="true">
            ⚠️
          </span>
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Email field */}
      <div className="space-y-2">
        <Label
          htmlFor="email"
          className="text-sm font-semibold text-gray-700"
        >
          이메일
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          autoComplete="email"
          required
        />
      </div>

      {/* Password field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="password"
            className="text-sm font-semibold text-gray-700"
          >
            비밀번호
          </Label>
          <Link
            href="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 rounded px-1"
          >
            비밀번호 잊었나요?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors pr-10"
            autoComplete="current-password"
            required
            aria-describedby={error ? 'password-error' : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 hover:text-gray-900 text-sm font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 rounded px-1 py-1"
            aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
            aria-pressed={showPassword}
            tabIndex={0}
          >
            {showPassword ? '숨김' : '표시'}
          </button>
        </div>
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        disabled={isLoading}
        aria-busy={isLoading}
        className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 rounded-lg"
      >
        {isLoading ? '로그인 중...' : '로그인'}
      </Button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">또는</span>
        </div>
      </div>

      {/* Google OAuth button */}
      <Button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        aria-busy={isLoading}
        variant="outline"
        className="w-full py-2 px-4 border border-gray-300 bg-white text-gray-700 font-semibold rounded-lg hover:bg-gray-50 active:translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 rounded-lg"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <circle cx={12} cy={12} r={10} />
          <path d="M8 12h8M12 8v8" />
        </svg>
        Google로 로그인
      </Button>

      {/* Sign up link */}
      <p className="text-center text-sm text-gray-700">
        계정이 없으신가요?{' '}
        <Link href="/signup" className="font-semibold text-blue-600 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 rounded px-1">
          회원가입
        </Link>
      </p>
    </form>
  );
}
