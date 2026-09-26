import "server-only";

import { getCapitalDeploymentEngine } from "./capital-deployment-queries";
import { getFinancialTwin } from "./financial-twin-queries";

export type DeploymentLineItem = {
  bucket: string;
  label: string;
  amount: number;
  reason: string;
  priority: "high" | "medium" | "low";
};

export type DeploymentPlan = {
  availableCash: number;
  currency: string;
  items: DeploymentLineItem[];
  totalDeployed: number;
  remainder: number;
  summary: string;
};

const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(Math.round(n));

export async function generateDeploymentPlan(
  userId: string,
  overrideAmount?: number,
): Promise<DeploymentPlan | null> {
  const [deployment, twin] = await Promise.all([
    getCapitalDeploymentEngine(userId).catch(() => null),
    getFinancialTwin(userId).catch(() => null),
  ]);

  if (!deployment || !twin) return null;

  const availableCash = overrideAmount ?? deployment.summary.availableCapital;

  if (!deployment.targetsConfigured || availableCash <= 0) {
    return {
      availableCash,
      currency: deployment.preference.baseCurrency,
      items: [],
      totalDeployed: 0,
      remainder: availableCash,
      summary: !deployment.targetsConfigured
        ? "Set up allocation targets first in /dashboard/deployment"
        : "No available cash to deploy.",
    };
  }

  const items: DeploymentLineItem[] = [];
  let remainingCash = availableCash;

  const configured = deployment.allocation.filter(
    (a) => a.status !== "unconfigured" && a.targetWeight !== null,
  );

  // 1. Fill negative gaps (below target)
  const below = configured
    .filter((a) => a.status === "below" && (a.targetGap ?? 0) > 0)
    .sort((a, b) => (b.targetGap ?? 0) - (a.targetGap ?? 0));

  for (const b of below) {
    if (remainingCash <= 0) break;
    const gap = b.targetGap ?? 0;
    const amount = Math.min(gap, remainingCash);
    if (amount > 0) {
      items.push({
        bucket: b.bucket,
        label: b.label,
        amount,
        reason: "Priority rebalance to close target gap",
        priority: "high",
      });
      remainingCash -= amount;
    }
  }

  // 2. Distribute remainder proportionally
  if (remainingCash > 100) {
    // arbitrary small threshold
    const totalWeight = configured.reduce((sum, a) => sum + (a.targetWeight ?? 0), 0);
    if (totalWeight > 0) {
      const extraCash = remainingCash; // snapshot
      for (const a of configured) {
        const amount = Math.floor(extraCash * ((a.targetWeight ?? 0) / totalWeight));
        if (amount > 0) {
          const existing = items.find((i) => i.bucket === a.bucket);
          if (existing) {
            existing.amount += amount;
          } else {
            items.push({
              bucket: a.bucket,
              label: a.label,
              amount,
              reason: "Proportional distribution",
              priority: a.status === "above" ? "low" : "medium",
            });
          }
          remainingCash -= amount;
        }
      }
    }
  }

  const totalDeployed = availableCash - remainingCash;
  const sortedItems = items.sort((a, b) => b.amount - a.amount);

  let summary = "";
  if (sortedItems.length > 0) {
    summary = `Deploy ₹${fmt(availableCash || 0)} across ${sortedItems.length} buckets. ${sortedItems[0]?.label} gets ₹${fmt(sortedItems[0]?.amount || 0)} (priority rebalance).`;
  } else {
    summary = "No deployment needed.";
  }

  return {
    availableCash,
    currency: deployment.preference.baseCurrency,
    items: sortedItems,
    totalDeployed,
    remainder: remainingCash,
    summary,
  };
}
