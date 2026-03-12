/**
 * n8n Automation Platform Constants
 *
 * Defines webhook paths, URLs, and configuration constants for n8n integration.
 * Used by triggerCrawling action to invoke n8n workflows via HTTP webhooks.
 *
 * Environment variables required:
 * - N8N_WEBHOOK_BASE_URL: Base URL for n8n instance (e.g., https://n8n.railway.app)
 * - N8N_WEBHOOK_URL: Full webhook URL (deprecated, use webhookPath with base URL)
 */

/**
 * n8n webhook endpoint path for Findably crawling workflow
 */
export const N8N_CRAWL_WEBHOOK_PATH = '/webhook/findably-crawl' as const;

/**
 * n8n webhook endpoint path for Findably re-diagnosis workflow
 */
export const N8N_REDIAGNOSIS_WEBHOOK_PATH = '/webhook/findably-rediagnosis' as const;

/**
 * Default n8n instance port (development)
 */
export const N8N_DEFAULT_PORT = 5678 as const;

/**
 * n8n health check endpoint
 */
export const N8N_HEALTH_CHECK_PATH = '/api/v1/health' as const;

/**
 * Build complete n8n webhook URL from base URL and path
 *
 * @param baseUrl - n8n instance base URL (e.g., https://n8n.railway.app)
 * @param path - Webhook path (default: N8N_CRAWL_WEBHOOK_PATH)
 * @returns Complete webhook URL
 *
 * @example
 * const url = buildN8nWebhookUrl('https://n8n.railway.app', '/webhook/findably-crawl');
 * // Returns: https://n8n.railway.app/webhook/findably-crawl
 */
export function buildN8nWebhookUrl(
  baseUrl: string,
  path: string = N8N_CRAWL_WEBHOOK_PATH
): string {
  // Remove trailing slash from baseUrl if present
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBaseUrl}${cleanPath}`;
}

/**
 * Build complete n8n health check URL
 *
 * @param baseUrl - n8n instance base URL
 * @returns Complete health check URL
 */
export function buildN8nHealthCheckUrl(baseUrl: string): string {
  return buildN8nWebhookUrl(baseUrl, N8N_HEALTH_CHECK_PATH);
}
