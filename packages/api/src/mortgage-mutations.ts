import "server-only";

import {
  auditEvent,
  db,
  mortgageExtraRepayment,
  mortgageLoan,
  mortgageOverview,
} from "@portfolio/db";
import { and, desc, eq } from "drizzle-orm";

import type { ExtraRepayment, MortgageTerms, RateBasis } from "./mortgage-calculations";

export type MortgageOverviewInput = {
  terms: MortgageTerms;
  source: "import" | "manual";
  importId?: string | null;
  repaymentType?: string;
  sustainabilityDiscount?: boolean;
  energyLabel?: string | null;
  nhg?: boolean;
  bouwdepotOriginal?: number | null;
  bouwdepotRemaining?: number | null;
  validationStatus?: "verified" | "needs_review";
  validationIssues?: string[];
};

const money = (value: number) => value.toFixed(2);
const rate = (value: number) => value.toFixed(5);

export async function findOrCreateMortgageLoan(userId: string, loanNumber: string, lender = "ING") {
  const [existing] = await db
    .select()
    .from(mortgageLoan)
    .where(and(eq(mortgageLoan.userId, userId), eq(mortgageLoan.loanNumber, loanNumber)))
    .limit(1);
  if (existing) return existing;
  // An overview without a readable number belongs to the loan already on file.
  if (loanNumber === "unknown") {
    const [latest] = await db
      .select()
      .from(mortgageLoan)
      .where(eq(mortgageLoan.userId, userId))
      .orderBy(desc(mortgageLoan.updatedAt))
      .limit(1);
    if (latest) return latest;
  }
  const [created] = await db
    .insert(mortgageLoan)
    .values({ userId, loanNumber, lender })
    .onConflictDoNothing()
    .returning();
  if (created) return created;
  const [concurrent] = await db
    .select()
    .from(mortgageLoan)
    .where(and(eq(mortgageLoan.userId, userId), eq(mortgageLoan.loanNumber, loanNumber)))
    .limit(1);
  if (!concurrent) throw new Error("Could not create the mortgage.");
  return concurrent;
}

/** Inserts or replaces the snapshot for (loan, asOf). Import detail is kept when editing by hand. */
export async function upsertMortgageOverview(
  userId: string,
  loanId: string,
  input: MortgageOverviewInput,
) {
  const { terms } = input;
  const values = {
    userId,
    loanId,
    source: input.source,
    asOf: terms.asOf,
    repaymentType: input.repaymentType ?? "annuity",
    startDate: terms.startDate,
    firstPaymentDate: terms.firstPaymentDate,
    endDate: terms.endDate,
    fixedRateEndDate: terms.fixedRateEndDate,
    originalAmount: money(terms.originalAmount),
    currentBalance: money(terms.currentBalance),
    monthlyPayment: money(terms.monthlyPayment),
    statedRate: rate(terms.statedRate),
    discount: rate(terms.discount),
    sustainabilityDiscount: input.sustainabilityDiscount ?? terms.discount > 0,
    registrationAmount: money(terms.registrationAmount),
    freeRepaymentAllowance: money(terms.freeRepaymentAllowance),
    propertyValue: money(terms.propertyValue),
    valuationDate: terms.valuationDate,
    energyLabel: input.energyLabel ?? null,
    nhg: input.nhg ?? false,
    bouwdepotOriginal: input.bouwdepotOriginal == null ? null : money(input.bouwdepotOriginal),
    bouwdepotRemaining: input.bouwdepotRemaining == null ? null : money(input.bouwdepotRemaining),
    validationStatus: input.validationStatus ?? "verified",
    validationIssues: input.validationIssues ?? [],
  };
  const { userId: _u, loanId: _l, asOf: _a, ...updatable } = values;
  const [row] = await db
    .insert(mortgageOverview)
    .values({ ...values, importId: input.importId ?? null })
    .onConflictDoUpdate({
      target: [mortgageOverview.loanId, mortgageOverview.asOf],
      set: {
        ...updatable,
        ...(input.importId ? { importId: input.importId } : {}),
        updatedAt: new Date(),
      },
    })
    .returning({ id: mortgageOverview.id });
  if (!row) throw new Error("Could not save the mortgage overview.");
  return row.id;
}

export type MortgageSettingsInput = {
  loanNumber: string;
  terms: MortgageTerms;
  rateBasis: RateBasis;
  appreciation: number;
  extras: ExtraRepayment[];
  energyLabel?: string | null;
  nhg?: boolean;
};

/** Saves the user's edited terms, preferences and extra repayments as one unit. */
export async function saveMortgageSettings(userId: string, input: MortgageSettingsInput) {
  const loan = await findOrCreateMortgageLoan(userId, input.loanNumber);
  const overviewId = await upsertMortgageOverview(userId, loan.id, {
    terms: input.terms,
    source: "manual",
    energyLabel: input.energyLabel,
    nhg: input.nhg,
  });
  await db
    .update(mortgageLoan)
    .set({
      rateBasis: input.rateBasis,
      propertyAppreciation: rate(input.appreciation),
      updatedAt: new Date(),
    })
    .where(and(eq(mortgageLoan.id, loan.id), eq(mortgageLoan.userId, userId)));
  await db
    .delete(mortgageExtraRepayment)
    .where(
      and(eq(mortgageExtraRepayment.loanId, loan.id), eq(mortgageExtraRepayment.userId, userId)),
    );
  if (input.extras.length > 0) {
    await db.insert(mortgageExtraRepayment).values(
      input.extras.map((extra) => ({
        userId,
        loanId: loan.id,
        paidOn: extra.date,
        amount: money(extra.amount),
      })),
    );
  }
  await db.insert(auditEvent).values({
    userId,
    action: "updated",
    entityType: "mortgage_overview",
    entityId: overviewId,
    metadata: { loanId: loan.id, extraRepayments: input.extras.length },
  });
  return { loanId: loan.id, overviewId };
}
