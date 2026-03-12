import { createServiceDb } from '@/lib/db/client';
import { apiLogsTable } from '@/db/schema';
import { lt } from 'drizzle-orm';

/**
 * cleanupOldLogs 함수
 *
 * 지정된 보관 기간보다 오래된 API 로그를 데이터베이스에서 삭제합니다.
 * 기본 보관 기간은 30일입니다.
 *
 * 사용 사례:
 * - 정기적인 크론 작업 (예: 매주 한 번)
 * - 관리자 대시보드에서 수동 실행
 * - 저장소 관리 및 비용 최적화
 *
 * @param retentionDays - 보관할 일수 (기본값: 30)
 * @returns 삭제된 로그 행의 개수
 *
 * @example
 * // 기본값: 30일 이전 로그 삭제
 * const deletedCount = await cleanupOldLogs();
 *
 * @example
 * // 커스텀: 7일 이전 로그 삭제
 * const deletedCount = await cleanupOldLogs(7);
 *
 * @throws {Error} 데이터베이스 작업 실패 시
 */
export async function cleanupOldLogs(retentionDays: number = 30): Promise<number> {
  // 기준 날짜 계산: 현재 시간에서 retentionDays를 뺍니다
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  try {
    // 서비스 역할 DB 클라이언트를 생성합니다
    const db = createServiceDb();

    // timestamp가 cutoffDate보다 이전인 모든 로그를 삭제합니다
    const result = await db
      .delete(apiLogsTable)
      .where(lt(apiLogsTable.timestamp, cutoffDate));

    // result 객체에서 삭제된 행의 개수를 추출합니다
    // Drizzle의 반환 타입에 따라 다양할 수 있으므로 안전하게 처리합니다
    if (typeof result === 'object' && result !== null && 'count' in result) {
      return (result as { count: number }).count;
    }

    // 행의 개수를 정확히 알 수 없으면 0을 반환합니다
    // (실제 구현에서는 쿼리 결과를 다시 조회할 수도 있습니다)
    return 0;
  } catch (error) {
    // 데이터베이스 에러를 기록하고 다시 던집니다
    console.error('[Log Retention Error]', error instanceof Error ? error.message : error);
    throw error;
  }
}
