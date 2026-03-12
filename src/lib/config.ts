import { getEnvConfig } from './env';

/**
 * Supabase service configuration
 */
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

/**
 * Database connection configuration
 */
export interface DatabaseConfig {
  url: string;
}

/**
 * Anthropic Claude API configuration
 */
export interface AnthropicConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
}

/**
 * Google PageSpeed Insights configuration
 */
export interface PageSpeedConfig {
  apiKey: string;
  baseUrl: string;
}

/**
 * n8n automation platform configuration
 */
export interface N8nConfig {
  webhookBaseUrl: string;
  apiKey: string;
  crawlWebhookPath: string;
}

/**
 * Sentry error tracking configuration
 */
export interface SentryConfig {
  dsn?: string;
  environment: 'development' | 'production';
  tracesSampleRate: number;
}

/**
 * Application configuration
 */
export interface AppConfig {
  url?: string;
  environment: 'development' | 'production';
}

/**
 * Complete application configuration
 * Combines all service configs into a single typed object
 */
export interface Config {
  supabase: SupabaseConfig;
  database: DatabaseConfig;
  anthropic: AnthropicConfig;
  pageSpeed: PageSpeedConfig;
  n8n: N8nConfig;
  sentry: SentryConfig;
  app: AppConfig;
}

/**
 * Singleton config instance to prevent repeated validation
 */
let cachedConfig: Config | undefined;

/**
 * Returns complete application configuration
 * Validates all environment variables on first access
 * Subsequent calls return cached instance for performance
 */
export function getConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  const env = getEnvConfig();

  const isProduction =
    process.env.NODE_ENV === 'production';

  cachedConfig = {
    supabase: {
      url: env.supabase.url,
      anonKey: env.supabase.anonKey,
      serviceRoleKey: env.supabase.serviceRoleKey,
    },
    database: {
      url: env.database.url,
    },
    anthropic: {
      apiKey: env.anthropic.apiKey,
      model: env.anthropic.model,
      maxTokens: 2048,
    },
    pageSpeed: {
      apiKey: env.pageSpeed.apiKey,
      baseUrl:
        'https://www.googleapis.com/pagespeedonline/v5/runPagespeed',
    },
    n8n: {
      webhookBaseUrl: env.n8n.webhookBaseUrl,
      apiKey: env.n8n.apiKey,
      crawlWebhookPath: '/webhook/findably-crawl',
    },
    sentry: {
      dsn: env.sentry.dsn,
      environment: isProduction ? 'production' : 'development',
      tracesSampleRate: isProduction ? 0.1 : 1.0,
    },
    app: {
      url: env.app.url,
      environment: isProduction ? 'production' : 'development',
    },
  };

  return cachedConfig;
}

/**
 * Individual config accessors for convenience
 */
export function getSupabaseConfig(): SupabaseConfig {
  return getConfig().supabase;
}

export function getDatabaseConfig(): DatabaseConfig {
  return getConfig().database;
}

export function getAnthropicConfig(): AnthropicConfig {
  return getConfig().anthropic;
}

export function getPageSpeedConfig(): PageSpeedConfig {
  return getConfig().pageSpeed;
}

export function getN8nConfig(): N8nConfig {
  return getConfig().n8n;
}

export function getSentryConfig(): SentryConfig {
  return getConfig().sentry;
}

export function getAppConfig(): AppConfig {
  return getConfig().app;
}
