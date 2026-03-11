/**
 * Exponential backoff retry utility
 * Implements retry logic with configurable delays for failed operations
 */

/**
 * 기본 재시도 지연 시간 (밀리초)
 * - 첫 번째 재시도: 10초
 * - 두 번째 재시도: 30초
 * - 세 번째 재시도: 60초
 */
const DEFAULT_BACKOFF_DELAYS = [10000, 30000, 60000];

/**
 * 재시도 옵션
 */
export interface RetryOptions {
  /** 커스텀 지연 시간 배열 (밀리초) */
  delays?: number[];
}

/**
 * 기본 재시도 지연 시간을 반환합니다.
 * 커스텀 지연 시간이 제공되면 그것을 반환합니다.
 *
 * @param customDelays - 선택사항: 커스텀 지연 시간 배열
 * @returns 재시도 지연 시간 배열 (밀리초)
 */
export function getRetryDelays(customDelays?: number[]): number[] {
  return customDelays || DEFAULT_BACKOFF_DELAYS;
}

/**
 * 주어진 시도 번호에 따른 지연 시간을 계산합니다.
 *
 * @param attemptNumber - 시도 번호 (1부터 시작)
 * @param delays - 지연 시간 배열
 * @returns 지연 시간 (밀리초)
 *
 * @example
 * calculateBackoffDelay(1, [10000, 30000, 60000]) // 10000
 * calculateBackoffDelay(2, [10000, 30000, 60000]) // 30000
 * calculateBackoffDelay(5, [10000, 30000, 60000]) // 60000 (마지막 값)
 */
export function calculateBackoffDelay(
  attemptNumber: number,
  delays: number[]
): number {
  if (attemptNumber <= 0) {
    return 0;
  }

  // 배열 인덱스는 0부터 시작하므로 attemptNumber - 1
  const index = attemptNumber - 1;

  // 인덱스가 배열 범위를 벗어나면 마지막 요소 반환
  return delays[Math.min(index, delays.length - 1)];
}

/**
 * 비동기 함수를 지수 백오프 재시도 로직과 함께 실행합니다.
 *
 * 작동 방식:
 * 1. 함수를 처음 시도
 * 2. 실패하면, 지정된 지연 후 재시도
 * 3. 최대 3회 재시도 (총 4회 시도)
 * 4. 모든 재시도가 실패하면 마지막 에러 throw
 *
 * @param fn - 실행할 비동기 함수
 * @param options - 재시도 옵션 (지연 시간 커스터마이징 가능)
 * @returns 함수의 반환값
 * @throws 모든 재시도 후 실패하면 마지막 에러 throw
 *
 * @example
 * ```ts
 * const result = await exponentialBackoffRetry(async () => {
 *   const response = await fetch('https://example.com');
 *   return response.json();
 * });
 * ```
 *
 * @example
 * ```ts
 * // 커스텀 지연 시간 사용
 * const result = await exponentialBackoffRetry(async () => {
 *   return await someAsyncOperation();
 * }, {
 *   delays: [5000, 10000, 15000]
 * });
 * ```
 */
export async function exponentialBackoffRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const delays = getRetryDelays(options.delays);
  const maxRetries = delays.length;

  let lastError: unknown;

  for (let attemptNumber = 1; attemptNumber <= maxRetries + 1; attemptNumber++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // 마지막 시도라면 에러 throw
      if (attemptNumber > maxRetries) {
        throw error;
      }

      // 지정된 지연 후 재시도
      const delay = calculateBackoffDelay(attemptNumber, delays);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // 이 코드는 실제로 도달할 수 없지만 타입 체커를 위해 필요
  throw lastError;
}
