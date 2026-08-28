import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateFirePlan,
  type FireExpenseModel,
  type FireProfileModel,
  type FireScenarioModel,
} from "./fire-engine";

const profile: FireProfileModel = {
  birthDate: "1995-12-01",
  plannedRetirementYear: 2029,
  planEndAge: 80,
  inflationRate: 0.06,
  expectedReturnRate: 0.08,
  returnVolatility: 0,
  safeWithdrawalRate: 0.035,
  safetyBuffer: 0.15,
  annualSavings: 0,
  targetLegacy: 0,
  spendingPolicy: "fixed_real",
};

const expense: FireExpenseModel = {
  id: "living",
  name: "Living costs",
  category: "Living",
  monthlyAmount: 100_000,
  essential: true,
  startYear: null,
  endYear: null,
  inflationRateOverride: null,
};

const scenario: FireScenarioModel = {
  id: "doable",
  name: "Doable",
  spendingMultiplier: 1,
  bufferRate: 0,
  returnRateOverride: null,
  inflationRateOverride: null,
  retirementYearOverride: null,
};

function plan(overrides: Partial<Parameters<typeof calculateFirePlan>[0]> = {}) {
  return calculateFirePlan({
    currentYear: 2026,
    currentInvestableAssets: 0,
    profile,
    expenses: [expense],
    oneTimeCosts: [],
    incomeStreams: [],
    scenarios: [scenario],
    ...overrides,
  })[0]!;
}

test("the configured safe withdrawal rate constrains the corpus", () => {
  const standard = plan();
  const conservative = plan({
    profile: { ...profile, safeWithdrawalRate: 0.025 },
  });

  assert.ok(conservative.requiredCorpus > standard.requiredCorpus);
  assert.ok(Math.abs(conservative.recurringReserve / standard.recurringReserve - 1.4) < 1e-10);
});

test("a retirement-year life event is added once to the policy reserve", () => {
  const result = plan({
    oneTimeCosts: [
      {
        id: "event",
        name: "Retirement setup",
        amount: 2_000_000,
        plannedYear: 2029,
        priority: "essential",
        inflationLinked: false,
      },
    ],
  });

  assert.equal(result.oneTimeReserve, 2_000_000);
  assert.equal(result.policyCorpus, result.recurringReserve + 2_000_000);
});

test("pre-retirement costs do not contaminate the retirement corpus reserve", () => {
  const result = plan({
    oneTimeCosts: [
      {
        id: "past",
        name: "Already paid setup",
        amount: 50_000_000,
        plannedYear: 2026,
        priority: "important",
        inflationLinked: false,
      },
    ],
  });

  assert.equal(result.oneTimeReserve, 0);
});

test("a 15% safety scenario increases both spending and life-event reserves by 15%", () => {
  const base = plan({
    oneTimeCosts: [
      {
        id: "event",
        name: "Retirement setup",
        amount: 2_000_000,
        plannedYear: 2029,
        priority: "essential",
        inflationLinked: false,
      },
    ],
  });
  const buffered = plan({
    oneTimeCosts: [
      {
        id: "event",
        name: "Retirement setup",
        amount: 2_000_000,
        plannedYear: 2029,
        priority: "essential",
        inflationLinked: false,
      },
    ],
    scenarios: [{ ...scenario, id: "safe", bufferRate: 0.15 }],
  });

  assert.ok(Math.abs(buffered.recurringReserve / base.recurringReserve - 1.15) < 1e-10);
  assert.ok(Math.abs(buffered.oneTimeReserve / base.oneTimeReserve - 1.15) < 1e-10);
});

test("the audited workbook totals produce the expected retirement-date reserves", () => {
  const result = plan({
    expenses: [{ ...expense, monthlyAmount: 99_268 }],
    oneTimeCosts: [
      {
        id: "retirement-events",
        name: "Retirement life events",
        amount: 17_866_900,
        plannedYear: 2029,
        priority: "important",
        inflationLinked: true,
      },
    ],
  });

  assert.ok(Math.abs(result.annualExpensesAtRetirement - 1_418_757.315456) < 0.01);
  assert.ok(Math.abs(result.recurringReserve - 40_535_923.298743) < 0.01);
  assert.ok(Math.abs(result.oneTimeReserve - 21_279_763.7704) < 0.01);
  assert.ok(Math.abs(result.requiredCorpus - 61_815_687.069143) < 0.01);
});

test("a retirement override beyond the original end year still has a valid projection", () => {
  const result = plan({
    scenarios: [{ ...scenario, retirementYearOverride: 2080 }],
  });

  assert.ok(result.requiredCorpus > 0);
  assert.equal(result.deterministic.at(-1)?.year, 2080);
});
