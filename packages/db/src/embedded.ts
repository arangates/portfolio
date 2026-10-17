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
  return fileURLToPath(new URL("./migrations", import.meta.url));
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

export async function runEmbeddedMigrations(client: PGlite): Promise<void> {
  const migrationsFolder = getMigrationsFolder();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder });
}

export function createEmbeddedDb(options?: EmbeddedDbOptions) {
  const client = createPGliteClient(options);
  const db = drizzle(client, { schema });
  return { db, client };
}

export async function getOrInitEmbeddedDb(options?: EmbeddedDbOptions) {
  if (!defaultEmbeddedClient) {
    defaultEmbeddedClient = createPGliteClient(options);
  }

  if (!migrationPromise) {
    migrationPromise = runEmbeddedMigrations(defaultEmbeddedClient);
  }
  await migrationPromise;

  return drizzle(defaultEmbeddedClient, { schema });
}
