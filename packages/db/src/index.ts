import postgres from "postgres";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { drizzle as drizzlePGlite } from "drizzle-orm/pglite";
import { env } from "@portfolio/env/server";
import * as schema from "./schema";
import { getDefaultEmbeddedClient, type EmbeddedDbOptions } from "./embedded";

export * from "./schema";
export * from "./embedded";

export function isSovereignMode(): boolean {
  if (process.env.SOVEREIGN_MODE === "true") return true;
  const url = process.env.DATABASE_URL || env.DATABASE_URL;
  return !url || url === "pglite" || url.startsWith("pglite://") || url.startsWith("memory://");
}

let sovereignDbInstance: ReturnType<typeof drizzlePGlite<typeof schema>> | null = null;

export type AppDatabase = ReturnType<typeof drizzlePostgres<typeof schema>>;

export function createDb(options?: { pgliteOptions?: EmbeddedDbOptions }): AppDatabase {
  if (isSovereignMode()) {
    const client = getDefaultEmbeddedClient(options?.pgliteOptions);
    return drizzlePGlite(client, { schema }) as unknown as AppDatabase;
  }

  const url = process.env.DATABASE_URL || env.DATABASE_URL;
  const client = postgres(url);
  return drizzlePostgres({ client, schema });
}

export function getDb(): AppDatabase {
  if (isSovereignMode()) {
    if (!sovereignDbInstance) {
      sovereignDbInstance = createDb({
        pgliteOptions: { dataDir: process.env.PGLITE_DATA_DIR },
      }) as any;
    }
    return sovereignDbInstance as unknown as AppDatabase;
  }
  return createDb();
}

export const db: AppDatabase = getDb();
