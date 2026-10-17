import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateMonthlyCapacity,
  median,
  readinessScore,
  scaleContributionPlan,
  summarizeMonthlyIncome,
} from "./financial-twin-calculations";

test("median is robust to one bonus month", () => {
  assert.equal(median([5000, 5100, 4950, 12000, 5050]), 5050);
});

test("monthly deployment is bounded by observed surplus and policy", () => {
  const result = calculateMonthlyCapacity({
    monthlyNetIncome: [6000, 6200, 6100, 5900, 6050, 6150],
    monthlyHouseholdCost: 5000,
    policyMonthlyDeployment: 1500,
    fireAnnualSavings: 18_000,
  });
  assert.equal(result.typicalNetIncome, 6075);
  assert.equal(result.observedMonthlySurplus, 1075);
  assert.equal(result.supportedMonthlyDeployment, 1075);
  assert.equal(result.retainedMonthlyCash, 0);
  assert.equal(result.fireSavingsDifference, -425);
  assert.equal(result.evidenceGrade, "derived");
});

test("missing household evidence never becomes investable capacity", () => {
  const result = calculateMonthlyCapacity({
    monthlyNetIncome: [6000],
    monthlyHouseholdCost: null,
    policyMonthlyDeployment: 1000,
    fireAnnualSavings: null,
  });
  assert.equal(result.observedMonthlySurplus, null);
  assert.equal(result.supportedMonthlyDeployment, null);
  assert.equal(result.evidenceGrade, "limited");
});

test("contribution plan is proportionally capped to supported cash flow", () => {
  const result = scaleContributionPlan(
    [
      { bucket: "india", label: "India", nextContribution: 600 },
      { bucket: "global", label: "Global", nextContribution: 400 },
    ],
    500,
  );
  assert.deepEqual(result, [
    { bucket: "india", label: "India", amount: 300 },
    { bucket: "global", label: "Global", amount: 200 },
  ]);
});

test("readiness is an explicit count, not a confidence guess", () => {
  assert.deepEqual(readinessScore([true, true, false, true]), { ready: 3, total: 4, ratio: 0.75 });
});

const reviewDate = new Date("2026-09-07T12:00:00Z");
const payroll = (month: string, netPay: number | null, validationStatus = "verified") => ({
  payPeriod: `${month}-01`,
  netPay,
  validationStatus,
});

test("income uses completed calendar months, combines employers, and retains zero pay", () => {
  const result = summarizeMonthlyIncome(
    [
      payroll("2026-08", 3000),
      payroll("2026-08", 2000),
      payroll("2026-07", 0),
      payroll("2026-06", 4000),
      payroll("2026-02", 9000),
      payroll("2026-09", 12000),
      payroll("2026-10", 12000),
    ],
    reviewDate,
  );
  assert.deepEqual(result.monthlyNetIncome, [4000, 0, 5000]);
  assert.equal(result.incomeMonths, 3);
  assert.equal(result.missingMonths, 3);
  assert.equal(result.ready, true);
  assert.equal(median(result.monthlyNetIncome), 4000);
});

test("six old payslips cannot establish current capacity", () => {
  const result = summarizeMonthlyIncome(
    [1, 2, 3, 4, 5, 6].map((month) => payroll(`2025-${String(month).padStart(2, "0")}`, 5000)),
    reviewDate,
  );
  assert.equal(result.incomeMonths, 0);
  assert.equal(result.ready, false);
});

test("review or missing FX in one employer invalidates the entire month", () => {
  for (const badRow of [payroll("2026-08", 2000, "review"), payroll("2026-08", null)]) {
    const result = summarizeMonthlyIncome(
      [
        payroll("2026-08", 3000),
        badRow,
        payroll("2026-07", 5000),
        payroll("2026-06", 5000),
        payroll("2026-05", 5000),
      ],
      reviewDate,
    );
    assert.equal(result.invalidMonths, 1);
    assert.equal(result.incomeMonths, 3);
    assert.equal(result.ready, false);
    assert.deepEqual(result.monthlyNetIncome, [5000, 5000, 5000]);
  }
});

test("three months require previous-month evidence and handle year boundaries", () => {
  const rows = [payroll("2025-12", 5000), payroll("2025-11", 5000), payroll("2025-10", 5000)];
  assert.equal(summarizeMonthlyIncome(rows, new Date("2026-01-07Z")).ready, true);
  assert.equal(summarizeMonthlyIncome(rows.slice(1), new Date("2026-01-07Z")).ready, false);
  assert.equal(summarizeMonthlyIncome(rows, new Date("2026-02-07Z")).ready, false);
});

test("old and future payroll does not request irrelevant FX conversions", () => {
  const converted: string[] = [];
  summarizeMonthlyIncome(
    [payroll("2025-01", 1), payroll("2026-08", 2), payroll("2027-01", 3)],
    reviewDate,
    (row) => {
      converted.push(row.payPeriod);
      return row.netPay;
    },
  );
  assert.deepEqual(converted, ["2026-08-01"]);
});

test("a deficit stays signed while deployment and retained cash remain zero", () => {
  const result = calculateMonthlyCapacity({
    monthlyNetIncome: [3000, 3000, 3000],
    monthlyHouseholdCost: 4000,
    policyMonthlyDeployment: 500,
    fireAnnualSavings: 12000,
  });
  assert.equal(result.observedMonthlySurplus, -1000);
  assert.equal(result.supportedMonthlyDeployment, 0);
  assert.equal(result.retainedMonthlyCash, 0);
  assert.equal(result.fireSavingsDifference, -2000);
  assert.deepEqual(
    scaleContributionPlan(
      [{ bucket: "equity", label: "Equity", nextContribution: 500 }],
      result.supportedMonthlyDeployment,
    ),
    [],
  );
});

test("net refunds and negative pay retain their arithmetic meaning", () => {
  assert.equal(median([-200, 0, 200]), 0);
  const result = calculateMonthlyCapacity({
    monthlyNetIncome: [3000],
    monthlyHouseholdCost: -100,
    policyMonthlyDeployment: 500,
    fireAnnualSavings: null,
  });
  assert.equal(result.observedMonthlySurplus, 3100);
});
