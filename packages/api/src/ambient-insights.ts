import "server-only";

import { getPortfolioOverview, getCurrentFixedDeposits } from "./portfolio-queries";
import { getFinancialTwin } from "./financial-twin-queries";
import { getFirePlan } from "./fire-queries";
import { getCapitalDeploymentEngine } from "./capital-deployment-queries";
import { getSnapshotEvidence } from "./snapshot-insights-queries";
import { getCashFlowDashboard } from "./cash-flow-queries";

export type AmbientInsight = {
  id: string;
  category:
    | "idle_cash"
    | "lifestyle_creep"
    | "deployment_drift"
    | "stale_data"
    | "fire_milestone"
    | "fd_maturity"
    | "savings_rate";
  severity: "info" | "warning" | "critical";
  icon: string;
  title: string;
  description: string;
  metric?: string;
  actionLabel?: string;
  actionHref?: string;
};

const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(Math.round(n));

export async function getAmbientInsights(userId: string): Promise<AmbientInsight[]> {
  const insights: AmbientInsight[] = [];

  try {
    const [overview, twin, fire, deployment, evidence, _cashFlow, deposits] = await Promise.all([
      getPortfolioOverview(userId).catch(() => null),
      getFinancialTwin(userId).catch(() => null),
      getFirePlan(userId).catch(() => null),
      getCapitalDeploymentEngine(userId).catch(() => null),
      getSnapshotEvidence(userId).catch(() => null),
      getCashFlowDashboard(userId, "personal", 6).catch(() => null),
      getCurrentFixedDeposits(userId).catch(() => null),
    ]);

    // 1. Idle Cash Trap
    if (overview && twin) {
      const liquidCash = overview.liquidAllocation.find((a) => a.category === "cash")?.value ?? 0;
      const monthlyExpenses =
        (twin.capacity.typicalNetIncome ?? 0) - (twin.capacity.observedMonthlySurplus ?? 0);
      if (monthlyExpenses > 0 && liquidCash > monthlyExpenses * 6) {
        const inflationDrag = (liquidCash * 0.06) / 12;
        insights.push({
          id: "idle_cash",
          category: "idle_cash",
          severity: "warning",
          icon: "BanknoteIcon",
          title: "Idle Cash Accumulation",
          description: `You have ₹${fmt(liquidCash)} in idle cash, which exceeds 6 months of living expenses. It's losing ~₹${fmt(inflationDrag)}/month to inflation.`,
          metric: `₹${fmt(liquidCash)}`,
          actionLabel: "Deploy cash",
          actionHref: "/dashboard/deployment",
        });
      }
    }

    // 2. Deployment Drift
    if (deployment?.targetsConfigured) {
      const drifting = deployment.allocation.filter(
        (a) => a.status === "below" || a.status === "above",
      );
      let worstDrift = drifting[0];
      for (const d of drifting) {
        if (Math.abs(d.targetGap ?? 0) > Math.abs(worstDrift?.targetGap ?? 0)) worstDrift = d;
      }

      if (worstDrift && worstDrift.targetWeight && worstDrift.targetGap) {
        const diff = Math.abs(worstDrift.currentWeight - worstDrift.targetWeight);
        if (diff > 0.05) {
          // 5pp drift
          const isBelow = worstDrift.status === "below";
          insights.push({
            id: "deployment_drift",
            category: "deployment_drift",
            severity: "warning",
            icon: "TrendingUpIcon",
            title: "Allocation Drift Detected",
            description: `${worstDrift.label} is ${Math.round(diff * 100)}% ${isBelow ? "below" : "above"} your target. ${isBelow ? `Your next ₹${fmt(worstDrift.targetGap)} should go here.` : "Consider rebalancing."}`,
            actionLabel: "Rebalance",
            actionHref: "/dashboard/deployment",
          });
        }
      }
    }

    // 3. Stale Data
    if (evidence) {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const stale = evidence.filter((e) => e.asOf && new Date(e.asOf) < thirtyDaysAgo);
      if (stale.length > 0) {
        insights.push({
          id: "stale_data",
          category: "stale_data",
          severity: "info",
          icon: "FileClockIcon",
          title: "Stale Financial Data",
          description: `${stale.length} data source${stale.length > 1 ? "s haven't" : " hasn't"} been updated in over 30 days.`,
          actionLabel: "Import statements",
          actionHref: "/dashboard/imports",
        });
      }
    }

    // 4. FIRE Milestone
    if (fire?.configured && fire.results && fire.results[0]) {
      const p = fire.results[0].progress * 100;
      const thresholds = [25, 50, 75, 90, 100];
      // Just find the highest passed
      let passed = 0;
      for (const t of thresholds) {
        if (p >= t) passed = t;
      }
      if (passed > 0) {
        insights.push({
          id: "fire_milestone",
          category: "fire_milestone",
          severity: "info",
          icon: "FlameIcon",
          title: `FIRE Milestone: ${passed}%`,
          description: `You've crossed ${passed}% of your FIRE corpus! ₹${fmt(fire.currentInvestableAssets)} of ₹${fmt((fire.results && fire.results[0]).requiredCorpus)}.`,
          metric: `${Math.round(p)}%`,
          actionLabel: "View FIRE plan",
          actionHref: "/dashboard/fire",
        });
      }
    }

    // 5. FD Maturity
    if (deposits) {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const maturing = deposits.filter(
        (d) => d.status === "active" && new Date(d.maturityDate) <= thirtyDaysFromNow,
      );
      if (maturing.length > 0) {
        const total = maturing.reduce((sum, d) => sum + d.principal, 0);
        insights.push({
          id: "fd_maturity",
          category: "fd_maturity",
          severity: "info",
          icon: "LandmarkIcon",
          title: "Upcoming FD Maturity",
          description: `${maturing.length} fixed deposit${maturing.length > 1 ? "s mature" : " matures"} within 30 days (₹${fmt(total)} principal). Plan your reinvestment.`,
          actionLabel: "View deposits",
          actionHref: "/dashboard/fixed-deposits",
        });
      }
    }

    // 6. Savings Rate
    if (twin) {
      const savingsRate =
        (twin.capacity.observedMonthlySurplus ?? 0) / (twin.capacity.typicalNetIncome ?? 0);
      if (savingsRate < 0.2) {
        insights.push({
          id: "savings_rate_low",
          category: "savings_rate",
          severity: "warning",
          icon: "WalletCardsIcon",
          title: "Low Savings Rate",
          description: `Your savings rate is ${Math.round(savingsRate * 100)}%, below the recommended 20% minimum.`,
          metric: `${Math.round(savingsRate * 100)}%`,
        });
      } else if (savingsRate > 0.5) {
        insights.push({
          id: "savings_rate_high",
          category: "savings_rate",
          severity: "info",
          icon: "WalletCardsIcon",
          title: "Exceptional Savings Rate",
          description: `Your savings rate is ${Math.round(savingsRate * 100)}% — exceptional discipline.`,
          metric: `${Math.round(savingsRate * 100)}%`,
        });
      }
    }
  } catch (err) {
    console.error("Failed to generate ambient insights", err);
  }

  // Sort by severity: critical > warning > info
  const severityScore = { critical: 3, warning: 2, info: 1 };
  return insights.sort((a, b) => severityScore[b.severity] - severityScore[a.severity]).slice(0, 5); // Return top 5
}
