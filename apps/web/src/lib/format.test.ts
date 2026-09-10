import { test } from "node:test";
import assert from "node:assert/strict";
import { createAmountFormatter } from "./format";
test("compact/exact change display only and preserve signed minor units", () => {
  const exact = createAmountFormatter("exact").formatCurrency,
    compact = createAmountFormatter("compact").formatCurrency;
  assert.equal(exact(123456.78, "EUR"), "€123,456.78");
  assert.equal(compact(123456.78, "INR"), "₹1.23L");
  assert.equal(exact(-1000.09, "INR"), "-₹1,000.09");
  assert.equal(exact(0, "EUR"), "€0.00");
  assert.equal(exact(NaN, "EUR"), "—");
  assert.notEqual(compact(123456.78, "EUR"), exact(123456.78, "EUR"));
});
