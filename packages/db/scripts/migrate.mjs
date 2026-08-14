import { fileURLToPath } from "node:url";

import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import { readMigrationFiles } from "drizzle-orm/migrator";

const envPath = fileURLToPath(new URL("../../../apps/web/.env", import.meta.url));
const migrationsFolder = fileURLToPath(new URL("../src/migrations", import.meta.url));
dotenv.config({ path: envPath, quiet: true });

const connectionString = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Set DATABASE_URL_DIRECT or DATABASE_URL before running migrations.");
}

const connection = new URL(connectionString);
const sql = neon(connectionString);
const migrations = readMigrationFiles({ migrationsFolder });

console.log(
  JSON.stringify({
    action: "migrate",
    target: { host: connection.hostname, database: connection.pathname.slice(1) },
  }),
);
await sql.transaction([
  sql`create schema if not exists drizzle`,
  sql`
    create table if not exists drizzle.__drizzle_migrations (
      id serial primary key,
      hash text not null,
      created_at bigint
    )
  `,
]);

const [latest] = await sql`
  select created_at as "createdAt"
  from drizzle.__drizzle_migrations
  order by created_at desc
  limit 1
`;
const latestTimestamp = Number(latest?.createdAt ?? 0);
const pending = migrations.filter((migration) => migration.folderMillis > latestTimestamp);

for (const migration of pending) {
  const statements = migration.sql
    .map((statement) => statement.trim())
    .filter(Boolean)
    .map((statement) => sql.query(statement, []));
  statements.push(sql`
    insert into drizzle.__drizzle_migrations (hash, created_at)
    values (${migration.hash}, ${migration.folderMillis})
  `);
  await sql.transaction(statements);
}

console.log(JSON.stringify({ migrated: true, applied: pending.length }));
