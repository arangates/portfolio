import { test } from "node:test";
import assert from "node:assert/strict";
import {
  compareSnapshots,
  sourceFreshness,
  latestSnapshotRevisions,
  type SnapshotEvidence,
} from "./insight-calculations";
const row = (patch: Partial<SnapshotEvidence> = {}): SnapshotEvidence => ({
  key: "cash",
  name: "Cash",
  kind: "Bank",
  href: "/dashboard/inr",
  currency: "INR",
  asOf: "2026-09-01T00:00:00Z",
  createdAt: "2026-09-02T00:00:00Z",
  value: 100,
  ...patch,
});
test("latest revision compares to the previous distinct date, not the overwritten record", () => {
  const [change] = compareSnapshots([
    row({ value: 120 }),
    row({ value: 130, createdAt: "2026-09-03T00:00:00Z" }),
    row({ asOf: "2026-08-01T00:00:00Z", value: 100 }),
  ]);
  assert.equal(change?.delta, 30);
  assert.equal(change?.percent, 0.3);
});
test("unknown history, values and different currencies withhold comparisons", () => {
  assert.equal(compareSnapshots([row()])[0]?.delta, null);
  for (const patch of [{ currency: "EUR" }, { value: null }, { value: NaN }])
    assert.equal(
      compareSnapshots([row(patch), row({ asOf: "2026-08-01T00:00:00Z" })])[0]?.delta,
      null,
    );
});
test("zero starting value has an absolute change but no percentage", () => {
  const [c] = compareSnapshots([row(), row({ asOf: "2026-08-01T00:00:00Z", value: 0 })]);
  assert.equal(c?.delta, 100);
  assert.equal(c?.percent, null);
});
test("quantity, price, ownership and residual reconcile to the change", () => {
  const [c] = compareSnapshots([
    row({ value: 181, quantity: 12, price: 20, share: 0.75 }),
    row({ asOf: "2026-08-01T00:00:00Z", value: 50, quantity: 10, price: 10, share: 0.5 }),
  ]);
  assert.deepEqual(
    c?.drivers.map((d) => d.amount),
    [10, 60, 60, 1],
  );
  assert.equal(
    c?.drivers.reduce((sum, d) => sum + d.amount, 0),
    c?.delta,
  );
});
test("broker revisions do not revive removed positions or skip an absent previous holding", () => {
  const rows = [
    row({
      key: "removed",
      sourceKey: "broker",
      revisionId: "old",
      createdAt: "2026-09-01T00:00:00Z",
    }),
    row({ key: "new", sourceKey: "broker", revisionId: "new" }),
    row({ key: "new", sourceKey: "broker", revisionId: "july", asOf: "2026-07-01T00:00:00Z" }),
    row({ key: "exited", sourceKey: "broker", revisionId: "august", asOf: "2026-08-01T00:00:00Z" }),
  ];
  assert.equal(latestSnapshotRevisions(rows).length, 3);
  const result = compareSnapshots(rows);
  assert.equal(result.length, 1);
  assert.equal(result[0]?.current.key, "new");
  assert.equal(result[0]?.previous, null);
});
test("freshness handles the review boundary, missing and future dates", () => {
  const now = new Date("2026-09-01T13:00:00Z");
  assert.equal(sourceFreshness("2026-08-01", 31, now).status, "current");
  assert.equal(sourceFreshness("2026-07-31", 31, now).status, "stale");
  assert.equal(sourceFreshness("2026-09-02", 31, now).status, "future");
  assert.equal(sourceFreshness("bad", 31, now).status, "unknown");
  assert.equal(sourceFreshness(null, 31, now).status, "unknown");
});
