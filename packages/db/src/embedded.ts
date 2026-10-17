import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "./schema";

export type EmbeddedDbOptions = {
  dataDir?: string;
  inMemory?: boolean;
};

let defaultEmbeddedClient: PGlite | null = null;
let migrationPromise: Promise<void> | null = null;

export function getMigrationsFolder(): string {
  const currentDir =
    typeof import.meta.url === "string" ? dirname(fileURLToPath(import.meta.url)) : "";
  const candidates = [
    resolve(process.cwd(), "packages/db/src/migrations"),
    resolve(process.cwd(), "../../packages/db/src/migrations"),
    ...(currentDir
      ? [resolve(currentDir, "migrations"), resolve(currentDir, "../migrations")]
      : []),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0]!;
}

export function createPGliteClient(options?: EmbeddedDbOptions): PGlite {
  if (options?.inMemory) {
    return new PGlite();
  }

  // Default path for embedded local database
  const defaultDir = resolve(process.cwd(), "data", "selvam.db");
  const dataDir = options?.dataDir || process.env.PGLITE_DATA_DIR || defaultDir;

  const parentDir = dirname(dataDir);
  if (!existsSync(parentDir)) {
    mkdirSync(parentDir, { recursive: true });
  }

  return new PGlite(dataDir);
}

export const SOVEREIGN_DEFAULT_USER = {
  id: "sovereign-user",
  name: "Aranga",
  email: "owner@selvam.local",
  emailVerified: true,
} as const;

export function getDefaultEmbeddedClient(options?: EmbeddedDbOptions): PGlite {
  if (!defaultEmbeddedClient) {
    defaultEmbeddedClient = createPGliteClient(options);
  }
  return defaultEmbeddedClient;
}

export async function runEmbeddedMigrations(client: PGlite): Promise<void> {
  const migrationsFolder = getMigrationsFolder();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder });

  // Provision sovereign default user if in sovereign mode
  await client.exec(`
    INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
    VALUES ('${SOVEREIGN_DEFAULT_USER.id}', '${SOVEREIGN_DEFAULT_USER.name}', '${SOVEREIGN_DEFAULT_USER.email}', true, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  `);
}

export function resetDefaultEmbeddedClient() {
  defaultEmbeddedClient = null;
  migrationPromise = null;
}

export function createEmbeddedDb(options?: EmbeddedDbOptions) {
  const client = createPGliteClient(options);
  const db = drizzle(client, { schema });
  return { db, client };
}

export async function ensureSovereignReady(options?: EmbeddedDbOptions): Promise<void> {
  await getOrInitEmbeddedDb(options);
}

export async function getOrInitEmbeddedDb(options?: EmbeddedDbOptions) {
  const client = getDefaultEmbeddedClient(options);

  if (!migrationPromise) {
    migrationPromise = runEmbeddedMigrations(client);
  }
  await migrationPromise;

  return drizzle(client, { schema });
}
