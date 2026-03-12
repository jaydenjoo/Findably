import { createServiceDb } from '@/lib/db/client';
import { apiLogsTable } from '@/db/schema';

/**
 * RequestLogData 인터페이스
 * API 요청/응답 로깅에 필요한 모든 정보를 포함합니다.
 */
export interface RequestLogData {
  timestamp: Date;
  userId: string | null;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  path: string;
  statusCode: number;
  responseTimeMs: number;
  userAgent: string | null;
  ip: string | null;
  errorMessage: string | null;
}

/**
 * logRequest 함수
 *
 * API 요청/응답 정보를 Supabase api_logs 테이블에 저장합니다.
 * Fire-and-forget 패턴을 사용하므로 로깅 실패가 요청 응답을 차단하지 않습니다.
 *
 * @param data - 로깅할 요청/응답 데이터
 * @returns Promise<void> - 항상 resolve됩니다 (에러 발생 시에도)
 *
 * @example
 * await logRequest({
 *   timestamp: new Date(),
 *   userId: 'user-123',
 *   method: 'POST',
 *   path: '/api/diagnose',
 *   statusCode: 200,
 *   responseTimeMs: 1250,
 *   userAgent: 'Mozilla/5.0',
 *   ip: '192.168.1.1',
 *   errorMessage: null,
 * });
 */
export async function logRequest(data: RequestLogData): Promise<void> {
  try {
    // 서비스 역할 DB 클라이언트를 생성합니다
    const db = createServiceDb();

    // 데이터베이스에 로그 항목 삽입
    await db.insert(apiLogsTable).values({
      timestamp: data.timestamp,
      userId: data.userId,
      method: data.method,
      path: data.path,
      statusCode: data.statusCode,
      responseTimeMs: data.responseTimeMs,
      userAgent: data.userAgent,
      ip: data.ip,
      errorMessage: data.errorMessage,
    });
  } catch (error) {
    // 로깅 실패는 사일런트 처리합니다.
    // 콘솔에 기록하되, 요청 처리 흐름을 차단하지 않습니다.
    console.error('[LogRequest Error]', error instanceof Error ? error.message : error);
  }
}
