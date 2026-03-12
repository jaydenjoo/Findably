import { checkAllServices } from '@/lib/health/health-checker';

/**
 * GET /api/health
 *
 * 헬스 체크 엔드포인트
 * 모든 주요 서비스(데이터베이스, Claude API, PageSpeed, n8n)의 상태를 확인합니다.
 *
 * Response: 200 (healthy or degraded), 503 (unhealthy)
 */
export async function GET() {
  try {
    const healthStatus = await checkAllServices();

    // 상태에 따른 HTTP 상태 코드 결정
    const httpStatus = healthStatus.status === 'unhealthy' ? 503 : 200;

    return Response.json(healthStatus, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    // Unexpected error during health check
    const message = error instanceof Error ? error.message : 'Unknown error';

    return Response.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {},
        error: message,
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
