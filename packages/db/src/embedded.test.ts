import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createEmbeddedDb, runEmbeddedMigrations } from "./embedded";
import { user } from "./schema/auth";

describe("Sovereign Embedded Database (PGlite)", () => {
  it("boots in-memory, auto-migrates all 70 tables, and performs Drizzle CRUD", async () => {
    const { db, client } = createEmbeddedDb({ inMemory: true });

    // Verify raw client responds
    const ping = await client.query<{ ok: number }>("SELECT 1 as ok");
    assert.equal(ping.rows[0]?.ok, 1);

    // Run migrations
    await runEmbeddedMigrations(client);

    // Verify all 70 tables exist
    const tables = await client.query<{ count: number }>(
      "SELECT count(*)::int as count FROM information_schema.tables WHERE table_schema = $1",
      ["public"],
    );
    assert.equal(tables.rows[0]?.count, 70);

    // Perform a Drizzle typed insert into the user table
    const testId = "user_sovereign_test_01";
    await db.insert(user).values({
      id: testId,
      name: "Sovereign User",
      email: "sovereign@example.local",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Query back via Drizzle
    const users = await db.select().from(user);
    assert.ok(users.some((u) => u.id === testId));
    assert.ok(users.some((u) => u.id === "sovereign-user"));

    await client.close();
  });

  it("persists records to disk directory across reboots", async () => {
    const tempDir = mkdtempSync(join(tmpdir(), "selvam-db-test-"));
    const dataDir = join(tempDir, "test.db");

    try {
      // Session 1: Create DB on disk, run migrations, insert record
      const session1 = createEmbeddedDb({ dataDir });
      await runEmbeddedMigrations(session1.client);

      const persistentId = "user_persistent_01";
      await session1.db.insert(user).values({
        id: persistentId,
        name: "Persistent Sovereign User",
        email: "persistent@example.local",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await session1.client.close();

      // Session 2: Reopen the DB from the exact same disk directory
      const session2 = createEmbeddedDb({ dataDir });
      const persistedUsers = await session2.db.select().from(user);

      assert.ok(persistedUsers.some((u) => u.id === persistentId));
      assert.ok(persistedUsers.some((u) => u.id === "sovereign-user"));

      await session2.client.close();
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
