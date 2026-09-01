import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateMonthlyCapacity,
  median,
  readinessScore,
  scaleContributionPlan,
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
  assert.equal(result.evidenceGrade, "reconciled");
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
