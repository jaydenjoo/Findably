'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PasswordStrengthIndicator } from './password-strength-indicator';
import { signUpAction, signInWithGoogleAction } from '@/actions/auth';

/**
 * SignupForm component
 * Handles user registration with email/password and OAuth
 * Implements design system with:
 * - Pretendard font for body text
 * - DM Sans for display text
 * - Proper spacing and shadow hierarchy
 * - Responsive design
 */
export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signUpAction({
        email,
        password,
        confirmPassword,
        termsAccepted,
      });

      if (!result.success) {
        setError(result.error || '회원가입에 실패했습니다');
      } else {
        // Success - show confirmation message and redirect handled by server action
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
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
          id="form-error"
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
        <Label
          htmlFor="password"
          className="text-sm font-semibold text-gray-700"
        >
          비밀번호
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="최소 8글자, 대소문자, 숫자, 특수문자 포함"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors pr-10"
            autoComplete="new-password"
            required
            aria-describedby="password-requirements"
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

        {/* Password strength indicator */}
        <div id="password-requirements">
          <PasswordStrengthIndicator password={password} />
        </div>
      </div>

      {/* Confirm password field */}
      <div className="space-y-2">
        <Label
          htmlFor="confirmPassword"
          className="text-sm font-semibold text-gray-700"
        >
          비밀번호 확인
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="비밀번호 재입력"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors pr-10"
            autoComplete="new-password"
            required
            aria-describedby={error ? 'form-error' : undefined}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 hover:text-gray-900 text-sm font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 rounded px-1 py-1"
            aria-label={showConfirmPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
            aria-pressed={showConfirmPassword}
            tabIndex={0}
          >
            {showConfirmPassword ? '숨김' : '표시'}
          </button>
        </div>
      </div>

      {/* Terms checkbox */}
      <div className="flex items-start gap-3">
        <Checkbox
          id="terms"
          checked={termsAccepted}
          onCheckedChange={(checked: boolean | string) => setTermsAccepted(checked === true)}
          disabled={isLoading}
          className="mt-1"
          aria-required="true"
          aria-describedby={!termsAccepted ? 'terms-required' : undefined}
        />
        <div>
          <Label
            htmlFor="terms"
            className="text-sm text-gray-700 cursor-pointer leading-relaxed"
          >
            <span className="font-medium">
              <Link href="/terms" className="text-blue-600 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 rounded px-1">
                이용약관
              </Link>
            </span>
            과{' '}
            <span className="font-medium">
              <Link href="/privacy" className="text-blue-600 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 rounded px-1">
                개인정보처리방침
              </Link>
            </span>
            에 동의합니다
          </Label>
          {!termsAccepted && (
            <p id="terms-required" className="text-xs text-red-600 mt-1">
              이용약관과 개인정보처리방침에 동의해야 합니다
            </p>
          )}
        </div>
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        disabled={isLoading}
        aria-busy={isLoading}
        className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 rounded-lg"
      >
        {isLoading ? '가입 중...' : '회원가입'}
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
        onClick={handleGoogleSignUp}
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
        Google로 시작하기
      </Button>

      {/* Sign in link */}
      <p className="text-center text-sm text-gray-700">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 rounded px-1">
          로그인
        </Link>
      </p>
    </form>
  );
}
