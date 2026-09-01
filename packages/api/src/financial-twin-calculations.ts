export type TwinEvidenceGrade = "exact" | "reconciled" | "derived" | "limited";

export type MonthlyCapacityInput = {
  monthlyNetIncome: number[];
  monthlyHouseholdCost: number | null;
  policyMonthlyDeployment: number;
  fireAnnualSavings: number | null;
};

export type MonthlyCapacity = {
  incomeMonths: number;
  typicalNetIncome: number | null;
  monthlyHouseholdCost: number | null;
  observedMonthlySurplus: number | null;
  policyMonthlyDeployment: number;
  supportedMonthlyDeployment: number | null;
  retainedMonthlyCash: number | null;
  firePlannedMonthlySavings: number | null;
  fireSavingsDifference: number | null;
  evidenceGrade: TwinEvidenceGrade;
};

function finiteNonNegative(values: number[]) {
  return values.filter((value) => Number.isFinite(value) && value >= 0);
}

export function median(values: number[]) {
  const sorted = finiteNonNegative(values).sort((left, right) => left - right);
  if (sorted.length === 0) return null;
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle]!;
  return (sorted[middle - 1]! + sorted[middle]!) / 2;
}

export function calculateMonthlyCapacity(input: MonthlyCapacityInput): MonthlyCapacity {
  const income = finiteNonNegative(input.monthlyNetIncome);
  const typicalNetIncome = median(income);
  const householdCost =
    input.monthlyHouseholdCost === null || !Number.isFinite(input.monthlyHouseholdCost)
      ? null
      : Math.max(0, input.monthlyHouseholdCost);
  const observedMonthlySurplus =
    typicalNetIncome === null || householdCost === null
      ? null
      : Math.max(0, typicalNetIncome - householdCost);
  const policyMonthlyDeployment = Math.max(0, input.policyMonthlyDeployment);
  const supportedMonthlyDeployment =
    observedMonthlySurplus === null
      ? null
      : policyMonthlyDeployment > 0
        ? Math.min(observedMonthlySurplus, policyMonthlyDeployment)
        : 0;
  const retainedMonthlyCash =
    observedMonthlySurplus === null || supportedMonthlyDeployment === null
      ? null
      : Math.max(0, observedMonthlySurplus - supportedMonthlyDeployment);
  const firePlannedMonthlySavings =
    input.fireAnnualSavings === null || !Number.isFinite(input.fireAnnualSavings)
      ? null
      : Math.max(0, input.fireAnnualSavings) / 12;

  return {
    incomeMonths: income.length,
    typicalNetIncome,
    monthlyHouseholdCost: householdCost,
    observedMonthlySurplus,
    policyMonthlyDeployment,
    supportedMonthlyDeployment,
    retainedMonthlyCash,
    firePlannedMonthlySavings,
    fireSavingsDifference:
      observedMonthlySurplus === null || firePlannedMonthlySavings === null
        ? null
        : observedMonthlySurplus - firePlannedMonthlySavings,
    evidenceGrade:
      typicalNetIncome === null || householdCost === null
        ? "limited"
        : income.length >= 6
          ? "reconciled"
          : "derived",
  };
}

export function scaleContributionPlan(
  rows: Array<{ bucket: string; label: string; nextContribution: number }>,
  supportedMonthlyDeployment: number | null,
) {
  const available = Math.max(0, supportedMonthlyDeployment ?? 0);
  const planned = rows.reduce((sum, row) => sum + Math.max(0, row.nextContribution), 0);
  if (available === 0 || planned === 0) return [];
  return rows
    .filter((row) => row.nextContribution > 0)
    .map((row) => ({
      bucket: row.bucket,
      label: row.label,
      amount: (row.nextContribution / planned) * available,
    }))
    .sort((left, right) => right.amount - left.amount);
}

export function readinessScore(checks: boolean[]) {
  const ready = checks.filter(Boolean).length;
  return { ready, total: checks.length, ratio: checks.length === 0 ? 0 : ready / checks.length };
}
