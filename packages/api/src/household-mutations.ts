import "server-only";

import {
  auditEvent,
  db,
  householdBudgetItem,
  householdBudgetSnapshot,
  householdProfile,
  householdPurchase,
  householdScenario,
  householdScenarioLine,
  householdServiceContract,
  householdServiceContractSnapshot,
} from "@portfolio/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const currency = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/);
const optionalUuid = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.uuid().optional(),
);
const optionalDate = z.iso.date().optional().or(z.literal(""));
const optionalNumber = (schema: z.ZodNumber) =>
  z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.coerce.number().pipe(schema).optional(),
  );

export const householdProfileInput = z.object({
  name: z.string().trim().min(2).max(100),
  currency,
  adultsCount: z.coerce.number().int().min(1).max(12),
});

export const householdBudgetItemInput = z.object({
  id: optionalUuid,
  name: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(80),
  flowType: z.enum(["expense", "refund"]),
  essential: z.boolean(),
  notes: z.string().trim().max(800).optional(),
  monthlyAmount: z.coerce.number().nonnegative().max(1_000_000_000_000),
  effectiveFrom: optionalDate,
});

export const householdScenarioInput = z.object({
  id: optionalUuid,
  name: z.string().trim().min(2).max(100),
  scenarioType: z.enum(["baseline", "minimum", "worst", "custom"]),
  description: z.string().trim().max(800).optional(),
  adultsCount: z.coerce.number().int().min(1).max(12),
  usesCurrentBudget: z.boolean(),
  isDefault: z.boolean(),
});

export const householdScenarioLineInput = z.object({
  id: optionalUuid,
  scenarioId: z.uuid(),
  name: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(80),
  flowType: z.enum(["expense", "refund"]),
  monthlyAmount: z.coerce.number().nonnegative().max(1_000_000_000_000),
  essential: z.boolean(),
  notes: z.string().trim().max(800).optional(),
  sortOrder: z.coerce.number().int().min(0).max(10_000),
});

export const householdContractInput = z.object({
  id: optionalUuid,
  budgetItemId: optionalUuid,
  service: z.string().trim().min(2).max(120),
  provider: z.string().trim().min(2).max(120),
  effectiveFrom: optionalDate,
  monthlyCost: optionalNumber(z.number().nonnegative().max(1_000_000_000_000)),
  billingDay: optionalNumber(z.number().int().min(1).max(31)),
  contractEndDate: optionalDate,
  durationMonths: optionalNumber(z.number().int().min(1).max(1_200)),
  renewalType: z.enum(["fixed", "automatic", "indefinite", "unknown"]),
  status: z.enum(["active", "ended", "cancelled", "unknown"]),
  notes: z.string().trim().max(800).optional(),
});

export const householdPurchaseInput = z.object({
  id: optionalUuid,
  name: z.string().trim().min(2).max(180),
  scope: z.enum(["house_setup", "car", "home_improvement", "other"]),
  category: z.string().trim().min(2).max(80),
  vendor: z.string().trim().max(120).optional(),
  amount: z.coerce.number().positive().max(1_000_000_000_000),
  currency,
  purchasedOn: optionalDate,
  paymentSource: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(800).optional(),
});

function effectiveDate(value?: string) {
  return value || new Date().toISOString().slice(0, 10);
}

async function audit(userId: string, action: string, entityType: string, entityId: string) {
  await db.insert(auditEvent).values({ userId, action, entityType, entityId });
}

export async function saveHouseholdProfile(userId: string, raw: unknown) {
  const input = householdProfileInput.parse(raw);
  await db
    .insert(householdProfile)
    .values({ userId, ...input })
    .onConflictDoUpdate({
      target: householdProfile.userId,
      set: { ...input, updatedAt: new Date() },
    });
  await db
    .insert(householdScenario)
    .values({
      userId,
      name: "Current household",
      scenarioType: "baseline",
      adultsCount: input.adultsCount,
      usesCurrentBudget: true,
      isDefault: true,
    })
    .onConflictDoNothing({ target: [householdScenario.userId, householdScenario.name] });
  await audit(userId, "updated", "household_profile", userId);
  return { id: userId };
}

export async function saveHouseholdBudgetItem(userId: string, raw: unknown) {
  const input = householdBudgetItemInput.parse(raw);
  const values = {
    name: input.name,
    category: input.category,
    flowType: input.flowType,
    essential: input.essential,
    notes: input.notes || null,
    archivedAt: null,
    updatedAt: new Date(),
  };
  const [item] = input.id
    ? await db
        .update(householdBudgetItem)
        .set(values)
        .where(and(eq(householdBudgetItem.id, input.id), eq(householdBudgetItem.userId, userId)))
        .returning({ id: householdBudgetItem.id })
    : await db
        .insert(householdBudgetItem)
        .values({ userId, ...values })
        .onConflictDoUpdate({
          target: [
            householdBudgetItem.userId,
            householdBudgetItem.name,
            householdBudgetItem.category,
            householdBudgetItem.flowType,
          ],
          set: values,
        })
        .returning({ id: householdBudgetItem.id });
  if (!item) throw new Error("Budget item not found");
  await db
    .insert(householdBudgetSnapshot)
    .values({
      userId,
      itemId: item.id,
      effectiveFrom: effectiveDate(input.effectiveFrom),
      monthlyAmount: input.monthlyAmount.toString(),
      source: "manual",
    })
    .onConflictDoUpdate({
      target: [householdBudgetSnapshot.itemId, householdBudgetSnapshot.effectiveFrom],
      set: { monthlyAmount: input.monthlyAmount.toString(), source: "manual" },
    });
  await audit(userId, input.id ? "updated" : "created", "household_budget_item", item.id);
  return { id: item.id };
}

export async function saveHouseholdScenario(userId: string, raw: unknown) {
  const input = householdScenarioInput.parse(raw);
  const values = {
    name: input.name,
    scenarioType: input.scenarioType,
    description: input.description || null,
    adultsCount: input.adultsCount,
    usesCurrentBudget: input.usesCurrentBudget,
    isDefault: input.isDefault,
    archivedAt: null,
    updatedAt: new Date(),
  };
  if (input.isDefault) {
    await db
      .update(householdScenario)
      .set({ isDefault: false })
      .where(eq(householdScenario.userId, userId));
  }
  const [scenario] = input.id
    ? await db
        .update(householdScenario)
        .set(values)
        .where(and(eq(householdScenario.id, input.id), eq(householdScenario.userId, userId)))
        .returning({ id: householdScenario.id })
    : await db
        .insert(householdScenario)
        .values({ userId, ...values })
        .onConflictDoUpdate({
          target: [householdScenario.userId, householdScenario.name],
          set: values,
        })
        .returning({ id: householdScenario.id });
  if (!scenario) throw new Error("Scenario not found");
  await audit(userId, input.id ? "updated" : "created", "household_scenario", scenario.id);
  return { id: scenario.id };
}

export async function saveHouseholdScenarioLine(userId: string, raw: unknown) {
  const input = householdScenarioLineInput.parse(raw);
  const values = {
    scenarioId: input.scenarioId,
    name: input.name,
    category: input.category,
    flowType: input.flowType,
    monthlyAmount: input.monthlyAmount.toString(),
    essential: input.essential,
    notes: input.notes || null,
    sortOrder: input.sortOrder,
    archivedAt: null,
    updatedAt: new Date(),
  };
  const [line] = input.id
    ? await db
        .update(householdScenarioLine)
        .set(values)
        .where(
          and(eq(householdScenarioLine.id, input.id), eq(householdScenarioLine.userId, userId)),
        )
        .returning({ id: householdScenarioLine.id })
    : await db
        .insert(householdScenarioLine)
        .values({ userId, ...values })
        .returning({ id: householdScenarioLine.id });
  if (!line) throw new Error("Scenario line not found");
  await audit(userId, input.id ? "updated" : "created", "household_scenario_line", line.id);
  return { id: line.id };
}

export async function saveHouseholdContract(userId: string, raw: unknown) {
  const input = householdContractInput.parse(raw);
  const values = {
    budgetItemId: input.budgetItemId ?? null,
    service: input.service,
    provider: input.provider,
    archivedAt: null,
    updatedAt: new Date(),
  };
  const [contract] = input.id
    ? await db
        .update(householdServiceContract)
        .set(values)
        .where(
          and(
            eq(householdServiceContract.id, input.id),
            eq(householdServiceContract.userId, userId),
          ),
        )
        .returning({ id: householdServiceContract.id })
    : await db
        .insert(householdServiceContract)
        .values({ userId, ...values })
        .onConflictDoUpdate({
          target: [
            householdServiceContract.userId,
            householdServiceContract.service,
            householdServiceContract.provider,
          ],
          set: values,
        })
        .returning({ id: householdServiceContract.id });
  if (!contract) throw new Error("Service contract not found");
  await db
    .insert(householdServiceContractSnapshot)
    .values({
      userId,
      contractId: contract.id,
      effectiveFrom: effectiveDate(input.effectiveFrom),
      monthlyCost: input.monthlyCost?.toString() ?? null,
      billingDay: input.billingDay ?? null,
      contractEndDate: input.contractEndDate || null,
      durationMonths: input.durationMonths ?? null,
      renewalType: input.renewalType,
      status: input.status,
      notes: input.notes || null,
      source: "manual",
    })
    .onConflictDoUpdate({
      target: [
        householdServiceContractSnapshot.contractId,
        householdServiceContractSnapshot.effectiveFrom,
      ],
      set: {
        monthlyCost: input.monthlyCost?.toString() ?? null,
        billingDay: input.billingDay ?? null,
        contractEndDate: input.contractEndDate || null,
        durationMonths: input.durationMonths ?? null,
        renewalType: input.renewalType,
        status: input.status,
        notes: input.notes || null,
        source: "manual",
      },
    });
  await audit(userId, input.id ? "updated" : "created", "household_service_contract", contract.id);
  return { id: contract.id };
}

export async function saveHouseholdPurchase(userId: string, raw: unknown) {
  const input = householdPurchaseInput.parse(raw);
  const values = {
    name: input.name,
    scope: input.scope,
    category: input.category,
    vendor: input.vendor || null,
    amount: input.amount.toString(),
    currency: input.currency,
    purchasedOn: input.purchasedOn || null,
    paymentSource: input.paymentSource || null,
    notes: input.notes || null,
    archivedAt: null,
    updatedAt: new Date(),
  };
  const [purchase] = input.id
    ? await db
        .update(householdPurchase)
        .set(values)
        .where(and(eq(householdPurchase.id, input.id), eq(householdPurchase.userId, userId)))
        .returning({ id: householdPurchase.id })
    : await db
        .insert(householdPurchase)
        .values({ userId, ...values })
        .returning({ id: householdPurchase.id });
  if (!purchase) throw new Error("Purchase not found");
  await audit(userId, input.id ? "updated" : "created", "household_purchase", purchase.id);
  return { id: purchase.id };
}

export type HouseholdArchiveKind =
  | "household_budget_item"
  | "household_scenario"
  | "household_scenario_line"
  | "household_service_contract"
  | "household_purchase";

export async function archiveHouseholdRecord(
  userId: string,
  kind: HouseholdArchiveKind,
  id: string,
) {
  const archivedAt = new Date();
  const result =
    kind === "household_budget_item"
      ? await db
          .update(householdBudgetItem)
          .set({ archivedAt })
          .where(and(eq(householdBudgetItem.id, id), eq(householdBudgetItem.userId, userId)))
          .returning({ id: householdBudgetItem.id })
      : kind === "household_scenario"
        ? await db
            .update(householdScenario)
            .set({ archivedAt })
            .where(and(eq(householdScenario.id, id), eq(householdScenario.userId, userId)))
            .returning({ id: householdScenario.id })
        : kind === "household_scenario_line"
          ? await db
              .update(householdScenarioLine)
              .set({ archivedAt })
              .where(
                and(eq(householdScenarioLine.id, id), eq(householdScenarioLine.userId, userId)),
              )
              .returning({ id: householdScenarioLine.id })
          : kind === "household_service_contract"
            ? await db
                .update(householdServiceContract)
                .set({ archivedAt })
                .where(
                  and(
                    eq(householdServiceContract.id, id),
                    eq(householdServiceContract.userId, userId),
                  ),
                )
                .returning({ id: householdServiceContract.id })
            : await db
                .update(householdPurchase)
                .set({ archivedAt })
                .where(and(eq(householdPurchase.id, id), eq(householdPurchase.userId, userId)))
                .returning({ id: householdPurchase.id });
  if (!result[0]) throw new Error("Record not found");
  await audit(userId, "archived", kind, id);
  return { id };
}
