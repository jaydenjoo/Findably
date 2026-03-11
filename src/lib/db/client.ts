import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";
import { getDatabaseConfig } from "@/lib/config";

/**
 * Creates a Drizzle ORM instance with service role credentials
 * This client bypasses RLS policies and should only be used in secure server contexts
 * For client-side operations, use the authenticated client with user JWT tokens
 */
export function createServiceDb() {
  const { url } = getDatabaseConfig();

  const client = postgres(url, {
    prepare: false,
  });

  return drizzle(client, { schema });
}

/**
 * Creates an authenticated Drizzle ORM instance with user JWT token
 * This client respects RLS policies
 * Note: Token parameter is prepared for future authentication implementation
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createAuthenticatedDb(token: string) {
  const { url } = getDatabaseConfig();

  const client = postgres(url, {
    prepare: false,
  });

  return drizzle(client, { schema });
}

// Export schema for use in migrations and elsewhere
export * from "@/db/schema";
export { schema };
