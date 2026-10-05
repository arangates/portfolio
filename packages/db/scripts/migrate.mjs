import { fileURLToPath } from "node:url";

import postgres from "postgres";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const envPath = fileURLToPath(new URL("../../../apps/web/.env", import.meta.url));
const migrationsFolder = fileURLToPath(new URL("../src/migrations", import.meta.url));
dotenv.config({ path: envPath, quiet: true });

const connectionString = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Set DATABASE_URL_DIRECT or DATABASE_URL before running migrations.");
}

const connection = new URL(connectionString);
const client = postgres(connectionString, { max: 1 });

console.log(
  JSON.stringify({
    action: "migrate",
    target: { host: connection.hostname, database: connection.pathname.slice(1) },
  }),
);

try {
  await migrate(drizzle(client), { migrationsFolder });
  console.log(JSON.stringify({ migrated: true }));
} finally {
  await client.end();
}
