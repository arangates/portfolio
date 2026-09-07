export type TwinEvidenceGrade = "exact" | "reconciled" | "derived" | "limited";

/** Input rows must already contain only the latest revision per employer and period. */
export function summarizeMonthlyIncome<
  Row extends { payPeriod: string; netPay: number | null; validationStatus: string },
>(rows: Row[], asOf: Date, convert: (row: Row) => number | null = (row) => row.netPay) {
  const currentMonth = asOf.getUTCFullYear() * 12 + asOf.getUTCMonth();
  const months = new Map<number, { total: number; valid: boolean }>();
  for (const row of rows) {
    const date = new Date(row.payPeriod);
    if (!Number.isFinite(date.getTime())) continue;
    const month = date.getUTCFullYear() * 12 + date.getUTCMonth();
    // A partial current month is not comparable with completed payroll months.
    if (month < currentMonth - 6 || month >= currentMonth) continue;
    const entry = months.get(month) ?? { total: 0, valid: true };
    const netPay = convert(row);
    if (row.validationStatus !== "verified" || netPay === null || !Number.isFinite(netPay)) {
      entry.valid = false;
    } else {
      entry.total += netPay;
    }
    months.set(month, entry);
  }
  const validMonths = [...months.entries()]
    .filter(([, entry]) => entry.valid)
    .sort(([left], [right]) => left - right);
  const invalidMonths = [...months.values()].filter((entry) => !entry.valid).length;
  return {
    monthlyNetIncome: validMonths.map(([, entry]) => entry.total),
    incomeMonths: validMonths.length,
    missingMonths: 6 - months.size,
    invalidMonths,
    ready:
      validMonths.length >= 3 &&
      months.get(currentMonth - 1)?.valid === true &&
      invalidMonths === 0,
  };
}

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

export function median(values: number[]) {
  const sorted = values.filter(Number.isFinite).sort((left, right) => left - right);
  if (sorted.length === 0) return null;
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle]!;
  return (sorted[middle - 1]! + sorted[middle]!) / 2;
}

export function calculateMonthlyCapacity(input: MonthlyCapacityInput): MonthlyCapacity {
  const income = input.monthlyNetIncome.filter(Number.isFinite);
  const typicalNetIncome = median(income);
  const householdCost =
    input.monthlyHouseholdCost === null || !Number.isFinite(input.monthlyHouseholdCost)
      ? null
      : input.monthlyHouseholdCost;
  const observedMonthlySurplus =
    typicalNetIncome === null || householdCost === null ? null : typicalNetIncome - householdCost;
  const policyMonthlyDeployment = Number.isFinite(input.policyMonthlyDeployment)
    ? Math.max(0, input.policyMonthlyDeployment)
    : 0;
  const supportedMonthlyDeployment =
    observedMonthlySurplus === null
      ? null
      : policyMonthlyDeployment > 0
        ? Math.min(Math.max(0, observedMonthlySurplus), policyMonthlyDeployment)
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
    evidenceGrade: typicalNetIncome === null || householdCost === null ? "limited" : "derived",
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
