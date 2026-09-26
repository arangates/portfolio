import "server-only";

import { getFirePlan } from "./fire-queries";
import { getFinancialTwin } from "./financial-twin-queries";
import { getPortfolioOverview } from "./portfolio-queries";

export type ScenarioAdjustment = {
  type: "lump_expense" | "income_change" | "extra_savings" | "market_crash" | "sabbatical";
  label: string;
  amountOrPercent: number;
  durationMonths?: number;
};

export type ScenarioResult = {
  label: string;
  adjustments: ScenarioAdjustment[];
  baseline: {
    currentCorpus: number;
    requiredCorpus: number;
    progressPercent: number;
    yearsToFire: number | null;
    monthlySurplus: number;
    savingsRate: number;
  };
  projected: {
    currentCorpus: number;
    requiredCorpus: number;
    progressPercent: number;
    yearsToFire: number | null;
    monthlySurplus: number;
    savingsRate: number;
    deltaYears: number | null;
  };
  impact: string;
};

export const presetScenarios: Array<{ label: string; adjustments: ScenarioAdjustment[] }> = [
  {
    label: "20% Market Crash",
    adjustments: [{ type: "market_crash", label: "Equity correction", amountOrPercent: 20 }],
  },
  {
    label: "6-Month Sabbatical",
    adjustments: [
      { type: "sabbatical", label: "Career break", amountOrPercent: 0, durationMonths: 6 },
    ],
  },
  {
    label: "50% Salary Raise",
    adjustments: [{ type: "income_change", label: "Promotion", amountOrPercent: 50 }],
  },
  {
    label: "Buy a ₹1Cr House",
    adjustments: [{ type: "lump_expense", label: "House down payment", amountOrPercent: 10000000 }],
  },
];

const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(Math.round(n));

export async function runScenario(
  userId: string,
  label: string,
  adjustments: ScenarioAdjustment[],
): Promise<ScenarioResult | null> {
  const [fire, twin, overview] = await Promise.all([
    getFirePlan(userId).catch(() => null),
    getFinancialTwin(userId).catch(() => null),
    getPortfolioOverview(userId).catch(() => null),
  ]);

  if (!overview || !twin) return null;

  const currentCorpus =
    fire?.configured && fire.currentInvestableAssets !== undefined
      ? fire.currentInvestableAssets
      : overview.totals.netWorth;
  const requiredCorpus =
    fire?.configured && fire.results?.[0]
      ? fire.results[0].requiredCorpus
      : ((twin.capacity.typicalNetIncome ?? 0) - (twin.capacity.observedMonthlySurplus ?? 0)) *
        12 *
        40;

  const monthlySurplus = twin.capacity.observedMonthlySurplus ?? 0;
  const savingsRate =
    (twin.capacity.typicalNetIncome ?? 0) > 0
      ? (twin.capacity.observedMonthlySurplus ?? 0) / (twin.capacity.typicalNetIncome ?? 0)
      : 0;
  const progressPercent = requiredCorpus > 0 ? (currentCorpus / requiredCorpus) * 100 : 0;
  const yearsToFire =
    monthlySurplus > 0 && requiredCorpus > currentCorpus
      ? (requiredCorpus - currentCorpus) / (monthlySurplus * 12)
      : null;

  let projCorpus = currentCorpus;
  let projSurplus = monthlySurplus;

  for (const adj of adjustments) {
    if (adj.type === "lump_expense") projCorpus -= adj.amountOrPercent;
    else if (adj.type === "extra_savings") projSurplus += adj.amountOrPercent;
    else if (adj.type === "income_change") projSurplus += (projSurplus * adj.amountOrPercent) / 100;
    else if (adj.type === "market_crash") projCorpus -= (projCorpus * adj.amountOrPercent) / 100;
    else if (adj.type === "sabbatical" && adj.durationMonths) {
      projCorpus -=
        ((twin.capacity.typicalNetIncome ?? 0) - (twin.capacity.observedMonthlySurplus ?? 0)) *
        adj.durationMonths;
    }
  }

  const projProgressPercent = requiredCorpus > 0 ? (projCorpus / requiredCorpus) * 100 : 0;
  const projYearsToFire =
    projSurplus > 0 && requiredCorpus > projCorpus
      ? (requiredCorpus - projCorpus) / (projSurplus * 12)
      : null;

  let deltaYears = null;
  if (yearsToFire !== null && projYearsToFire !== null) {
    deltaYears = projYearsToFire - yearsToFire;
  }

  let impact = "";
  if (deltaYears !== null) {
    if (deltaYears > 0.1) impact = `Your FIRE date is delayed by ${deltaYears.toFixed(1)} years.`;
    else if (deltaYears < -0.1)
      impact = `Your FIRE date is accelerated by ${Math.abs(deltaYears).toFixed(1)} years.`;
    else impact = "This scenario has a negligible impact on your FIRE date.";
  } else {
    impact = `Your portfolio ${projCorpus < currentCorpus ? "drops" : "grows"} to ₹${fmt(projCorpus)}.`;
  }

  return {
    label,
    adjustments,
    baseline: {
      currentCorpus,
      requiredCorpus,
      progressPercent,
      yearsToFire,
      monthlySurplus,
      savingsRate,
    },
    projected: {
      currentCorpus: projCorpus,
      requiredCorpus,
      progressPercent: projProgressPercent,
      yearsToFire: projYearsToFire,
      monthlySurplus: projSurplus,
      savingsRate,
      deltaYears,
    },
    impact,
  };
}
