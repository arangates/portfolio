import assert from "node:assert/strict";
import test from "node:test";

import {
  allocateNextContribution,
  classifyIndianHolding,
  deploymentBuckets,
  fixedDepositMaturityValue,
  type DeploymentBucket,
} from "./capital-deployment-calculations";

test("classifies investable Indian holdings conservatively", () => {
  assert.equal(classifyIndianHolding("Debt - Ultra Short Duration"), "fixed_income");
  assert.equal(classifyIndianHolding("Hybrid - Balanced Advantage"), "hybrid");
  assert.equal(classifyIndianHolding("Equity - Flexi Cap"), "indian_equity");
  assert.equal(classifyIndianHolding("ETF"), "other_marketable");
});

test("computes compounded fixed-deposit proceeds", () => {
  const maturity = fixedDepositMaturityValue({
    principal: 100_000,
    interestRate: 0.08,
    startDate: "2025-01-01",
    maturityDate: "2026-01-01",
    compoundingPerYear: 4,
  });
  assert.ok(Math.abs(maturity - 108_237.52) < 0.02);
});

test("directs the next contribution only to underweight buckets", () => {
  const current = Object.fromEntries(deploymentBuckets.map((bucket) => [bucket, 0])) as Record<
    DeploymentBucket,
    number
  >;
  current.indian_equity = 80;
  current.global_equity = 20;
  const targets = Object.fromEntries(deploymentBuckets.map((bucket) => [bucket, 0])) as Record<
    DeploymentBucket,
    number
  >;
  targets.indian_equity = 0.5;
  targets.global_equity = 0.5;

  const allocation = allocateNextContribution(current, targets, 30);
  assert.equal(allocation.indian_equity, 0);
  assert.equal(allocation.global_equity, 30);
});
