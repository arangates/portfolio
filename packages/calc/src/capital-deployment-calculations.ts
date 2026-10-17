export const deploymentBuckets = [
  "indian_equity",
  "global_equity",
  "fixed_income",
  "hybrid",
  "cash",
  "other_marketable",
] as const;

export type DeploymentBucket = (typeof deploymentBuckets)[number];

export const deploymentBucketLabels: Record<DeploymentBucket, string> = {
  indian_equity: "Indian equity",
  global_equity: "Global equity",
  fixed_income: "Debt & fixed deposits",
  hybrid: "Hybrid funds",
  cash: "Cash",
  other_marketable: "Other marketable",
};

export function classifyIndianHolding(category: string): DeploymentBucket {
  const value = category.toLowerCase();
  if (value.includes("debt") || value.includes("liquid") || value.includes("duration")) {
    return "fixed_income";
  }
  if (value.includes("hybrid") || value.includes("balanced advantage")) return "hybrid";
  if (value.includes("equity") || value.includes("index")) return "indian_equity";
  return "other_marketable";
}

export function fixedDepositMaturityValue(input: {
  principal: number;
  interestRate: number;
  startDate: string;
  maturityDate: string;
  compoundingPerYear: number;
}) {
  const start = new Date(`${input.startDate}T00:00:00Z`).getTime();
  const maturity = new Date(`${input.maturityDate}T00:00:00Z`).getTime();
  const years = Math.max(0, (maturity - start) / (365.2425 * 24 * 60 * 60 * 1000));
  const compounds = Math.max(1, input.compoundingPerYear);
  return input.principal * (1 + input.interestRate / compounds) ** (compounds * years);
}

export function allocateNextContribution(
  current: Record<DeploymentBucket, number>,
  targets: Record<DeploymentBucket, number>,
  amount: number,
) {
  const total = deploymentBuckets.reduce((sum, bucket) => sum + current[bucket], 0);
  const deficits = deploymentBuckets.map((bucket) => ({
    bucket,
    value: Math.max(targets[bucket] * total - current[bucket], 0),
  }));
  const totalDeficit = deficits.reduce((sum, item) => sum + item.value, 0);
  const denominator =
    totalDeficit > 0
      ? totalDeficit
      : deploymentBuckets.reduce((sum, bucket) => sum + targets[bucket], 0);

  return Object.fromEntries(
    deploymentBuckets.map((bucket) => {
      const deficit = deficits.find((item) => item.bucket === bucket)?.value ?? 0;
      const weight =
        denominator > 0 ? (totalDeficit > 0 ? deficit : targets[bucket]) / denominator : 0;
      return [bucket, Math.max(amount, 0) * weight];
    }),
  ) as Record<DeploymentBucket, number>;
}

export function differenceInCalendarDays(left: Date, right: Date) {
  const leftUtc = Date.UTC(left.getUTCFullYear(), left.getUTCMonth(), left.getUTCDate());
  const rightUtc = Date.UTC(right.getUTCFullYear(), right.getUTCMonth(), right.getUTCDate());
  return Math.round((leftUtc - rightUtc) / 86_400_000);
}

export function evidenceGradeRank(grade: "reconciled" | "exact" | "derived" | "inferred") {
  return { reconciled: 4, exact: 3, derived: 2, inferred: 1 }[grade];
}
