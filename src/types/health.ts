/**
 * 헬스 체크 관련 타입 정의
 */

export type ServiceStatus = 'healthy' | 'degraded' | 'unhealthy';

export type ServiceName = 'database' | 'claude' | 'pagespeed' | 'n8n';

export interface ServiceHealthCheck {
  status: ServiceStatus;
  latency_ms: number;
  message?: string;
}

export interface HealthCheckResponse {
  status: ServiceStatus;
  timestamp: string;
  services: Record<ServiceName, ServiceHealthCheck>;
}
