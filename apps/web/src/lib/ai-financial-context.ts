import "server-only";

import {
  getPortfolioOverview,
  getCurrentFixedDeposits,
  getGlobalEquityPortfolio,
} from "@portfolio/api/portfolio-queries";
import { buildMortgageModel, comparePayments } from "@portfolio/api/mortgage-calculations";
import {
  getMortgageBankPayments,
  getMortgageRecord,
  getMortgageSnapshots,
} from "@portfolio/api/mortgage-queries";
import { getFirePlan } from "@portfolio/api/fire-queries";
import { getHouseholdDashboard } from "@portfolio/api/household-queries";
import { getCashFlowDashboard } from "@portfolio/api/cash-flow-queries";
import { getSalaryPayslips } from "@portfolio/api/salary-queries";
import { getVerifiedReturnsEngine } from "@portfolio/api/verified-returns-queries";

export async function getChatOverview(userId: string) {
  const overview = await getPortfolioOverview(userId);
  return {
    source: "/dashboard",
    retrievedAt: new Date().toISOString(),
    valuationAsOf: overview.asOf,
    baseCurrency: overview.preference.baseCurrency,
    totals: overview.totals,
    allocations: overview.allocation,
    liquidAllocations: overview.liquidAllocation,
    assets: overview.assets.map(
      ({ name, category, nativeValue, currency, baseValue, isLiquid, asOf }) => ({
        name,
        category,
        nativeValue,
        currency,
        baseValue,
        isLiquid,
        asOf,
      }),
    ),
    indianEquityFunds: overview.equityBreakdown,
    unconvertedCurrencies: overview.unconvertedCurrencies,
  };
}

export const sections = [
  "fire",
  "household",
  "personal_cash_flow",
  "joint_cash_flow",
  "fixed_deposits",
  "salary",
  "verified_returns",
  "global_equity",
  "mortgage",
] as const;
export type ChatSection = (typeof sections)[number];

export async function getChatSection(userId: string, section: ChatSection) {
  switch (section) {
    case "fire": {
      const plan = await getFirePlan(userId);
      return {
        source: "/dashboard/fire",
        retrievedAt: new Date().toISOString(),
        configured: plan.configured,
        currency: plan.baseCurrency,
        currentInvestableAssets: plan.currentInvestableAssets,
        familyNetWorth: plan.familyNetWorth,
        unconvertedCurrencies: plan.unconvertedCurrencies,
        ...(plan.configured
          ? {
              profile: plan.profile,
              monthlyExpenses: plan.monthlyExpenses,
              scenarios: plan.results.map(
                ({
                  name,
                  retirementYear,
                  requiredCorpus,
                  gap,
                  progress,
                  successProbability,
                  annualExpensesAtRetirement,
                  annualIncomeAtRetirement,
                }) => ({
                  name,
                  retirementYear,
                  requiredCorpus,
                  gap,
                  progress,
                  successProbability,
                  annualExpensesAtRetirement,
                  annualIncomeAtRetirement,
                }),
              ),
            }
          : {}),
      };
    }
    case "household": {
      const data = await getHouseholdDashboard(userId);
      return {
        source: "/dashboard/household",
        retrievedAt: new Date().toISOString(),
        configured: data.configured,
        currency: data.currency,
        budget: data.budget,
        scenarios: data.scenarios.map(
          ({ name, grossExpenses, refunds, netMonthly, annualNet }) => ({
            name,
            grossExpenses,
            refunds,
            netMonthly,
            annualNet,
          }),
        ),
      };
    }
    case "personal_cash_flow":
    case "joint_cash_flow": {
      const data = await getCashFlowDashboard(
        userId,
        section === "personal_cash_flow" ? "personal" : "joint",
      );
      return {
        source:
          section === "personal_cash_flow"
            ? "/dashboard/cash-flow/personal"
            : "/dashboard/cash-flow/household",
        retrievedAt: new Date().toISOString(),
        currency: data.currency,
        configured: data.configured,
        metrics: data.metrics,
        monthly: data.monthly.slice(-24),
        categories: data.categories,
        accounts: data.accounts,
      };
    }
    case "fixed_deposits":
      return {
        source: "/dashboard/fixed-deposits",
        retrievedAt: new Date().toISOString(),
        deposits: await getCurrentFixedDeposits(userId),
      };
    case "salary": {
      const payslips = await getSalaryPayslips(userId);
      return {
        source: "/dashboard/salary",
        retrievedAt: new Date().toISOString(),
        payslips: payslips.map(
          ({ employerName, payPeriod, currency, grossPay, netPay, wageTax, validationStatus }) => ({
            employerName,
            payPeriod,
            currency,
            grossPay,
            netPay,
            wageTax,
            validationStatus,
          }),
        ),
      };
    }
    case "verified_returns": {
      const data = await getVerifiedReturnsEngine(userId);
      return {
        source: "/dashboard/returns",
        retrievedAt: new Date().toISOString(),
        summary: data.summary,
        evidence: data.evidence,
      };
    }
    case "mortgage": {
      const record = await getMortgageRecord(userId);
      if (!record) {
        return {
          source: "/dashboard/mortgage",
          retrievedAt: new Date().toISOString(),
          configured: false,
          note: "No mortgage overview has been imported or saved yet.",
        };
      }
      const [bank, snapshots] = await Promise.all([
        getMortgageBankPayments(userId, record.settings.terms.monthlyPayment),
        getMortgageSnapshots(userId, record.loanId),
      ]);
      const model = buildMortgageModel(record.settings);
      const reconciliation = comparePayments(
        model.history,
        bank.payments,
        bank.coverageStart,
        bank.coverageEnd,
      );
      return {
        source: "/dashboard/mortgage",
        retrievedAt: new Date().toISOString(),
        configured: true,
        currency: "EUR",
        loan: {
          lender: record.lender,
          loanNumber: record.loanNumber,
          repaymentType: record.repaymentType,
          nhg: record.nhg,
          energyLabel: record.energyLabel,
          sustainabilityDiscount: record.sustainabilityDiscount,
          bouwdepotOriginal: record.bouwdepotOriginal,
          bouwdepotRemaining: record.bouwdepotRemaining,
          dataSource: record.source,
          validationStatus: record.validationStatus,
          validationIssues: record.validationIssues,
        },
        terms: record.settings.terms,
        rateBasis: record.settings.rateBasis,
        appreciation: record.settings.appreciation,
        extraRepayments: record.settings.extras,
        summary: model.summary,
        insights: model.insights.map(({ title, text }) => ({ title, text })),
        rateSensitivity: model.sensitivity,
        yearly: model.yearly,
        upcomingSchedule: model.baseline.rows.slice(0, 24),
        snapshots,
        bankReconciliation: {
          coverageStart: bank.coverageStart,
          coverageEnd: bank.coverageEnd,
          months: reconciliation.map(({ date, scheduled, actual, status }) => ({
            date,
            scheduled,
            actual,
            status,
          })),
        },
      };
    }
    case "global_equity": {
      const data = await getGlobalEquityPortfolio(userId);
      return {
        source: "/dashboard/eur",
        retrievedAt: new Date().toISOString(),
        holdings: data.holdings.map(({ name, marketValue, quantity }) => ({
          name,
          marketValue,
          currency: "EUR",
          quantity,
        })),
      };
    }
  }
}
