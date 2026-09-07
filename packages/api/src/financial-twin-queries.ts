import "server-only";

import { calculateFirePlan } from "./fire-engine";
import { resolveConversionRate } from "./currency-conversion";
import {
  calculateMonthlyCapacity,
  readinessScore,
  scaleContributionPlan,
  summarizeMonthlyIncome,
  type TwinEvidenceGrade,
} from "./financial-twin-calculations";
import { getCapitalDeploymentEngine } from "./capital-deployment-queries";
import { getFirePlan } from "./fire-queries";
import { getHouseholdDashboard } from "./household-queries";
import { getIncomeTaxReturns } from "./income-tax-queries";
import { getNetherlandsTaxAssessments } from "./netherlands-tax-queries";
import { getLatestExchangeRates } from "./portfolio-queries";
import { getSalaryPayslips } from "./salary-queries";
import { getVerifiedReturnsEngine } from "./verified-returns-queries";

type TwinAction = {
  key: string;
  domain: "data" | "cashflow" | "allocation" | "fire" | "tax" | "performance";
  severity: "attention" | "opportunity" | "info";
  title: string;
  description: string;
  amount: number | null;
  confidence: TwinEvidenceGrade;
  href: string;
};

function maxDate(values: Array<Date | string | null | undefined>) {
  return (
    values
      .filter((value): value is Date | string => Boolean(value))
      .map((value) => new Date(value))
      .sort((left, right) => right.getTime() - left.getTime())[0] ?? null
  );
}

export async function getFinancialTwin(userId: string) {
  const [capital, household, fire, returns, payslips, indiaTax, dutchTax, rates] =
    await Promise.all([
      getCapitalDeploymentEngine(userId),
      getHouseholdDashboard(userId),
      getFirePlan(userId),
      getVerifiedReturnsEngine(userId),
      getSalaryPayslips(userId),
      getIncomeTaxReturns(userId),
      getNetherlandsTaxAssessments(userId),
      getLatestExchangeRates(userId, "reference"),
    ]);

  const baseCurrency = capital.preference.baseCurrency;
  const missingCurrencies = new Set(capital.missingCurrencies);
  const convert = (amount: number, currency: string) => {
    const rate = resolveConversionRate(currency, baseCurrency, rates);
    if (rate === null) {
      missingCurrencies.add(currency);
      return null;
    }
    return amount * rate;
  };

  const asOf = new Date();
  const incomeEvidence = summarizeMonthlyIncome(payslips, asOf, (payslip) =>
    convert(payslip.netPay, payslip.currency),
  );
  const monthlyNetIncome = incomeEvidence.ready ? incomeEvidence.monthlyNetIncome : [];
  const householdCost = household.configured
    ? convert(household.metrics.netMonthly, household.currency)
    : null;
  const capacity = calculateMonthlyCapacity({
    monthlyNetIncome,
    monthlyHouseholdCost: householdCost,
    policyMonthlyDeployment: capital.summary.monthlyDeploymentBase,
    fireAnnualSavings: fire.configured ? fire.profile.annualSavings : null,
  });
  const contributionPlan = scaleContributionPlan(
    capital.allocation,
    capacity.supportedMonthlyDeployment,
  );

  const observedFireResults =
    fire.configured && capacity.observedMonthlySurplus !== null
      ? calculateFirePlan({
          currentYear: asOf.getUTCFullYear(),
          currentInvestableAssets: fire.currentInvestableAssets,
          profile: { ...fire.profile, annualSavings: capacity.observedMonthlySurplus * 12 },
          expenses: fire.expenses.flatMap((expense) =>
            expense.baseMonthlyAmount === null
              ? []
              : [{ ...expense, monthlyAmount: expense.baseMonthlyAmount }],
          ),
          oneTimeCosts: fire.oneTimeCosts.flatMap((cost) =>
            cost.baseAmount === null ? [] : [{ ...cost, amount: cost.baseAmount }],
          ),
          incomeStreams: fire.incomeStreams.flatMap((income) =>
            income.baseAnnualAmount === null
              ? []
              : [{ ...income, annualAmount: income.baseAnnualAmount }],
          ),
          scenarios: fire.scenarios,
        })
      : null;
  const primaryFire = fire.configured ? (fire.results[0] ?? null) : null;
  const observedPrimaryFire = observedFireResults?.[0] ?? null;

  const latestIndiaTax = indiaTax.at(-1) ?? null;
  const latestDutchTax = dutchTax.at(-1) ?? null;
  const actions: TwinAction[] = [];

  if (capacity.observedMonthlySurplus === null) {
    actions.push({
      key: "cashflow-evidence",
      domain: "cashflow",
      severity: "attention",
      title: "Complete the monthly cash-flow evidence",
      description:
        "Capacity requires at least three validated months within the last six completed calendar months, including the previous month, no unresolved payroll months in that window, and a household budget with available FX.",
      amount: null,
      confidence: "exact",
      href: !incomeEvidence.ready ? "/dashboard/salary" : "/dashboard/household",
    });
  } else if (capacity.observedMonthlySurplus < 0) {
    actions.push({
      key: "monthly-deficit",
      domain: "cashflow",
      severity: "attention",
      title: "Review the monthly funding gap",
      description:
        "The recurring household budget exceeds evidenced owner income. Monthly deployment is zero; the deficit remains visible in the FIRE sensitivity.",
      amount: Math.abs(capacity.observedMonthlySurplus),
      confidence: "derived",
      href: "/dashboard/household",
    });
  } else if (!capital.policy.configured || !capital.targetsConfigured) {
    actions.push({
      key: "deployment-policy",
      domain: "allocation",
      severity: "attention",
      title: "Turn observed surplus into an allocation rule",
      description:
        "The surplus is measurable, but no complete user-owned deployment policy exists. Recommendations remain disabled until target ranges total 100%.",
      amount: capacity.observedMonthlySurplus,
      confidence: capacity.evidenceGrade,
      href: "/dashboard/deployment",
    });
  } else if (
    capacity.supportedMonthlyDeployment !== null &&
    capacity.supportedMonthlyDeployment > 0
  ) {
    actions.push({
      key: "monthly-deployment",
      domain: "allocation",
      severity: "opportunity",
      title: "Fund the next contribution-only allocation",
      description: contributionPlan.length
        ? `Direct the supported monthly amount to ${contributionPlan.map((item) => item.label).join(", ")} according to the saved policy; no sale is required.`
        : "The saved policy supports a monthly deployment, but no underweight destination currently needs funding.",
      amount: capacity.supportedMonthlyDeployment,
      confidence: "derived",
      href: "/dashboard/deployment",
    });
  }

  // The twin's contribution plan is capacity-capped. Do not repeat uncapped
  // policy contribution amounts as independent funding recommendations.
  const capitalActions = capital.actions.filter(
    (action) =>
      !action.key.startsWith("underweight-") &&
      !(
        action.key === "configure-targets" &&
        actions.some((item) => item.key === "deployment-policy")
      ),
  );
  for (const action of capitalActions.slice(0, 3)) {
    actions.push({
      key: `capital-${action.key}`,
      domain: action.key === "fd-due" ? "cashflow" : "allocation",
      severity: action.severity,
      title: action.title,
      description: action.description,
      amount: action.amount,
      confidence: action.confidence === "inferred" ? "limited" : action.confidence,
      href: "/dashboard/deployment",
    });
  }

  if (
    capacity.fireSavingsDifference !== null &&
    capacity.firePlannedMonthlySavings !== null &&
    capacity.firePlannedMonthlySavings > 0 &&
    capacity.fireSavingsDifference < -Math.max(1, capacity.firePlannedMonthlySavings * 0.05)
  ) {
    actions.push({
      key: "fire-savings-gap",
      domain: "fire",
      severity: "attention",
      title: "Reconcile the FIRE savings assumption",
      description:
        "The configured FIRE contribution is above the owner-only surplus evidenced by imported pay and the household budget. Confirm partner contributions or lower the assumption.",
      amount: Math.abs(capacity.fireSavingsDifference),
      confidence: capacity.evidenceGrade,
      href: "/dashboard/fire",
    });
  }
  if (latestIndiaTax && latestIndiaTax.balanceTaxPayable > 0) {
    actions.push({
      key: "india-tax-payable",
      domain: "tax",
      severity: "attention",
      title: "Indian return records a balance payable",
      description: `${latestIndiaTax.assessmentYearLabel} is the latest imported filing. Confirm payment status outside Selvam.`,
      amount: convert(latestIndiaTax.balanceTaxPayable, "INR"),
      confidence: latestIndiaTax.validationStatus === "verified" ? "reconciled" : "limited",
      href: "/dashboard/tax",
    });
  }
  if (latestDutchTax?.outcomeType === "payable" && latestDutchTax.settlementAmount > 0) {
    actions.push({
      key: "dutch-tax-payable",
      domain: "tax",
      severity: "attention",
      title: "Dutch final assessment records an amount payable",
      description: `${latestDutchTax.taxYear} is the latest imported final assessment. Confirm payment status outside Selvam.`,
      amount: convert(latestDutchTax.settlementAmount, "EUR"),
      confidence: latestDutchTax.validationStatus === "verified" ? "reconciled" : "limited",
      href: "/dashboard/tax/netherlands",
    });
  }
  if (returns.summary.verifiedValueCoverage < 0.95 && returns.summary.excludedClosingValue > 0) {
    actions.push({
      key: "return-coverage",
      domain: "performance",
      severity: "attention",
      title: "Close the verified-return history gap",
      description:
        "Some current Indian value lacks matching opening trade units. Import earlier tradebooks before relying on the excluded instruments' returns.",
      amount: convert(returns.summary.excludedClosingValue, "INR"),
      confidence: "reconciled",
      href: "/dashboard/returns",
    });
  }

  if (missingCurrencies.size > 0) {
    actions.unshift({
      key: "missing-fx",
      domain: "data",
      severity: "attention",
      title: "Complete the currency bridge",
      description: `Stored FX rates are missing for ${[...missingCurrencies].join(", ")}; affected amounts are excluded from connected decisions.`,
      amount: null,
      confidence: "exact",
      href: "/dashboard/settings",
    });
  }

  const readiness = readinessScore([
    incomeEvidence.ready,
    household.configured,
    capital.policy.configured && capital.targetsConfigured,
    fire.configured,
    returns.scopes.length > 0,
    indiaTax.length > 0 || dutchTax.length > 0,
    missingCurrencies.size === 0,
  ]);
  const evidence = [
    {
      key: "income",
      label: "Recurring take-home",
      grade: incomeEvidence.ready ? ("derived" as const) : ("limited" as const),
      status: incomeEvidence.ready ? ("ready" as const) : ("limited" as const),
      value: `${incomeEvidence.incomeMonths}/6 validated completed months`,
      detail: `Monthly totals combine employers before taking the median. ${incomeEvidence.missingMonths} missing and ${incomeEvidence.invalidMonths} unresolved months in the last six completed calendar months. Current-month payroll is excluded. This is a budget-based estimate, not bank-reconciled cash flow.`,
      href: "/dashboard/salary",
    },
    {
      key: "household",
      label: "Household run rate",
      grade: household.configured ? ("exact" as const) : ("limited" as const),
      status: household.configured ? ("ready" as const) : ("blocked" as const),
      value: household.configured ? `${household.budget.length} budget lines` : "Not configured",
      detail:
        "Current gross expenses minus recurring refunds; one-time setup purchases do not reduce recurring capacity.",
      href: "/dashboard/household",
    },
    {
      key: "allocation",
      label: "Deployment policy",
      grade: capital.targetsConfigured ? ("derived" as const) : ("limited" as const),
      status:
        capital.policy.configured && capital.targetsConfigured
          ? ("ready" as const)
          : ("blocked" as const),
      value: capital.targetsConfigured
        ? `${capital.allocation.length} allocation buckets`
        : "Incomplete",
      detail:
        "Current holdings, broker cash and fixed-deposit maturities are connected to user-owned target ranges.",
      href: "/dashboard/deployment",
    },
    {
      key: "returns",
      label: "Return evidence",
      grade:
        returns.scopes.length > 0 &&
        returns.scopes.every(
          (scope) =>
            scope.evidenceGrade === "reconciled" && scope.metrics.moneyWeightedReturn !== null,
        )
          ? ("reconciled" as const)
          : ("limited" as const),
      status: returns.scopes.length > 0 ? ("ready" as const) : ("blocked" as const),
      value: returns.scopes.some((scope) => scope.id === "zerodha")
        ? `${(returns.summary.verifiedValueCoverage * 100).toFixed(2)}% Indian value coverage`
        : returns.scopes.length > 0
          ? "Derived global return evidence"
          : "No return evidence",
      detail:
        "Only unit-reconciled Zerodha positions enter verified return calculations; Degiro remains clearly labelled derived.",
      href: "/dashboard/returns",
    },
    {
      key: "fire",
      label: "FIRE projection",
      grade: fire.configured ? ("derived" as const) : ("limited" as const),
      status: fire.configured ? ("ready" as const) : ("blocked" as const),
      value: fire.configured
        ? `${fire.results.length} scenario${fire.results.length === 1 ? "" : "s"}`
        : "Not configured",
      detail:
        "Observed surplus is run as a separate owner-only scenario. Reallocating existing assets never creates a contribution or reduces the current gap.",
      href: "/dashboard/fire",
    },
    {
      key: "tax",
      label: "Imported tax history",
      grade:
        [...indiaTax, ...dutchTax].length > 0 &&
        [...indiaTax, ...dutchTax].every((record) => record.validationStatus === "verified")
          ? ("reconciled" as const)
          : ("limited" as const),
      status:
        indiaTax.length > 0 || dutchTax.length > 0 ? ("ready" as const) : ("blocked" as const),
      value: `${indiaTax.length + dutchTax.length} annual record${indiaTax.length + dutchTax.length === 1 ? "" : "s"}`,
      detail:
        "Indian records are filed returns; Dutch records are final assessments. Arithmetic reconciliation does not confirm payment or receipt, and these records are not future tax forecasts.",
      href: latestDutchTax ? "/dashboard/tax/netherlands" : "/dashboard/tax",
    },
  ];

  return {
    baseCurrency,
    asOf: maxDate([
      capital.asOf,
      payslips.at(-1)?.payPeriod,
      latestDutchTax?.assessmentDate,
      latestIndiaTax?.sourceCreatedOn,
    ]),
    capacity,
    incomeEvidence,
    household: {
      configured: household.configured,
      currency: household.currency,
      grossMonthly: household.configured
        ? convert(household.metrics.grossExpenses, household.currency)
        : null,
      refundsMonthly: household.configured
        ? convert(household.metrics.refunds, household.currency)
        : null,
      netMonthly: householdCost,
    },
    contributionPlan,
    capital: {
      investmentTotal: capital.summary.investmentTotal,
      availableCapital: capital.summary.availableCapital,
      scheduledLiquidity: capital.summary.scheduledLiquidity,
      allocation: capital.allocation,
      asOf: capital.asOf,
    },
    fire: {
      configured: fire.configured,
      currentInvestableAssets: fire.currentInvestableAssets,
      primary: primaryFire,
      observedPrimary: observedPrimaryFire,
      configuredAnnualSavings: fire.configured ? fire.profile.annualSavings : null,
      observedAnnualSavings:
        capacity.observedMonthlySurplus === null ? null : capacity.observedMonthlySurplus * 12,
    },
    returns: {
      verifiedValueCoverage: returns.summary.verifiedValueCoverage,
      zerodhaXirr: returns.summary.zerodhaXirr,
      degiroXirr: returns.summary.degiroXirr,
      combinedReturnAvailable: returns.summary.combinedReturnAvailable,
    },
    taxes: { latestIndia: latestIndiaTax, latestDutch: latestDutchTax },
    readiness,
    evidence,
    actions: actions
      .sort((left, right) => {
        const rank = { attention: 0, opportunity: 1, info: 2 } as const;
        return rank[left.severity] - rank[right.severity];
      })
      .slice(0, 8),
    missingCurrencies: [...missingCurrencies],
  };
}

export async function getFinancialTwinExport(userId: string) {
  return getFinancialTwin(userId);
}
