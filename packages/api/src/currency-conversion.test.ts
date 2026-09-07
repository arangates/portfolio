import assert from "node:assert/strict";
import test from "node:test";

import {
  convertCurrency,
  resolveConversionRate,
  resolveHistoricalConversionRate,
} from "./currency-conversion";

const rate = { baseCurrency: "INR", quoteCurrency: "EUR", rate: 100 };

test("converts EUR to INR using the stored quote-to-base convention", () => {
  assert.equal(convertCurrency(2, "EUR", "INR", [rate]), 200);
});

test("converts INR to EUR using the inverse rate", () => {
  assert.equal(resolveConversionRate("INR", "EUR", [rate]), 0.01);
});

test("uses the latest historical reference rate on or before the event", () => {
  const rates = [
    { ...rate, rate: 99, rateType: "reference", asOf: new Date("2026-09-03T12:00:00Z") },
    { ...rate, rate: 101, rateType: "reference", asOf: new Date("2026-09-04T12:00:00Z") },
    { ...rate, rate: 102, rateType: "indicative", asOf: new Date("2026-09-05T10:00:00Z") },
  ];
  assert.equal(
    resolveHistoricalConversionRate("EUR", "INR", new Date("2026-09-06T12:00:00Z"), rates),
    101,
  );
});

test("does not silently use an old rate for a historical event", () => {
  assert.equal(
    resolveHistoricalConversionRate("EUR", "INR", new Date("2026-09-20T12:00:00Z"), [
      { ...rate, rateType: "reference", asOf: new Date("2026-09-04T12:00:00Z") },
    ]),
    null,
  );
});
