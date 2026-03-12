import { logRequest, type RequestLogData } from './request-logger';
import { cookies } from 'next/headers';

/**
 * LoggingOptions 인터페이스
 * 미들웨어 동작을 커스터마이징하기 위한 옵션입니다.
 */
export interface LoggingOptions {
  /**
   * 로깅에서 제외할 경로 패턴 배열
   * 예: ['/api/health', '/api/metrics']
   */
  excludePaths?: string[];

  /**
   * 로깅 제외 패턴이 정규식으로 매칭되는지 여부
   * false인 경우 정확한 문자열 매칭을 사용합니다.
   */
  useRegex?: boolean;
}

/**
 * 요청에서 User-ID를 추출합니다.
 * Supabase Auth 토큰이 있으면 그로부터 userId를 추출합니다.
 *
 * @param request - Next.js Request 객체
 * @returns userId 또는 null
 */
function extractUserId(request: Request): string | null {
  try {
    // 헤더에서 x-user-id를 확인합니다 (테스트 또는 커스텀 설정용)
    const customUserId = request.headers.get('x-user-id');
    if (customUserId) {
      return customUserId;
    }

    // Authorization 헤더에서 Supabase 토큰을 추출할 수도 있습니다.
    // 현재는 단순하게 처리합니다.
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      // 실제 구현에서는 여기서 토큰을 파싱하여 userId를 추출합니다.
      // MVP에서는 null 반환으로 처리합니다.
      return null;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * 요청에서 IP 주소를 추출합니다.
 * x-forwarded-for 헤더를 우선적으로 확인합니다 (프록시/로드밸런서).
 *
 * @param request - Next.js Request 객체
 * @returns IP 주소 문자열 또는 null
 */
function extractIp(request: Request): string | null {
  try {
    // x-forwarded-for 헤더 (프록시 뒤의 클라이언트 IP)
    const xForwardedFor = request.headers.get('x-forwarded-for');
    if (xForwardedFor) {
      // 첫 번째 IP를 반환합니다 (콤마로 구분된 여러 IP 중)
      return xForwardedFor.split(',')[0].trim();
    }

    // x-real-ip 헤더 (일부 프록시에서 사용)
    const xRealIp = request.headers.get('x-real-ip');
    if (xRealIp) {
      return xRealIp;
    }

    // cf-connecting-ip 헤더 (Cloudflare)
    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    if (cfConnectingIp) {
      return cfConnectingIp;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * 로깅 경로를 제외할지 결정합니다.
 *
 * @param path - 요청 경로
 * @param excludePaths - 제외할 경로 배열
 * @param useRegex - 정규식 매칭 여부
 * @returns true이면 제외합니다
 */
function shouldExcludePath(
  path: string,
  excludePaths: string[] | undefined,
  useRegex: boolean | undefined
): boolean {
  if (!excludePaths || excludePaths.length === 0) {
    return false;
  }

  if (useRegex) {
    return excludePaths.some((pattern) => {
      try {
        const regex = new RegExp(pattern);
        return regex.test(path);
      } catch {
        return false;
      }
    });
  }

  return excludePaths.some((excludePath) => path === excludePath);
}

/**
 * withLogging 고차 함수
 *
 * Next.js API Route 핸들러를 래핑하여 요청/응답을 자동으로 로깅합니다.
 *
 * 기능:
 * - 요청 타이밍 측정 (responseTimeMs)
 * - User-ID 추출 및 로깅
 * - IP 주소 추출 및 로깅
 * - HTTP 메서드, 경로, 상태 코드 로깅
 * - 에러 메시지 포함 (5xx 또는 특정 에러)
 * - Fire-and-forget 패턴 (로깅 실패가 응답을 차단하지 않음)
 *
 * @param handler - 래핑할 API 핸들러 함수
 * @param options - 로깅 옵션 (선택사항)
 * @returns 로깅이 추가된 핸들러 함수
 *
 * @example
 * export const GET = withLogging(
 *   async (request) => {
 *     return Response.json({ status: 'ok' });
 *   },
 *   { excludePaths: ['/api/health'] }
 * );
 */
export function withLogging(
  handler: (request: Request) => Promise<Response>,
  options: LoggingOptions = {}
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const startTime = Date.now();

    // 요청 정보 추출
    const url = new URL(request.url);
    const method = request.method as RequestLogData['method'];
    const path = url.pathname;
    const userAgent = request.headers.get('user-agent');
    const userId = extractUserId(request);
    const ip = extractIp(request);

    // 로깅 제외 경로 확인
    const shouldExclude = shouldExcludePath(path, options.excludePaths, options.useRegex);

    try {
      // 핸들러 실행
      const response = await handler(request);

      // 응답 시간 계산
      const endTime = Date.now();
      const responseTimeMs = endTime - startTime;

      // 로깅 (제외 경로 확인)
      if (!shouldExclude) {
        const logData: RequestLogData = {
          timestamp: new Date(),
          userId,
          method,
          path,
          statusCode: response.status,
          responseTimeMs,
          userAgent,
          ip,
          errorMessage: null,
        };

        // Fire-and-forget: 로깅 실패가 응답을 차단하지 않음
        logRequest(logData).catch(() => {
          // 에러는 이미 logRequest에서 처리됨
        });
      }

      return response;
    } catch (error) {
      // 응답 시간 계산
      const endTime = Date.now();
      const responseTimeMs = endTime - startTime;

      // 에러 메시지 추출
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // 로깅 (제외 경로 확인)
      if (!shouldExclude) {
        const logData: RequestLogData = {
          timestamp: new Date(),
          userId,
          method,
          path,
          statusCode: 500, // 핸들러에서 예외 발생
          responseTimeMs,
          userAgent,
          ip,
          errorMessage,
        };

        // Fire-and-forget
        logRequest(logData).catch(() => {
          // 에러는 이미 logRequest에서 처리됨
        });
      }

      // 에러를 다시 던집니다
      throw error;
    }
  };
}
