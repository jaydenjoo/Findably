import { z } from 'zod';

/**
 * Environment variable schema with runtime validation
 * Validates at application startup to fail fast on misconfiguration
 */
const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Database
  DATABASE_URL: z
    .string()
    .url('DATABASE_URL must be a valid PostgreSQL connection URL'),

  // AI/Claude API
  ANTHROPIC_API_KEY: z.string().min(1),

  // Google PageSpeed
  GOOGLE_PAGESPEED_API_KEY: z.string().min(1),

  // n8n
  N8N_WEBHOOK_BASE_URL: z
    .string()
    .url('N8N_WEBHOOK_BASE_URL must be a valid URL'),
  N8N_API_KEY: z.string().min(1),

  // App
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('NEXT_PUBLIC_APP_URL must be a valid URL')
    .optional(),

  // Optional: Error tracking
  SENTRY_DSN: z
    .string()
    .url('SENTRY_DSN must be a valid URL')
    .optional(),
});

type EnvConfig = z.infer<typeof envSchema>;

/**
 * Cached validated environment
 * Prevents revalidation on each access
 */
let cachedEnv: EnvConfig | undefined;

/**
 * Clears the cached environment (for testing purposes)
 */
export function clearEnvCache(): void {
  cachedEnv = undefined;
}

/**
 * Validates environment variables at runtime
 * Throws immediately if required variables are missing or invalid
 */
export function validateEnv(): EnvConfig {
  if (cachedEnv) {
    return cachedEnv;
  }

  try {
    cachedEnv = envSchema.parse(process.env);
    return cachedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .map((issue) => {
          const fieldName = Array.isArray(issue.path) && issue.path.length > 0
            ? issue.path.join('.')
            : 'unknown field';
          return `${fieldName}: ${issue.message}`;
        })
        .join('\n');
      throw new Error(
        `Invalid environment variables:\n${missingVars}`
      );
    }
    throw error;
  }
}

/**
 * Throws detailed error message for missing or invalid required env vars
 */
export function throwEnvError(varName: string, message: string): never {
  throw new Error(`${varName} is required: ${message}`);
}

/**
 * Type-safe configuration object derived from validated environment
 * All values are guaranteed to be set and valid
 */
export interface TypedConfig {
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  database: {
    url: string;
  };
  anthropic: {
    apiKey: string;
  };
  pageSpeed: {
    apiKey: string;
  };
  n8n: {
    webhookBaseUrl: string;
    apiKey: string;
  };
  app: {
    url?: string;
  };
  sentry: {
    dsn?: string;
  };
}

/**
 * Returns typed configuration object for use throughout the application
 * Ensures all config values are properly validated and accessible
 */
export function getEnvConfig(): TypedConfig {
  const env = validateEnv();

  return {
    supabase: {
      url: env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    },
    database: {
      url: env.DATABASE_URL,
    },
    anthropic: {
      apiKey: env.ANTHROPIC_API_KEY,
    },
    pageSpeed: {
      apiKey: env.GOOGLE_PAGESPEED_API_KEY,
    },
    n8n: {
      webhookBaseUrl: env.N8N_WEBHOOK_BASE_URL,
      apiKey: env.N8N_API_KEY,
    },
    app: {
      url: env.NEXT_PUBLIC_APP_URL,
    },
    sentry: {
      dsn: env.SENTRY_DSN,
    },
  };
}
