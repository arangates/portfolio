import "server-only";

import { createHash } from "node:crypto";
import { getPortfolioOverview, getCurrentFixedDeposits } from "./portfolio-queries";
import { getFinancialTwin } from "./financial-twin-queries";
import { getFirePlan } from "./fire-queries";
import { getCapitalDeploymentEngine } from "./capital-deployment-queries";
import { getSnapshotEvidence } from "./snapshot-insights-queries";
import { getHouseholdDashboard } from "./household-queries";
import { getCashFlowDashboard } from "./cash-flow-queries";
import { getSalaryPayslips } from "./salary-queries";
import { getVerifiedReturnsEngine } from "./verified-returns-queries";
import { sourceFreshness } from "./insight-calculations";

export type EvaluationContext = {
  prompt: string;
  rubrics: string;
  contextHash: string;
  raw: {
    overview: Awaited<ReturnType<typeof getPortfolioOverview>>;
    twin: Awaited<ReturnType<typeof getFinancialTwin>>;
    fire: Awaited<ReturnType<typeof getFirePlan>>;
    deployment: Awaited<ReturnType<typeof getCapitalDeploymentEngine>>;
    evidence: Awaited<ReturnType<typeof getSnapshotEvidence>>;
    household: Awaited<ReturnType<typeof getHouseholdDashboard>>;
    cashFlow: {
      personal: Awaited<ReturnType<typeof getCashFlowDashboard>>;
      joint: Awaited<ReturnType<typeof getCashFlowDashboard>>;
    };
    salary: Awaited<ReturnType<typeof getSalaryPayslips>>;
    returns: Awaited<ReturnType<typeof getVerifiedReturnsEngine>>;
    fixedDeposits: Awaited<ReturnType<typeof getCurrentFixedDeposits>>;
  };
};

function fmt(value: number, decimals = 0) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export async function buildEvaluationContext(userId: string): Promise<EvaluationContext> {
  const [
    overview,
    twin,
    fire,
    deployment,
    evidence,
    household,
    personalCashFlow,
    jointCashFlow,
    salary,
    returns,
    fixedDeposits,
  ] = await Promise.all([
    getPortfolioOverview(userId),
    getFinancialTwin(userId),
    getFirePlan(userId),
    getCapitalDeploymentEngine(userId),
    getSnapshotEvidence(userId),
    getHouseholdDashboard(userId),
    getCashFlowDashboard(userId, "personal"),
    getCashFlowDashboard(userId, "joint"),
    getSalaryPayslips(userId),
    getVerifiedReturnsEngine(userId),
    getCurrentFixedDeposits(userId),
  ]);

  const { baseCurrency } = overview.preference;
  const sections: string[] = [];

  // --- Portfolio Overview (concise) ---
  sections.push(`## Portfolio Overview
Base currency: ${baseCurrency}
Net worth: ${fmt(overview.totals.netWorth)} ${baseCurrency}
Liquid assets: ${fmt(overview.totals.liquidValue)} ${baseCurrency} (${overview.totals.netWorth > 0 ? fmt((overview.totals.liquidValue / overview.totals.netWorth) * 100, 1) : 0}%)
Non-liquid: ${fmt(Math.max(0, overview.totals.netWorth - overview.totals.liquidValue))} ${baseCurrency}
Asset count: ${overview.assets.length}
Allocations: ${overview.allocation.map((a) => `${a.category}: ${fmt(a.value)} ${baseCurrency}`).join(", ")}
Liquid breakdown: ${overview.liquidAllocation.map((a) => `${a.category}: ${fmt(a.value)} ${baseCurrency}`).join(", ")}
Unconverted currencies: ${overview.unconvertedCurrencies.length > 0 ? overview.unconvertedCurrencies.join(", ") : "None"}
Indian equity P&L: ${fmt(overview.totals.equityPnl)} INR on ${fmt(overview.totals.equityInvested)} INR invested (${overview.totals.equityInvested > 0 ? fmt((overview.totals.equityPnl / overview.totals.equityInvested) * 100, 1) : 0}%)
Valuation as of: ${overview.asOf ?? "Current"}`);

  // --- Financial Twin ---
  if (twin.capacity) {
    sections.push(`## Financial Twin (Income & Capacity)
Monthly take-home (typical): ${twin.capacity.typicalNetIncome !== null ? fmt(twin.capacity.typicalNetIncome) + " " + baseCurrency : "N/A"}
Monthly household cost: ${twin.capacity.monthlyHouseholdCost !== null ? fmt(twin.capacity.monthlyHouseholdCost) + " " + baseCurrency : "N/A"}
Monthly surplus: ${twin.capacity.observedMonthlySurplus !== null ? fmt(twin.capacity.observedMonthlySurplus) + " " + baseCurrency : "N/A"}
Supported monthly deployment: ${twin.capacity.supportedMonthlyDeployment !== null ? fmt(twin.capacity.supportedMonthlyDeployment) + " " + baseCurrency : "N/A"}
FIRE savings feasibility: ${twin.capacity.fireSavingsDifference !== null ? fmt(twin.capacity.fireSavingsDifference) + " " + baseCurrency + " gap" : "N/A"}
Readiness score: ${twin.readiness?.ratio ? fmt(twin.readiness.ratio * 10, 1) : "N/A"}/10
Evidence grade: ${twin.capacity.evidenceGrade ?? "N/A"}
Actions flagged: ${twin.actions?.length ?? 0}`);
    if (twin.actions && twin.actions.length > 0) {
      sections.push(
        twin.actions
          .slice(0, 5)
          .map((a) => `- [${a.severity}] ${a.title}: ${a.description}`)
          .join("\n"),
      );
    }
  } else {
    sections.push(`## Financial Twin\nNot configured (missing salary or household data)`);
  }

  // --- FIRE Projection ---
  if (fire.configured) {
    const baseResult = fire.results?.[0];
    sections.push(`## FIRE Projection
Profile: Retire by ${fire.profile.plannedRetirementYear}, plan ends at age ${fire.profile.planEndAge}
Expected return: ${fire.profile.expectedReturnRate}%, Inflation: ${fire.profile.inflationRate}%
Annual savings assumed: ${fmt(fire.profile.annualSavings)} ${baseCurrency}
Current investable assets: ${fmt(fire.currentInvestableAssets)} ${baseCurrency}
${
  baseResult
    ? `Scenario "${baseResult.name}":
  Required corpus: ${fmt(baseResult.requiredCorpus)} ${baseCurrency}
  Progress: ${fmt(baseResult.progress * 100, 1)}%
  Gap: ${fmt(baseResult.gap)} ${baseCurrency}
  Monte Carlo success: ${fmt(baseResult.successProbability * 100, 0)}%
  Annual expenses at retirement: ${fmt(baseResult.annualExpensesAtRetirement)} ${baseCurrency}`
    : "No scenarios computed"
}`);
  } else {
    sections.push(`## FIRE Projection\nNot configured`);
  }

  // --- Capital Deployment ---
  if (deployment.allocation && deployment.allocation.length > 0) {
    sections.push(`## Capital Deployment
Monthly deployment base: ${fmt(deployment.summary.monthlyDeploymentBase)} ${baseCurrency}
Allocations:\n${deployment.allocation
      .map(
        (a) =>
          `  ${a.bucket}: current ${fmt(a.currentValue)} (${fmt(a.currentWeight * 100, 1)}%) → target ${a.targetWeight ? fmt(a.targetWeight * 100, 1) : 0}%, drift ${a.targetWeight ? fmt((a.currentWeight - a.targetWeight) * 100, 1) : 0}pp`,
      )
      .join("\n")}
Missing currencies: ${deployment.missingCurrencies.length > 0 ? deployment.missingCurrencies.join(", ") : "None"}`);
  } else {
    sections.push(`## Capital Deployment\nNot configured`);
  }

  // --- Evidence Freshness ---
  const freshness = evidence.map((e) => ({
    ...e,
    freshness: sourceFreshness(e.asOf, 90),
  }));
  const staleCount = freshness.filter((f) => f.freshness.status === "stale").length;
  sections.push(`## Evidence Freshness
Total sources tracked: ${evidence.length}
Stale sources (>90 days): ${staleCount}
${freshness
  .slice(0, 10)
  .map(
    (f) =>
      `  ${f.kind} "${f.name}": ${f.freshness.ageDays ?? "?"}d old${f.freshness.status === "stale" ? " ⚠️ STALE" : ""}`,
  )
  .join("\n")}`);

  // --- Household Budget ---
  if (household.configured) {
    sections.push(`## Household Budget
Currency: ${household.currency}
Net monthly: ${fmt(household.metrics.netMonthly)} ${household.currency}
Annual net: ${fmt(household.metrics.annualNet)} ${household.currency}
Scenarios: ${household.scenarios.map((s) => `${s.name}: ${fmt(s.netMonthly)} ${household.currency}/mo`).join(", ")}`);
  } else {
    sections.push(`## Household Budget\nNot configured`);
  }

  // --- Cash Flow (last 6 months) ---
  function formatCashFlow(label: string, data: Awaited<ReturnType<typeof getCashFlowDashboard>>) {
    if (!data.configured) return `### ${label}\nNot configured`;
    const recentMonths = data.monthly.slice(-6);
    const avgIncome =
      recentMonths.length > 0
        ? recentMonths.reduce((s, m) => s + m.income, 0) / recentMonths.length
        : 0;
    const avgSpending =
      recentMonths.length > 0
        ? recentMonths.reduce((s, m) => s + m.spending, 0) / recentMonths.length
        : 0;
    const savingsRate = avgIncome > 0 ? ((avgIncome - avgSpending) / avgIncome) * 100 : 0;
    return `### ${label}
Currency: ${data.currency}
Avg monthly income (6mo): ${fmt(avgIncome)} ${data.currency}
Avg monthly spending (6mo): ${fmt(avgSpending)} ${data.currency}
Savings rate: ${fmt(savingsRate, 1)}%
Top categories: ${data.categories
      .slice(0, 5)
      .map((c) => `${c.name}: ${fmt(c.value)} ${data.currency}`)
      .join(", ")}`;
  }
  sections.push(
    `## Cash Flow\n${formatCashFlow("Personal", personalCashFlow)}\n${formatCashFlow("Joint", jointCashFlow)}`,
  );

  // --- Fixed Deposits ---
  if (fixedDeposits.length > 0) {
    const totalValue = fixedDeposits.reduce((s, fd) => s + fd.principal, 0);
    const nearest = fixedDeposits
      .filter((fd) => fd.maturityDate)
      .sort((a, b) => new Date(a.maturityDate!).getTime() - new Date(b.maturityDate!).getTime())[0];
    sections.push(`## Fixed Deposits
Count: ${fixedDeposits.length}
Total principal: ${fmt(totalValue)}
Nearest maturity: ${nearest ? `${nearest.bank} on ${nearest.maturityDate} (${fmt(nearest.principal)})` : "None upcoming"}`);
  } else {
    sections.push(`## Fixed Deposits\nNone recorded`);
  }

  // --- Verified Returns ---
  if (returns.summary) {
    const worstGrade = returns.evidence?.[0]?.grade ?? "N/A";
    sections.push(`## Verified Returns
${JSON.stringify(returns.summary, null, 2)}
Evidence quality: ${worstGrade}`);
  } else {
    sections.push(`## Verified Returns\nNo data available`);
  }

  // --- Salary History ---
  const recentPayslips = salary.slice(0, 6);
  if (recentPayslips.length > 0) {
    sections.push(`## Salary History (last ${recentPayslips.length} payslips)
${recentPayslips.map((p) => `  ${p.payPeriod}: Gross ${fmt(p.grossPay)} ${p.currency}, Net ${fmt(p.netPay)} ${p.currency}, Tax ${fmt(p.wageTax)} ${p.currency}`).join("\n")}`);
  } else {
    sections.push(`## Salary History\nNo payslips imported`);
  }

  const prompt = `# Financial Evaluation Context\nEvaluation date: ${new Date().toISOString()}\n\n${sections.join("\n\n")}`;

  const rubrics = `You are Selvam Evaluate, an expert financial intelligence engine for an Indian tech professional working as an expat in the Netherlands, managing dual-country finances (INR + EUR).

Evaluate the financial data provided and produce a structured assessment.

## Scoring Dimensions (0-100 each)

### liquidity_health
Assess emergency fund adequacy (months of expenses covered by liquid assets), cash flow savings rate, FD maturity coverage for upcoming obligations, unconverted currency exposure risk.
- 90-100: 6+ months runway, strong savings rate, no currency gaps
- 70-89: 3-6 months runway, stable savings, minor currency exposure
- 50-69: 2-3 months runway, thin margins
- 30-49: <2 months runway, declining cash flow
- 0-29: Critical liquidity risk

### fire_trajectory
Assess Monte Carlo success probability, savings gap (actual vs plan), portfolio return vs expected, coast FIRE proximity, expense creep.
- 90-100: >90% success probability, ahead of target
- 70-89: 70-90% success, minor savings gap
- 50-69: 50-70% success, significant gap
- 30-49: <50% success, assumptions misaligned
- 0-29: FIRE plan at serious risk

### deployment_discipline
Assess allocation drift from targets, deployment velocity consistency, surplus utilization rate, rebalancing status.
- 90-100: All buckets within 2% of target
- 70-89: Minor drift, consistent deployment
- 50-69: Notable drift, inconsistent deployment
- 30-49: Significant drift, capital accumulating undeployed
- 0-29: Deployment policy not followed

### evidence_freshness
Assess data recency: stale asset snapshots (>30 days), missing exchange rates, payslip recency, mutual fund NAV sync.
- 90-100: All sources <30 days old, complete FX coverage
- 70-89: Most sources current, minor gaps
- 50-69: Several sources >60 days old
- 30-49: Many stale sources, decisions based on outdated data
- 0-29: Critical data gaps

### tax_efficiency
Assess effective tax rate optimization, 30% ruling utilization (if applicable), outstanding liabilities, Box 3 optimization (NL).
- 90-100: Fully optimized, no outstanding liabilities
- 70-89: Good structure, minor opportunities
- 50-69: Suboptimal structure, missed opportunities
- 30-49: Significant tax inefficiency
- 0-29: Critical tax issues

## Overall Score
Weighted average: liquidity 25%, fire 25%, deployment 20%, evidence 15%, tax 15%.

## Alerts
Identify 0-5 cross-domain alerts. Each alert must have:
- category: one of "liquidity", "fire", "deployment", "evidence", "tax", "cross_domain"
- severity: "info", "warning", or "critical"
- title: concise alert title (max 60 chars)
- description: actionable explanation (max 200 chars)
- action_label: optional button text for next step
- action_href: optional dashboard link (e.g., "/dashboard/fire", "/dashboard/twin", "/dashboard/analytics")
- alert_key: unique identifier for deduplication (e.g., "liquidity-runway-low", "fire-savings-gap")

Focus on CROSS-DOMAIN insights that span multiple financial areas. The user already sees individual domain metrics on their dashboard pages.

## Executive Summary
2-3 sentences summarizing the overall financial posture, highlighting the most important insight and recommended action.

If a section says "Not configured", score that dimension based on available information only. Do not penalize for unconfigured sections; instead note it as an informational alert.`;

  // Build hash from key metrics to detect meaningful changes
  const hashInput = {
    netWorth: overview.totals.netWorth,
    liquidValue: overview.totals.liquidValue,
    equityPnl: overview.totals.equityPnl,
    assetCount: overview.assets.length,
    staleEvidence: staleCount,
    householdConfigured: household.configured,
    householdNet: household.configured ? household.metrics.netMonthly : null,
    fireConfigured: fire.configured,
    fireProgress: fire.configured ? fire.results?.[0]?.progress : null,
    fireSuccess: fire.configured ? fire.results?.[0]?.successProbability : null,
    deploymentBase: deployment.summary.monthlyDeploymentBase,
    salaryCount: salary.length,
    latestPayslipPeriod: salary[0]?.payPeriod ?? null,
    fdCount: fixedDeposits.length,
    unconverted: overview.unconvertedCurrencies.length,
  };

  const contextHash = createHash("sha256").update(JSON.stringify(hashInput)).digest("hex");

  return {
    prompt,
    rubrics,
    contextHash,
    raw: {
      overview,
      twin,
      fire,
      deployment,
      evidence,
      household,
      cashFlow: { personal: personalCashFlow, joint: jointCashFlow },
      salary,
      returns,
      fixedDeposits,
    },
  };
}
