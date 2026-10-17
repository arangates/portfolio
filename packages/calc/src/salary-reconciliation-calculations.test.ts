import assert from "node:assert/strict";
import test from "node:test";

import { reconcileSalaryPayouts } from "./salary-reconciliation-calculations";

test("matches one external salary credit to each payslip and ignores unrelated credits", () => {
  const result = reconcileSalaryPayouts(
    [
      { id: "nov-slip", payPeriod: "2023-11-01", netPay: 4140.1 },
      { id: "dec-slip", payPeriod: "2023-12-01", netPay: 7528.47 },
    ],
    [
      { id: "old-employer", bookedAt: "2023-11-10", amount: 3000 },
      { id: "nov-asml", bookedAt: "2023-11-24", amount: 4140.1 },
      { id: "dec-asml", bookedAt: "2023-12-22", amount: 7528.47 },
    ],
  );
  assert.deepEqual(
    { matched: result.matched, mismatched: result.mismatched, missing: result.missing },
    { matched: 2, mismatched: 0, missing: 0 },
  );
});

test("uses credits once and distinguishes missing credits from amount mismatches", () => {
  const result = reconcileSalaryPayouts(
    [
      { id: "a", payPeriod: "2026-01-01", netPay: 5000 },
      { id: "b", payPeriod: "2026-01-01", netPay: 2500 },
      { id: "c", payPeriod: "2026-02-01", netPay: 5100 },
    ],
    [{ id: "credit", bookedAt: "2026-01-23", amount: 4999.5 }],
  );
  assert.deepEqual(
    result.rows.map((row) => row.status),
    ["amount_mismatch", "missing_credit", "missing_credit"],
  );
});
