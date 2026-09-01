import assert from "node:assert/strict";
import test from "node:test";

import {
  annualizeReturn,
  calculateAverageCostPosition,
  calculateModifiedDietz,
  calculateXirr,
  chainReturns,
  xnpv,
} from "./verified-returns-calculations";

test("calculates a conventional annual XIRR", () => {
  const flows = [
    { date: "2025-01-01T00:00:00Z", amount: -1_000 },
    { date: "2026-01-01T00:00:00Z", amount: 1_100 },
  ];
  const result = calculateXirr(flows);
  assert.equal(result.status, "ok");
  assert.ok(Math.abs((result.rate ?? 0) - 0.1) < 0.0001);
  assert.ok(Math.abs(xnpv(result.rate!, flows)) < 0.0001);
});

test("does not hide multiple valid XIRR roots", () => {
  const result = calculateXirr([
    { date: "2024-01-01T00:00:00Z", amount: -100 },
    { date: "2025-01-01T00:00:00Z", amount: 230 },
    { date: "2026-01-01T00:00:00Z", amount: -132 },
  ]);
  assert.equal(result.status, "ambiguous");
  assert.equal(result.roots.length, 2);
  // Actual/365.2425 day counts move the textbook annual roots slightly.
  assert.ok(Math.abs(result.roots[0]! - 0.1) < 0.01);
  assert.ok(Math.abs(result.roots[1]! - 0.2) < 0.01);
});

test("tracks average-cost realized and remaining value", () => {
  const result = calculateAverageCostPosition([
    { quantity: 10, cashAmount: 1_000 },
    { quantity: 10, cashAmount: 2_000 },
    { quantity: -5, cashAmount: 900 },
  ]);
  assert.equal(result.complete, true);
  assert.equal(result.quantity, 15);
  assert.equal(result.costBasis, 2_250);
  assert.equal(result.realizedPnl, 150);
});

test("flags a sell before imported opening units", () => {
  const result = calculateAverageCostPosition([{ quantity: -5, cashAmount: 500 }]);
  assert.equal(result.complete, false);
});

test("calculates and chain-links Modified Dietz intervals", () => {
  const first = calculateModifiedDietz({
    startDate: "2025-01-01T00:00:00Z",
    endDate: "2026-01-01T00:00:00Z",
    startValue: 100,
    endValue: 120,
    flows: [{ date: "2025-07-02T00:00:00Z", amount: 10 }],
  });
  assert.ok(first !== null && Math.abs(first - 10 / 105) < 0.0002);
  const linked = chainReturns([first!, 0.1]);
  assert.ok(linked !== null && Math.abs(linked - 0.20476) < 0.001);
  const annualized = annualizeReturn(linked!, "2025-01-01", "2027-01-01");
  assert.ok(annualized !== null && annualized > 0.09 && annualized < 0.1);
});
