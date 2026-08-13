import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config({ path: "../../apps/web/.env", quiet: true });

const confirmationPhrase = "RESET_ALL_APPLICATION_DATA";
const args = process.argv.slice(2);
const execute = args.includes("--execute");
const confirmation = args.find((arg) => arg.startsWith("--confirm="))?.slice("--confirm=".length);
const expectedHost = args
  .find((arg) => arg.startsWith("--expect-host="))
  ?.slice("--expect-host=".length);
const connectionString = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Set DATABASE_URL_DIRECT or DATABASE_URL before running the reset command.");
}

const connection = new URL(connectionString);
const sql = neon(connectionString);

function quoteIdentifier(identifier) {
  if (!/^[a-z_][a-z0-9_]*$/.test(identifier)) {
    throw new Error(`Unsafe database identifier: ${identifier}`);
  }
  return `"${identifier}"`;
}

async function applicationTables() {
  const rows = await sql`
    select table_name as name
    from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name
  `;
  return rows.map((row) => row.name);
}

async function tableCounts(tables) {
  const counts = {};
  for (const table of tables) {
    const [row] = await sql.query(
      `select count(*)::int as count from public.${quoteIdentifier(table)}`,
      [],
    );
    counts[table] = row.count;
  }
  return counts;
}

async function migrationCount() {
  const [row] = await sql`
    select count(*)::int as count from drizzle.__drizzle_migrations
  `;
  return row.count;
}

const [identity] = await sql`
  select current_database() as database, current_schema() as schema
`;
const tables = await applicationTables();
const before = await tableCounts(tables);
const migrationsBefore = await migrationCount();
const target = {
  host: connection.hostname,
  database: identity.database,
  schema: identity.schema,
};

console.log(
  JSON.stringify(
    {
      mode: execute ? "execute" : "dry-run",
      target,
      appliedMigrations: migrationsBefore,
      tables: tables.length,
      nonEmptyTables: Object.fromEntries(Object.entries(before).filter(([, count]) => count > 0)),
      totalRows: Object.values(before).reduce((sum, count) => sum + count, 0),
    },
    null,
    2,
  ),
);

if (!execute) {
  console.log(
    `Dry run only. To erase this database, pass --execute, --confirm=${confirmationPhrase}, and --expect-host=${connection.hostname}.`,
  );
  process.exit(0);
}

if (confirmation !== confirmationPhrase) {
  throw new Error(`Refusing reset: --confirm must equal ${confirmationPhrase}.`);
}
if (!expectedHost || expectedHost !== connection.hostname) {
  throw new Error(`Refusing reset: --expect-host must equal ${connection.hostname}.`);
}
if (tables.length === 0) {
  throw new Error("Refusing reset: no public application tables were found.");
}

const targets = tables.map((table) => `public.${quoteIdentifier(table)}`).join(", ");
await sql.query(`truncate table ${targets} restart identity cascade`, []);

const after = await tableCounts(tables);
const remaining = Object.fromEntries(Object.entries(after).filter(([, count]) => count > 0));
const migrationsAfter = await migrationCount();
const verified = Object.keys(remaining).length === 0 && migrationsAfter === migrationsBefore;

console.log(
  JSON.stringify(
    {
      verified,
      remaining,
      totalRows: Object.values(after).reduce((sum, count) => sum + count, 0),
      appliedMigrations: migrationsAfter,
    },
    null,
    2,
  ),
);

if (!verified) {
  throw new Error("Database reset verification failed.");
}
