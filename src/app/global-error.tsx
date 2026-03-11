'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';

/**
 * Next.js 15 Global Error Boundary
 * 캐치되지 않은 에러를 Sentry에 보고하고 사용자에게 에러 페이지를 표시합니다.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactNode {
  useEffect(() => {
    // 에러를 Sentry에 전송합니다
    Sentry.captureException(error, {
      contexts: {
        error_boundary: {
          digest: error.digest,
        },
      },
    });
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#fafbfc] to-white px-4">
          <div className="text-center max-w-md">
            {/* 에러 아이콘 */}
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>

            {/* 제목과 설명 */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              문제가 발생했습니다
            </h1>
            <p className="text-gray-600 mb-6">
              예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요. 계속되면
              지원팀에 문의해주세요.
            </p>

            {/* 개발 환경에서 에러 메시지 표시 */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-red-50 border border-red-200 rounded p-4 mb-6 text-left">
                <p className="text-sm font-mono text-red-700">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-red-600 mt-2">
                    Digest: {error.digest}
                  </p>
                )}
              </div>
            )}

            {/* 액션 버튼 */}
            <button
              onClick={reset}
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              다시 시도
            </button>

            {/* 홈으로 가기 링크 */}
            <p className="text-sm text-gray-600 mt-4">
              또는{' '}
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                홈으로 돌아가기
              </Link>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
