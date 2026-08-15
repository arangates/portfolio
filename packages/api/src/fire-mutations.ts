import "server-only";

import {
  auditEvent,
  db,
  familyMember,
  fireExpense,
  fireIncomeStream,
  fireOneTimeCost,
  fireProfile,
  fireScenario,
} from "@portfolio/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const currency = z
  .string()
  .trim()
  .regex(/^[A-Z]{3}$/);
const optionalDate = z.iso.date().optional().or(z.literal(""));
const optionalYear = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.coerce.number().int().min(1900).max(2300).optional(),
);
const optionalUuid = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.uuid().optional(),
);
const optionalPercent = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.coerce.number().min(-20).max(150).optional(),
);

export const fireProfileInput = z.object({
  birthDate: optionalDate,
  plannedRetirementYear: z.coerce.number().int().min(2020).max(2200),
  planEndAge: z.coerce.number().int().min(50).max(120),
  inflationRate: z.coerce.number().min(-2).max(30),
  expectedReturnRate: z.coerce.number().min(-20).max(100),
  returnVolatility: z.coerce.number().min(0).max(100),
  safeWithdrawalRate: z.coerce.number().positive().max(20),
  safetyBuffer: z.coerce.number().min(0).max(100),
  annualSavings: z.coerce.number().min(0).max(1_000_000_000_000_000),
  savingsCurrency: currency,
  targetLegacy: z.coerce.number().min(0).max(1_000_000_000_000_000),
  spendingPolicy: z.enum(["fixed_real", "essential_floor"]),
});

export const familyMemberInput = z.object({
  id: optionalUuid,
  name: z.string().trim().min(1).max(100),
  relationship: z.enum(["self", "partner", "child", "dependent", "other"]),
  birthDate: optionalDate,
  linkedToPortfolio: z.boolean(),
  netWorth: z.coerce.number().min(0).max(1_000_000_000_000_000),
  investableAssets: z.coerce.number().min(0).max(1_000_000_000_000_000),
  annualNetIncome: z.coerce.number().min(0).max(1_000_000_000_000_000),
  currency,
  includedInPlan: z.boolean(),
});

export const fireExpenseInput = z
  .object({
    id: optionalUuid,
    memberId: optionalUuid,
    name: z.string().trim().min(2).max(120),
    category: z.string().trim().min(2).max(80),
    monthlyAmount: z.coerce.number().positive().max(1_000_000_000_000),
    currency,
    essential: z.boolean(),
    startYear: optionalYear,
    endYear: optionalYear,
    inflationRateOverride: optionalPercent,
    notes: z.string().trim().max(800).optional(),
  })
  .refine(
    (input) =>
      input.startYear === undefined ||
      input.endYear === undefined ||
      input.endYear >= input.startYear,
    { message: "End year must be on or after the start year", path: ["endYear"] },
  );

export const fireOneTimeCostInput = z.object({
  id: optionalUuid,
  memberId: optionalUuid,
  name: z.string().trim().min(2).max(120),
  amount: z.coerce.number().positive().max(1_000_000_000_000_000),
  currency,
  plannedYear: z.coerce.number().int().min(2020).max(2300),
  priority: z.enum(["essential", "important", "optional"]),
  inflationLinked: z.boolean(),
  notes: z.string().trim().max(800).optional(),
});

export const fireIncomeStreamInput = z
  .object({
    id: optionalUuid,
    memberId: optionalUuid,
    name: z.string().trim().min(2).max(120),
    incomeType: z.enum(["pension", "rental", "annuity", "part_time", "other"]),
    annualAmount: z.coerce.number().positive().max(1_000_000_000_000_000),
    currency,
    startYear: z.coerce.number().int().min(2020).max(2300),
    endYear: optionalYear,
    inflationLinked: z.boolean(),
    notes: z.string().trim().max(800).optional(),
  })
  .refine((input) => input.endYear === undefined || input.endYear >= input.startYear, {
    message: "End year must be on or after the start year",
    path: ["endYear"],
  });

export const fireScenarioInput = z.object({
  id: optionalUuid,
  name: z.string().trim().min(2).max(80),
  spendingMultiplier: z.coerce.number().positive().max(300),
  bufferRate: z.coerce.number().min(0).max(100),
  returnRateOverride: optionalPercent,
  inflationRateOverride: optionalPercent,
  retirementYearOverride: optionalYear,
  enabled: z.boolean(),
});

async function addAudit(
  userId: string,
  action: string,
  entityType: string,
  entityId?: string | null,
) {
  await db.insert(auditEvent).values({ userId, action, entityType, entityId });
}

export async function saveFireProfile(userId: string, raw: unknown) {
  const input = fireProfileInput.parse(raw);
  const [profile] = await db
    .insert(fireProfile)
    .values({
      userId,
      birthDate: input.birthDate || null,
      plannedRetirementYear: input.plannedRetirementYear,
      planEndAge: input.planEndAge,
      inflationRate: (input.inflationRate / 100).toString(),
      expectedReturnRate: (input.expectedReturnRate / 100).toString(),
      returnVolatility: (input.returnVolatility / 100).toString(),
      safeWithdrawalRate: (input.safeWithdrawalRate / 100).toString(),
      safetyBuffer: (input.safetyBuffer / 100).toString(),
      annualSavings: input.annualSavings.toString(),
      savingsCurrency: input.savingsCurrency,
      targetLegacy: input.targetLegacy.toString(),
      spendingPolicy: input.spendingPolicy,
    })
    .onConflictDoUpdate({
      target: fireProfile.userId,
      set: {
        birthDate: input.birthDate || null,
        plannedRetirementYear: input.plannedRetirementYear,
        planEndAge: input.planEndAge,
        inflationRate: (input.inflationRate / 100).toString(),
        expectedReturnRate: (input.expectedReturnRate / 100).toString(),
        returnVolatility: (input.returnVolatility / 100).toString(),
        safeWithdrawalRate: (input.safeWithdrawalRate / 100).toString(),
        safetyBuffer: (input.safetyBuffer / 100).toString(),
        annualSavings: input.annualSavings.toString(),
        savingsCurrency: input.savingsCurrency,
        targetLegacy: input.targetLegacy.toString(),
        spendingPolicy: input.spendingPolicy,
        updatedAt: new Date(),
      },
    })
    .returning({ userId: fireProfile.userId });
  if (!profile) throw new Error("Could not save FIRE assumptions");
  await db
    .insert(fireScenario)
    .values([
      { userId, name: "Doable", spendingMultiplier: "1", bufferRate: "0" },
      {
        userId,
        name: "Safety Max",
        spendingMultiplier: "1",
        bufferRate: (input.safetyBuffer / 100).toString(),
      },
    ])
    .onConflictDoNothing({ target: [fireScenario.userId, fireScenario.name] });
  await addAudit(userId, "updated", "fire_profile", userId);
  return { id: profile.userId };
}

export async function saveFamilyMember(userId: string, raw: unknown) {
  const input = familyMemberInput.parse(raw);
  const values = {
    name: input.name,
    relationship: input.relationship,
    birthDate: input.birthDate || null,
    linkedToPortfolio: input.linkedToPortfolio,
    netWorth: input.netWorth.toString(),
    investableAssets: input.investableAssets.toString(),
    annualNetIncome: input.annualNetIncome.toString(),
    currency: input.currency,
    includedInPlan: input.includedInPlan,
    archivedAt: null,
    updatedAt: new Date(),
  };
  const [member] = input.id
    ? await db
        .update(familyMember)
        .set(values)
        .where(and(eq(familyMember.id, input.id), eq(familyMember.userId, userId)))
        .returning({ id: familyMember.id })
    : await db
        .insert(familyMember)
        .values({ userId, ...values })
        .onConflictDoUpdate({
          target: [familyMember.userId, familyMember.name, familyMember.relationship],
          set: values,
        })
        .returning({ id: familyMember.id });
  if (!member)
    throw new Error(input.id ? "Family member not found" : "Could not save family member");
  await addAudit(userId, input.id ? "updated" : "created", "family_member", member.id);
  return { id: member.id };
}

export async function saveFireExpense(userId: string, raw: unknown) {
  const input = fireExpenseInput.parse(raw);
  const values = {
    memberId: input.memberId ?? null,
    name: input.name,
    category: input.category,
    monthlyAmount: input.monthlyAmount.toString(),
    currency: input.currency,
    essential: input.essential,
    startYear: input.startYear ?? null,
    endYear: input.endYear ?? null,
    inflationRateOverride:
      input.inflationRateOverride === undefined
        ? null
        : (input.inflationRateOverride / 100).toString(),
    notes: input.notes || null,
    archivedAt: null,
    updatedAt: new Date(),
  };
  const [expense] = input.id
    ? await db
        .update(fireExpense)
        .set(values)
        .where(and(eq(fireExpense.id, input.id), eq(fireExpense.userId, userId)))
        .returning({ id: fireExpense.id })
    : await db
        .insert(fireExpense)
        .values({ userId, ...values })
        .returning({ id: fireExpense.id });
  if (!expense) throw new Error(input.id ? "Expense not found" : "Could not save expense");
  await addAudit(userId, input.id ? "updated" : "created", "fire_expense", expense.id);
  return { id: expense.id };
}

export async function saveFireOneTimeCost(userId: string, raw: unknown) {
  const input = fireOneTimeCostInput.parse(raw);
  const values = {
    memberId: input.memberId ?? null,
    name: input.name,
    amount: input.amount.toString(),
    currency: input.currency,
    plannedYear: input.plannedYear,
    priority: input.priority,
    inflationLinked: input.inflationLinked,
    notes: input.notes || null,
    archivedAt: null,
    updatedAt: new Date(),
  };
  const [cost] = input.id
    ? await db
        .update(fireOneTimeCost)
        .set(values)
        .where(and(eq(fireOneTimeCost.id, input.id), eq(fireOneTimeCost.userId, userId)))
        .returning({ id: fireOneTimeCost.id })
    : await db
        .insert(fireOneTimeCost)
        .values({ userId, ...values })
        .returning({ id: fireOneTimeCost.id });
  if (!cost) throw new Error(input.id ? "One-time cost not found" : "Could not save cost");
  await addAudit(userId, input.id ? "updated" : "created", "fire_one_time_cost", cost.id);
  return { id: cost.id };
}

export async function saveFireIncomeStream(userId: string, raw: unknown) {
  const input = fireIncomeStreamInput.parse(raw);
  const values = {
    memberId: input.memberId ?? null,
    name: input.name,
    incomeType: input.incomeType,
    annualAmount: input.annualAmount.toString(),
    currency: input.currency,
    startYear: input.startYear,
    endYear: input.endYear ?? null,
    inflationLinked: input.inflationLinked,
    notes: input.notes || null,
    archivedAt: null,
    updatedAt: new Date(),
  };
  const [income] = input.id
    ? await db
        .update(fireIncomeStream)
        .set(values)
        .where(and(eq(fireIncomeStream.id, input.id), eq(fireIncomeStream.userId, userId)))
        .returning({ id: fireIncomeStream.id })
    : await db
        .insert(fireIncomeStream)
        .values({ userId, ...values })
        .returning({ id: fireIncomeStream.id });
  if (!income)
    throw new Error(input.id ? "Income stream not found" : "Could not save income stream");
  await addAudit(userId, input.id ? "updated" : "created", "fire_income_stream", income.id);
  return { id: income.id };
}

export async function saveFireScenario(userId: string, raw: unknown) {
  const input = fireScenarioInput.parse(raw);
  const values = {
    name: input.name,
    spendingMultiplier: (input.spendingMultiplier / 100).toString(),
    bufferRate: (input.bufferRate / 100).toString(),
    returnRateOverride:
      input.returnRateOverride === undefined ? null : (input.returnRateOverride / 100).toString(),
    inflationRateOverride:
      input.inflationRateOverride === undefined
        ? null
        : (input.inflationRateOverride / 100).toString(),
    retirementYearOverride: input.retirementYearOverride ?? null,
    enabled: input.enabled,
    updatedAt: new Date(),
  };
  const [scenario] = input.id
    ? await db
        .update(fireScenario)
        .set(values)
        .where(and(eq(fireScenario.id, input.id), eq(fireScenario.userId, userId)))
        .returning({ id: fireScenario.id })
    : await db
        .insert(fireScenario)
        .values({ userId, ...values })
        .onConflictDoUpdate({ target: [fireScenario.userId, fireScenario.name], set: values })
        .returning({ id: fireScenario.id });
  if (!scenario) throw new Error(input.id ? "Scenario not found" : "Could not save scenario");
  await addAudit(userId, input.id ? "updated" : "created", "fire_scenario", scenario.id);
  return { id: scenario.id };
}

export type FireArchiveKind =
  | "family_member"
  | "fire_expense"
  | "fire_one_time_cost"
  | "fire_income_stream"
  | "fire_scenario";

export async function archiveFireRecord(userId: string, kind: FireArchiveKind, id: string) {
  const archivedAt = new Date();
  const result =
    kind === "family_member"
      ? await db
          .update(familyMember)
          .set({ archivedAt })
          .where(and(eq(familyMember.id, id), eq(familyMember.userId, userId)))
          .returning({ id: familyMember.id })
      : kind === "fire_expense"
        ? await db
            .update(fireExpense)
            .set({ archivedAt })
            .where(and(eq(fireExpense.id, id), eq(fireExpense.userId, userId)))
            .returning({ id: fireExpense.id })
        : kind === "fire_one_time_cost"
          ? await db
              .update(fireOneTimeCost)
              .set({ archivedAt })
              .where(and(eq(fireOneTimeCost.id, id), eq(fireOneTimeCost.userId, userId)))
              .returning({ id: fireOneTimeCost.id })
          : kind === "fire_income_stream"
            ? await db
                .update(fireIncomeStream)
                .set({ archivedAt })
                .where(and(eq(fireIncomeStream.id, id), eq(fireIncomeStream.userId, userId)))
                .returning({ id: fireIncomeStream.id })
            : await db
                .update(fireScenario)
                .set({ enabled: false })
                .where(and(eq(fireScenario.id, id), eq(fireScenario.userId, userId)))
                .returning({ id: fireScenario.id });
  if (!result[0]) throw new Error("Record not found");
  await addAudit(userId, "archived", kind, id);
  return { id };
}
