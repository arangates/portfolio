import { latestSnapshotRevisions } from "./insight-calculations";
import "server-only";
import {
  db,
  ledgerEntry,
  instrument,
  portfolioSource,
  importBatch,
  fireOneTimeCost,
  fireIncomeStream,
  fireExpense,
  fireProfile,
} from "@portfolio/db";
import { and, eq, isNull, gte, lt } from "drizzle-orm";
import { getCurrentFixedDeposits, getPortfolioPreference } from "./portfolio-queries";
import { getHouseholdDashboard } from "./household-queries";
import { getSalaryPayslips } from "./salary-queries";
import { getIncomeTaxReturns } from "./income-tax-queries";
import { getNetherlandsTaxAssessments } from "./netherlands-tax-queries";
import { getSnapshotEvidence } from "./snapshot-insights-queries";
import {
  calendarDay,
  contractEvents,
  validCalendarMonth,
  type FinancialEvent,
} from "./calendar-calculations";

export async function getFinancialCalendar(userId: string, requestedMonth?: string) {
  const preference = await getPortfolioPreference(userId);
  const today = calendarDay(new Date(), preference.timeZone);
  const month = validCalendarMonth(requestedMonth, today.slice(0, 7));
  const [y, m] = month.split("-").map(Number);
  const start = new Date(Date.UTC(y!, m! - 1, 0)),
    end = new Date(Date.UTC(y!, m!, 2));
  const [
    deposits,
    household,
    salary,
    india,
    dutch,
    snapshots,
    trades,
    imports,
    goals,
    incomes,
    expenses,
    profiles,
  ] = await Promise.all([
    getCurrentFixedDeposits(userId),
    getHouseholdDashboard(userId),
    getSalaryPayslips(userId),
    getIncomeTaxReturns(userId),
    getNetherlandsTaxAssessments(userId),
    getSnapshotEvidence(userId),
    db
      .select({
        id: ledgerEntry.id,
        date: ledgerEntry.occurredAt,
        type: ledgerEntry.entryType,
        provider: portfolioSource.provider,
        name: instrument.name,
        description: ledgerEntry.description,
        amount: ledgerEntry.netAmount,
        currency: ledgerEntry.currency,
      })
      .from(ledgerEntry)
      .innerJoin(
        portfolioSource,
        and(eq(portfolioSource.id, ledgerEntry.sourceId), eq(portfolioSource.userId, userId)),
      )
      .leftJoin(
        instrument,
        and(eq(instrument.id, ledgerEntry.instrumentId), eq(instrument.userId, userId)),
      )
      .where(
        and(
          eq(ledgerEntry.userId, userId),
          gte(ledgerEntry.occurredAt, start),
          lt(ledgerEntry.occurredAt, end),
        ),
      ),
    db
      .select({
        id: importBatch.id,
        date: importBatch.createdAt,
        kind: importBatch.kind,
        status: importBatch.status,
      })
      .from(importBatch)
      .where(
        and(
          eq(importBatch.userId, userId),
          gte(importBatch.createdAt, start),
          lt(importBatch.createdAt, end),
        ),
      ),
    db
      .select()
      .from(fireOneTimeCost)
      .where(and(eq(fireOneTimeCost.userId, userId), isNull(fireOneTimeCost.archivedAt))),
    db
      .select()
      .from(fireIncomeStream)
      .where(and(eq(fireIncomeStream.userId, userId), isNull(fireIncomeStream.archivedAt))),
    db
      .select()
      .from(fireExpense)
      .where(and(eq(fireExpense.userId, userId), isNull(fireExpense.archivedAt))),
    db.select().from(fireProfile).where(eq(fireProfile.userId, userId)),
  ]);
  const events: FinancialEvent[] = [];
  const add = (event: FinancialEvent) => {
    if (
      event.precision === "year" ? event.date === month.slice(0, 4) : event.date.startsWith(month)
    )
      events.push(event);
  };
  for (const d of deposits) {
    add({
      id: `fd-start-${d.id}`,
      title: `Deposit starts · ${d.bank}`,
      date: d.startDate,
      precision: "day",
      category: "Deposits",
      amount: d.principal,
      currency: d.currency,
      href: "/dashboard/fixed-deposits",
      detail: "Recorded start date and principal from the latest deposit snapshot.",
      planned: false,
    });
    if (d.status === "active")
      add({
        id: `fd-end-${d.id}`,
        title: `Deposit matures · ${d.bank}`,
        date: d.maturityDate,
        precision: "day",
        category: "Deposits",
        amount: d.principal,
        currency: d.currency,
        href: "/dashboard/fixed-deposits",
        detail:
          "Scheduled maturity. Amount shown is principal, not projected proceeds. Confirm credit or renewal.",
        planned: true,
      });
  }
  events.push(
    ...contractEvents(month, household.contracts, household.contractHistory, household.currency),
  );
  for (const p of household.oneTimeExpenses)
    if (p.purchasedOn)
      add({
        id: `purchase-${p.id}`,
        title: p.name,
        date: p.purchasedOn,
        precision: "day",
        category: "Purchases",
        amount: p.amount,
        currency: p.currency,
        href: "/dashboard/household",
        detail: "Recorded purchase date.",
        planned: false,
      });
  for (const p of salary)
    add({
      id: `salary-${p.id}`,
      title: `Payslip · ${p.employerName}`,
      date: p.payPeriod.slice(0, 7),
      precision: "month",
      category: "Salary",
      amount: p.netPay,
      currency: p.currency,
      href: `/dashboard/salary/${p.id}`,
      detail: `Payroll period, not a verified bank deposit date. Validation: ${p.validationStatus}.`,
      planned: false,
    });
  for (const tax of india)
    if (tax.sourceCreatedOn)
      add({
        id: `itr-${tax.id}`,
        title: `Indian return · ${tax.assessmentYearLabel}`,
        date: tax.sourceCreatedOn,
        precision: "day",
        category: "Tax",
        amount: null,
        currency: null,
        href: "/dashboard/tax",
        detail:
          "Source-created date of the filed return, not a filing deadline or proof of payment.",
        planned: false,
      });
  for (const tax of dutch)
    add({
      id: `nl-${tax.id}`,
      title: `Dutch assessment · ${tax.taxpayerName}`,
      date: tax.assessmentDate,
      precision: "day",
      category: "Tax",
      amount: tax.settlementAmount,
      currency: "EUR",
      href: "/dashboard/tax/netherlands",
      detail: `${tax.taxYear} assessment date. Recorded outcome: ${tax.outcomeType}; not a payment deadline or confirmation of settlement.`,
      planned: false,
    });
  for (const trade of trades)
    add({
      id: `ledger-${trade.id}`,
      title: `${trade.type} · ${trade.name ?? "Broker account"}`,
      date: calendarDay(trade.date, preference.timeZone),
      precision: "day",
      category: "Investments",
      amount: trade.amount === null ? null : Number(trade.amount),
      currency: trade.currency,
      href: trade.provider === "degiro" ? "/dashboard/global-equity" : "/dashboard/tradebook",
      detail:
        "Imported broker ledger event. Amount is the recorded net amount; related internal transfers may have multiple ledger entries.",
      planned: false,
    });
  for (const item of imports)
    add({
      id: `import-${item.id}`,
      title: `Import · ${item.kind}`,
      date: calendarDay(item.date, preference.timeZone),
      precision: "day",
      category: "Imports",
      amount: null,
      currency: null,
      href: "/dashboard/imports",
      detail: `Import received on this day. Status: ${item.status}. This is separate from the statement date.`,
      planned: false,
    });
  for (const s of latestSnapshotRevisions(snapshots).toSorted((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  ))
    add({
      id: `snapshot-${s.key}-${s.asOf}`,
      title: `Valuation · ${s.name}`,
      date: calendarDay(new Date(s.asOf), preference.timeZone),
      precision: "day",
      category: "Valuations",
      amount: s.value,
      currency: s.currency,
      href: s.href,
      detail:
        "Effective date of a recorded balance or valuation; not a transaction or investment return.",
      planned: false,
    });
  for (const goal of goals)
    add({
      id: `goal-${goal.id}`,
      title: goal.name,
      date: String(goal.plannedYear),
      precision: "year",
      category: "Planning",
      amount: Number(goal.amount),
      currency: goal.currency,
      href: "/dashboard/fire",
      detail:
        "Saved one-time FIRE goal; amount is the entered assumption before projection inflation. No exact date has been specified.",
      planned: true,
    });
  for (const income of incomes)
    for (const [label, year] of [
      ["Starts", income.startYear],
      ["Ends", income.endYear],
    ] as const)
      if (year !== null)
        add({
          id: `income-${income.id}-${label}`,
          title: `${label} · ${income.name}`,
          date: String(year),
          precision: "year",
          category: "Planning",
          amount: Number(income.annualAmount),
          currency: income.currency,
          href: "/dashboard/fire",
          detail: "Annual income-stream planning boundary. No payment day is specified.",
          planned: true,
        });
  for (const expense of expenses)
    for (const [label, year] of [
      ["Starts", expense.startYear],
      ["Ends", expense.endYear],
    ] as const)
      if (year !== null)
        add({
          id: `expense-${expense.id}-${label}`,
          title: `${label} · ${expense.name}`,
          date: String(year),
          precision: "year",
          category: "Planning",
          amount: Number(expense.monthlyAmount),
          currency: expense.currency,
          href: "/dashboard/fire",
          detail:
            "Expense phase boundary. Amount is the saved monthly assumption; no billing day is specified.",
          planned: true,
        });
  if (profiles[0])
    add({
      id: "retirement",
      title: "Planned retirement",
      date: String(profiles[0].plannedRetirementYear),
      precision: "year",
      category: "Planning",
      amount: null,
      currency: null,
      href: "/dashboard/fire",
      detail: "Retirement year in the saved FIRE plan. No exact retirement day is specified.",
      planned: true,
    });
  return {
    month,
    today,
    timeZone: preference.timeZone,
    events: [...new Map(events.map((e) => [e.id, e])).values()].sort(
      (a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title),
    ),
    undatedContracts: household.contracts.filter(
      (c) => c.status === "active" && c.billingDay === null,
    ).length,
  };
}
