import assert from "node:assert/strict";
import test from "node:test";

import {
  annualizedVolatility,
  maxDrawdown,
  normalizeNavSeries,
  pearsonCorrelation,
  trailingReturn,
} from "./mutual-fund-calculations";

const monthly = Array.from({ length: 61 }, (_, index) => {
  const date = new Date(Date.UTC(2021, index, 1));
  return { date: date.toISOString().slice(0, 10), nav: 100 * 1.01 ** index };
});

test("normalizes invalid and duplicate NAV observations", () => {
  assert.deepEqual(
    normalizeNavSeries([
      { date: "2024-01-02", nav: 10 },
      { date: "bad", nav: 12 },
      { date: "2024-01-02", nav: 11 },
      { date: "2024-01-01", nav: 9 },
    ]),
    [
      { date: "2024-01-01", nav: 9 },
      { date: "2024-01-02", nav: 11 },
    ],
  );
});

test("uses CAGR for multi-year trailing return", () => {
  const result = trailingReturn(monthly, { years: 5 });
  assert.ok(result !== null && Math.abs(result - (1.01 ** 12 - 1)) < 0.01);
});

test("drawdown is measured from the running peak", () => {
  assert.equal(
    maxDrawdown([
      { date: "2024-01-01", nav: 100 },
      { date: "2024-01-02", nav: 120 },
      { date: "2024-01-03", nav: 90 },
    ]),
    -0.25,
  );
});

test("correlation aligns only common return dates", () => {
  const daily = Array.from({ length: 90 }, (_, index) => {
    const date = new Date(Date.UTC(2024, 0, index + 1));
    return { date: date.toISOString().slice(0, 10), nav: 100 + index + (index % 3) };
  });
  const scaled = daily.map((point) => ({ ...point, nav: point.nav * 2 }));
  const result = pearsonCorrelation(daily, scaled);
  assert.ok(result !== null && result > 0.999);
  assert.ok(annualizedVolatility(daily) !== null);
});
