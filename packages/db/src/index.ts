import postgres from "postgres";
import { env } from "@portfolio/env/server";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "./schema";

export * from "./schema";

export function createDb() {
  const client = postgres(env.DATABASE_URL);
  return drizzle({ client, schema });
}

export const db = createDb();
