import { ServiceHealthCheck, ServiceStatus } from '@/types/health';
import { createServiceDb } from '@/lib/db/client';

/**
 * Health check service for monitoring external dependencies
 * Each check returns status (healthy/degraded/unhealthy) and latency
 */

const HEALTH_CHECK_TIMEOUT_MS = 5000;

interface ServiceCheckResult {
  name: string;
  status: ServiceStatus;
  latency_ms: number;
  message?: string;
}

/**
 * 데이터베이스 연결 확인
 * 간단한 SELECT 1 쿼리로 응답 시간 측정
 */
export async function checkDatabase(): Promise<ServiceCheckResult> {
  const startTime = Date.now();

  try {
    const db = createServiceDb();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

    try {
      // Execute a simple query to verify connection
      await db.execute('SELECT 1');
      clearTimeout(timeout);

      return {
        name: 'database',
        status: 'healthy',
        latency_ms: Date.now() - startTime,
      };
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  } catch (error) {
    const latency = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (latency > HEALTH_CHECK_TIMEOUT_MS) {
      return {
        name: 'database',
        status: 'unhealthy',
        latency_ms: latency,
        message: 'Database check timed out',
      };
    }

    return {
      name: 'database',
      status: 'unhealthy',
      latency_ms: latency,
      message,
    };
  }
}

/**
 * Claude API 가용성 확인
 * API 키 존재 여부만 확인 (토큰 낭비 방지)
 */
export function checkClaudeApi(): ServiceCheckResult {
  const startTime = Date.now();

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey || apiKey.trim() === '') {
      return {
        name: 'claude',
        status: 'degraded',
        latency_ms: Date.now() - startTime,
        message: 'API key not configured',
      };
    }

    return {
      name: 'claude',
      status: 'healthy',
      latency_ms: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name: 'claude',
      status: 'unhealthy',
      latency_ms: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * PageSpeed Insights API 가용성 확인
 * API 키 존재 여부만 확인
 */
export function checkPageSpeedApi(): ServiceCheckResult {
  const startTime = Date.now();

  try {
    const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;

    if (!apiKey || apiKey.trim() === '') {
      return {
        name: 'pagespeed',
        status: 'degraded',
        latency_ms: Date.now() - startTime,
        message: 'API key not configured',
      };
    }

    return {
      name: 'pagespeed',
      status: 'healthy',
      latency_ms: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name: 'pagespeed',
      status: 'unhealthy',
      latency_ms: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * n8n 웹훅 가용성 확인
 * 웹훅 URL 설정 확인 및 선택적 핑
 */
export async function checkN8n(): Promise<ServiceCheckResult> {
  const startTime = Date.now();

  try {
    const baseUrl = process.env.N8N_WEBHOOK_BASE_URL;

    if (!baseUrl || baseUrl.trim() === '') {
      return {
        name: 'n8n',
        status: 'degraded',
        latency_ms: Date.now() - startTime,
        message: 'Webhook URL not configured',
      };
    }

    // Try to ping the webhook URL with a short timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

    try {
      const response = await fetch(baseUrl, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // 405 Method Not Allowed is OK (means server is up)
      if (response.ok || response.status === 405) {
        return {
          name: 'n8n',
          status: 'healthy',
          latency_ms: Date.now() - startTime,
        };
      }

      return {
        name: 'n8n',
        status: 'degraded',
        latency_ms: Date.now() - startTime,
        message: `HTTP ${response.status}`,
      };
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  } catch (error) {
    const latency = Date.now() - startTime;

    if (latency > HEALTH_CHECK_TIMEOUT_MS) {
      return {
        name: 'n8n',
        status: 'unhealthy',
        latency_ms: latency,
        message: 'n8n check timed out',
      };
    }

    return {
      name: 'n8n',
      status: 'degraded',
      latency_ms: latency,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 모든 서비스 헬스 체크 실행
 * 병렬로 모든 서비스 확인 후 종합 상태 결정
 */
export async function checkAllServices(): Promise<{
  status: ServiceStatus;
  timestamp: string;
  services: Record<string, ServiceHealthCheck>;
}> {
  // 동기 검사
  const claudeCheck = checkClaudeApi();
  const pageSpeedCheck = checkPageSpeedApi();

  // 비동기 검사 병렬 실행
  const [databaseCheck, n8nCheck] = await Promise.all([
    checkDatabase(),
    checkN8n(),
  ]);

  const services: Record<string, ServiceHealthCheck> = {
    database: { status: databaseCheck.status, latency_ms: databaseCheck.latency_ms, ...(databaseCheck.message && { message: databaseCheck.message }) },
    claude: { status: claudeCheck.status, latency_ms: claudeCheck.latency_ms, ...(claudeCheck.message && { message: claudeCheck.message }) },
    pagespeed: { status: pageSpeedCheck.status, latency_ms: pageSpeedCheck.latency_ms, ...(pageSpeedCheck.message && { message: pageSpeedCheck.message }) },
    n8n: { status: n8nCheck.status, latency_ms: n8nCheck.latency_ms, ...(n8nCheck.message && { message: n8nCheck.message }) },
  };

  // 종합 상태 결정 로직
  const hasUnhealthy = Object.values(services).some(s => s.status === 'unhealthy');
  const hasDegraded = Object.values(services).some(s => s.status === 'degraded');

  const overallStatus: ServiceStatus = hasUnhealthy
    ? 'unhealthy'
    : hasDegraded
      ? 'degraded'
      : 'healthy';

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services,
  };
}
