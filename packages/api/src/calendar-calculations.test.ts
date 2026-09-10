import { test } from "node:test";
import assert from "node:assert/strict";
import {
  billingDate,
  calendarCells,
  calendarDay,
  contractEvents,
  validCalendarMonth,
} from "./calendar-calculations";
const contracts = [{ id: "internet", service: "Internet", provider: "Provider" }];
const term = {
  contractId: "internet",
  effectiveFrom: "2026-01-01",
  billingDay: 31,
  contractEndDate: null,
  monthlyCost: 30,
  status: "active",
  createdAt: new Date("2026-01-01"),
};
test("month validation rejects malformed and unsupported input", () => {
  for (const input of ["2026-13", "2026-1", "bogus", "2300-01", undefined])
    assert.equal(validCalendarMonth(input, "2026-09"), "2026-09");
  assert.equal(validCalendarMonth("2028-02", "2026-09"), "2028-02");
});
test("month grid is Monday-first, spans six weeks and includes leap day", () => {
  const cells = calendarCells("2028-02");
  assert.equal(cells.length, 42);
  assert.equal(cells[0], "2028-01-31");
  assert.ok(cells.includes("2028-02-29"));
  assert.equal(cells[41], "2028-03-12");
});
test("timestamps use the saved timezone, including midnight boundaries", () => {
  assert.equal(calendarDay(new Date("2026-09-01T00:30:00Z"), "America/New_York"), "2026-08-31");
  assert.equal(calendarDay(new Date("2026-08-31T23:30:00Z"), "Europe/Amsterdam"), "2026-09-01");
});
test("billing days clamp to the actual month length", () => {
  assert.equal(billingDate("2026-02", 31), "2026-02-28");
  assert.equal(billingDate("2028-02", 31), "2028-02-29");
  assert.equal(billingDate("2026-04", 31), "2026-04-30");
});
test("billing follows terms effective on the scheduled day", () => {
  const events = contractEvents(
    "2026-02",
    contracts,
    [
      term,
      { ...term, effectiveFrom: "2026-02-15", monthlyCost: 40, createdAt: new Date("2026-02-15") },
    ],
    "EUR",
  );
  assert.equal(events.length, 1);
  assert.equal(events[0]?.amount, 40);
  assert.equal(events[0]?.date, "2026-02-28");
  assert.equal(events[0]?.planned, true);
});
test("terminated and undated contracts do not fabricate bills", () => {
  assert.equal(
    contractEvents(
      "2026-02",
      contracts,
      [term, { ...term, effectiveFrom: "2026-02-10", status: "cancelled" }],
      "EUR",
    ).length,
    0,
  );
  assert.equal(
    contractEvents("2026-02", contracts, [{ ...term, billingDay: null }], "EUR").length,
    0,
  );
});
test("end dates still appear without billing days and stop subsequent bills", () => {
  const ended = { ...term, contractEndDate: "2026-02-20" };
  const events = contractEvents("2026-02", contracts, [ended], "EUR");
  assert.equal(events.length, 1);
  assert.equal(events[0]?.category, "Contracts");
  assert.equal(contractEvents("2026-03", contracts, [ended], "EUR").length, 0);
});
test("same-effective-date revisions use the latest saved term", () => {
  const events = contractEvents(
    "2026-02",
    contracts,
    [term, { ...term, monthlyCost: 45, createdAt: new Date("2026-01-02") }],
    "EUR",
  );
  assert.equal(events.length, 1);
  assert.equal(events[0]?.amount, 45);
});
