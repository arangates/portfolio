import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ING_MORTGAGE_OVERVIEW as terms,
  annuityPayment,
  buildMortgageModel,
  comparePayments,
  contractMonths,
  impliedAnnualRate,
  simulateScenario,
} from "./mortgage-calculations";

test("contract runs 360 monthly payments from June 2024 to May 2054", () => {
  assert.equal(contractMonths(terms), 360);
});

test("implied rate round-trips through the annuity formula", () => {
  const payment = annuityPayment(300_000, 0.04, 360);
  assert.ok(Math.abs(impliedAnnualRate(300_000, payment, 360) - 0.04) < 1e-8);
});

test("history covers June 2024 – October 2026 and balances stay consistent", () => {
  const model = buildMortgageModel({ terms });
  assert.equal(model.history.length, 29);
  assert.equal(model.history[0]!.date, "2024-06-01");
  assert.equal(model.history.at(-1)!.date, "2026-10-01");
  for (const row of model.history)
    assert.ok(Math.abs(row.opening - row.principal - row.extra - row.closing) < 1e-6);
  assert.ok(model.summary.balanceGap > 0);
});

test("baseline projection amortises to zero before the contract end", () => {
  const model = buildMortgageModel({ terms });
  assert.equal(model.baseline.rows.at(-1)!.closing, 0);
  assert.ok(model.baseline.rows[0]!.date === "2026-11-01");
  assert.ok(model.baseline.payoffDate! <= terms.endDate);
});

test("extra repayments save interest and time", () => {
  const model = buildMortgageModel({ terms });
  const result = simulateScenario(model, { extraMonthly: 200, lumpSum: 10_000 });
  assert.ok(result.interestSaved > 0);
  assert.ok(result.monthsSaved > 0);
});

test("rate reset recalculates the payment for the remaining term", () => {
  const model = buildMortgageModel({ terms });
  const result = simulateScenario(model, { rateAfterFixed: 0.06 });
  const reset = result.scenario.rows.find((row) => row.date === "2034-05-01")!;
  assert.ok(reset.payment > terms.monthlyPayment);
  assert.equal(reset.rate, 0.06);
});

test("payment comparison classifies matches, extras and gaps", () => {
  const model = buildMortgageModel({ terms });
  const rows = comparePayments(
    model.history,
    [
      { date: "2024-06-01", amount: -1870.47 },
      { date: "2024-07-01", amount: -5870.47 },
      { date: "2024-08-01", amount: -1500 },
    ],
    "2024-05-01",
  );
  assert.deepEqual(
    rows.slice(0, 4).map((row) => row.status),
    ["match", "extra", "different", "missing"],
  );
  assert.equal(comparePayments(model.history, [], null)[0]!.status, "no-data");
});
