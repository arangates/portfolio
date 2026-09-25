import { Pool } from "@neondatabase/serverless";
import { env } from "@portfolio/env/server";
import { drizzle } from "drizzle-orm/neon-serverless";

import * as schema from "./schema";

export * from "./schema";

export function createDb() {
  const client = new Pool({ connectionString: env.DATABASE_URL });
  return drizzle({ client, schema });
}

export const db = createDb();
