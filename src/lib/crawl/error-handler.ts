/**
 * Crawl error handling and classification
 * Classifies crawl errors, extracts details, and provides recovery strategies
 */

import type { CrawlStatus } from '@/types/crawl';

/**
 * 에러 상세 정보
 */
export interface ErrorDetails {
  code: string;
  message: string;
}

/**
 * 복구 전략
 */
export interface RecoveryStrategy {
  action: 'retry' | 'fail' | 'defer';
  maxAttempts?: number;
  backoffDelays?: number[];
  recommendation: string;
  debugInfo: ErrorDetails;
}

/**
 * 에러 객체인지 확인합니다.
 * null/undefined 또는 완전히 비어있는 객체는 false를 반환합니다.
 *
 * @param error - 확인할 에러
 * @returns 에러 객체 여부
 */
export function isCrawlError(error: unknown): boolean {
  if (error === null || error === undefined) {
    return false;
  }

  if (error instanceof Error) {
    return true;
  }

  if (typeof error === 'string' && error.length > 0) {
    return true;
  }

  if (typeof error === 'object' && 'message' in error) {
    return true;
  }

  return false;
}

/**
 * 크롤 에러를 분류합니다.
 *
 * 분류:
 * - failed_timeout: 300초 초과 타임아웃
 * - failed_network: 네트워크 관련 에러 (ECONNREFUSED, ENOTFOUND, ETIMEDOUT 등)
 * - failed_invalid_url: URL 형식 오류
 *
 * @param error - 분류할 에러
 * @returns 크롤 상태
 */
export function classifyCrawlError(error: unknown): CrawlStatus {
  const message = extractErrorMessage(error);

  // 타임아웃 감지
  if (
    message.includes('timeout') ||
    message.includes('Timeout') ||
    message.includes('TIMEOUT')
  ) {
    return 'failed_timeout';
  }

  // URL 오류 감지
  if (
    message.includes('Invalid URL') ||
    message.includes('URL parse') ||
    message.includes('malformed')
  ) {
    return 'failed_invalid_url';
  }

  // 네트워크 에러 감지 (대소문자 구분 안 함, 정확한 매칭)
  const networkErrorPatterns = [
    /^ECONNREFUSED/,
    /^ENOTFOUND/,
    /^EHOSTUNREACH/,
    /^ETIMEDOUT/,
    /^ECONNRESET/,
    /Connection refused/i,
    /Connection timed out/i,
    /No route to host/i,
    /^Network/i,
  ];

  if (networkErrorPatterns.some((pattern) => pattern.test(message))) {
    return 'failed_network';
  }

  // 기본값: 네트워크 에러
  return 'failed_network';
}

/**
 * 에러 객체에서 메시지를 추출합니다.
 *
 * @param error - 에러 객체
 * @returns 에러 메시지 문자열
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const msg = (error as { message: unknown }).message;
    if (typeof msg === 'string') {
      return msg;
    }
  }

  return '';
}

/**
 * 에러에서 코드와 메시지를 추출합니다.
 *
 * 코드 인식:
 * - ECONNREFUSED, ENOTFOUND, EHOSTUNREACH, ETIMEDOUT 등 (Node.js 에러)
 * - TIMEOUT (타임아웃 에러)
 * - UNKNOWN (인식되지 않은 에러)
 *
 * @param error - 분석할 에러
 * @returns 에러 코드와 메시지
 */
export function extractErrorDetails(error: unknown): ErrorDetails {
  const message = extractErrorMessage(error);

  // 알려진 에러 코드 패턴 확인
  const codePatterns = [
    { pattern: /^(E[A-Z]+)/, code: (m: string[]) => m[1] },
    { pattern: /timeout|Timeout|TIMEOUT/, code: () => 'TIMEOUT' },
    { pattern: /(ECONNREFUSED|ENOTFOUND|EHOSTUNREACH|ETIMEDOUT)/, code: (m: string[]) => m[1] },
  ];

  for (const { pattern, code } of codePatterns) {
    const match = message.match(pattern);
    if (match) {
      return {
        code: code(match),
        message,
      };
    }
  }

  return {
    code: 'UNKNOWN',
    message: message || 'Unknown error',
  };
}

/**
 * 에러를 재시도할 수 있는지 판단합니다.
 *
 * 재시도 가능:
 * - 네트워크 에러 (ECONNREFUSED, ENOTFOUND 등)
 * - 타임아웃 (Timeout 포함)
 *
 * 재시도 불가:
 * - URL 형식 오류
 * - 할당량 초과
 * - 기타 에러
 *
 * @param error - 판단할 에러
 * @returns 재시도 여부
 */
export function shouldRetryError(error: unknown): boolean {
  const message = extractErrorMessage(error);

  // URL 오류는 재시도 불가
  if (
    message.includes('Invalid URL') ||
    message.includes('URL parse') ||
    message.includes('malformed')
  ) {
    return false;
  }

  // 할당량 초과는 재시도 불가 (defer 전략 사용)
  if (
    message.toLowerCase().includes('quota') ||
    message.toLowerCase().includes('rate limit')
  ) {
    return false;
  }

  // 타임아웃 감지
  if (
    message.includes('timeout') ||
    message.includes('Timeout') ||
    message.includes('TIMEOUT')
  ) {
    return true;
  }

  // 네트워크 에러 감지 (명시적 패턴 매칭)
  const networkErrorPatterns = [
    /^ECONNREFUSED/,
    /^ENOTFOUND/,
    /^EHOSTUNREACH/,
    /^ETIMEDOUT/,
    /^ECONNRESET/,
    /Connection refused/i,
    /Connection timed out/i,
    /No route to host/i,
  ];

  return networkErrorPatterns.some((pattern) => pattern.test(message));
}

/**
 * 에러에 대한 복구 전략을 반환합니다.
 *
 * 전략:
 * - retry: 지수 백오프로 재시도
 * - fail: 실패로 표시하고 사용자에게 알림
 * - defer: 나중에 재시도 (예: API 할당량 초과)
 *
 * @param error - 분석할 에러
 * @returns 복구 전략
 */
export function getErrorRecoveryStrategy(error: unknown): RecoveryStrategy {
  const details = extractErrorDetails(error);
  const message = extractErrorMessage(error).toLowerCase();

  // API 할당량 초과 감지 (모든 상태 전에 먼저 확인)
  if (message.includes('quota') || message.includes('rate limit')) {
    return {
      action: 'defer',
      recommendation:
        'API 할당량이 초과되었습니다. 몇 분 후 다시 시도하세요.',
      debugInfo: details,
    };
  }

  const status = classifyCrawlError(error);

  switch (status) {
    case 'failed_timeout':
      return {
        action: 'retry',
        maxAttempts: 3,
        backoffDelays: [10000, 30000, 60000],
        recommendation:
          '웹사이트 응답이 매우 느립니다. 몇 초 후 다시 시도하겠습니다.',
        debugInfo: details,
      };

    case 'failed_network':
      return {
        action: 'retry',
        maxAttempts: 3,
        backoffDelays: [10000, 30000, 60000],
        recommendation:
          '네트워크 연결이 일시적으로 끊겼습니다. 다시 시도하겠습니다.',
        debugInfo: details,
      };

    case 'failed_invalid_url':
      return {
        action: 'fail',
        recommendation:
          '올바른 URL 형식인지 확인하세요. 예: https://example.com',
        debugInfo: details,
      };

    default:
      return {
        action: 'retry',
        maxAttempts: 3,
        backoffDelays: [10000, 30000, 60000],
        recommendation: '일시적인 오류입니다. 다시 시도하겠습니다.',
        debugInfo: details,
      };
  }
}
