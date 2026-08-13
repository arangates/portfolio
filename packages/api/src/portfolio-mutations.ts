import "server-only";

import {
  auditEvent,
  bankAccount,
  bankBalanceSnapshot,
  commodityHolding,
  commoditySnapshot,
  db,
  exchangeRateSnapshot,
  fixedDeposit,
  fixedDepositSnapshot,
  manualAsset,
  manualAssetSnapshot,
  portfolioPreference,
} from "@portfolio/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const optionalLast4 = z
  .string()
  .trim()
  .regex(/^\d{4}$/)
  .optional()
  .or(z.literal(""));
const currency = z
  .string()
  .trim()
  .regex(/^[A-Z]{3}$/);
const date = z.iso.date();

export const bankAccountInput = z.object({
  id: z.uuid().optional(),
  institution: z.string().trim().min(2).max(80),
  name: z.string().trim().min(2).max(80),
  accountType: z.string().trim().min(2).max(60),
  accountLast4: optionalLast4,
  currency,
  amount: z.coerce.number().finite().min(-1_000_000_000_000).max(1_000_000_000_000),
  asOf: date.optional(),
  notes: z.string().trim().max(500).optional(),
});

export const fixedDepositInput = z
  .object({
    id: z.uuid().optional(),
    bank: z.string().trim().min(2).max(80),
    depositType: z.string().trim().min(2).max(60),
    accountLast4: optionalLast4,
    currency,
    principal: z.coerce.number().positive().max(1_000_000_000_000),
    interestRate: z.coerce.number().positive().max(100),
    startDate: date,
    maturityDate: date,
    compoundingPerYear: z.coerce.number().int().min(1).max(365).default(4),
    status: z.enum(["active", "matured", "closed"]).default("active"),
    notes: z.string().trim().max(500).optional(),
  })
  .refine((input) => new Date(input.maturityDate) > new Date(input.startDate), {
    message: "Maturity date must be after start date",
    path: ["maturityDate"],
  });

export const commodityInput = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2).max(100),
  commodityType: z.string().trim().min(2).max(50),
  location: z.string().trim().max(120).optional(),
  quantityGrams: z.coerce.number().positive().max(1_000_000_000),
  ownershipShare: z.coerce.number().positive().max(100),
  pricePerGram: z.coerce.number().nonnegative().max(1_000_000_000),
  currency,
  asOf: date.optional(),
});

export const manualAssetInput = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2).max(100),
  assetType: z.string().trim().min(2).max(60),
  location: z.string().trim().max(120).optional(),
  riskLevel: z.enum(["low", "moderate", "high"]),
  isLiquid: z.boolean(),
  notes: z.string().trim().max(500).optional(),
  value: z.coerce.number().nonnegative().max(1_000_000_000_000),
  currency,
  ownershipShare: z.coerce.number().positive().max(100),
  asOf: date.optional(),
});

export const preferenceInput = z.object({
  baseCurrency: currency,
  locale: z.string().trim().min(2).max(35),
  timeZone: z.string().trim().min(2).max(80),
});

export const exchangeRateInput = z
  .object({
    baseCurrency: currency,
    quoteCurrency: currency,
    rate: z.coerce.number().positive().max(1_000_000_000),
    asOf: date.optional(),
  })
  .refine((input) => input.baseCurrency !== input.quoteCurrency, {
    message: "Choose two different currencies",
    path: ["quoteCurrency"],
  });

function asOfDate(value?: string) {
  return value ? new Date(`${value}T12:00:00.000Z`) : new Date();
}

export async function recordAuditEvent(input: {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(auditEvent).values(input);
}

export async function saveBankAccount(userId: string, raw: unknown) {
  const input = bankAccountInput.parse(raw);
  let account: typeof bankAccount.$inferSelect | undefined;
  if (input.id) {
    [account] = await db
      .update(bankAccount)
      .set({
        institution: input.institution,
        name: input.name,
        accountType: input.accountType,
        accountLast4: input.accountLast4 || null,
        currency: input.currency,
        notes: input.notes || null,
      })
      .where(and(eq(bankAccount.id, input.id), eq(bankAccount.userId, userId)))
      .returning();
  } else {
    [account] = await db
      .insert(bankAccount)
      .values({
        userId,
        institution: input.institution,
        name: input.name,
        accountType: input.accountType,
        accountLast4: input.accountLast4 || null,
        currency: input.currency,
        notes: input.notes || null,
      })
      .onConflictDoUpdate({
        target: [
          bankAccount.userId,
          bankAccount.institution,
          bankAccount.name,
          bankAccount.currency,
        ],
        set: {
          accountType: input.accountType,
          accountLast4: input.accountLast4 || null,
          notes: input.notes || null,
          archivedAt: null,
        },
      })
      .returning();
  }
  if (!account) throw new Error(input.id ? "Account not found" : "Could not save account");

  await db.insert(bankBalanceSnapshot).values({
    userId,
    accountId: account.id,
    amount: input.amount.toString(),
    asOf: asOfDate(input.asOf),
  });
  await recordAuditEvent({
    userId,
    action: input.id ? "updated" : "created",
    entityType: "bank_account",
    entityId: account.id,
    metadata: { currency: input.currency },
  });
  return { id: account.id };
}

export async function saveFixedDeposit(userId: string, raw: unknown) {
  const input = fixedDepositInput.parse(raw);
  let deposit: typeof fixedDeposit.$inferSelect | undefined;
  if (input.id) {
    [deposit] = await db
      .update(fixedDeposit)
      .set({
        bank: input.bank,
        depositType: input.depositType,
        accountLast4: input.accountLast4 || null,
        currency: input.currency,
      })
      .where(and(eq(fixedDeposit.id, input.id), eq(fixedDeposit.userId, userId)))
      .returning();
  } else {
    [deposit] = await db
      .insert(fixedDeposit)
      .values({
        userId,
        bank: input.bank,
        depositType: input.depositType,
        accountLast4: input.accountLast4 || null,
        currency: input.currency,
      })
      .returning();
  }
  if (!deposit) throw new Error(input.id ? "Fixed deposit not found" : "Could not save deposit");

  await db.insert(fixedDepositSnapshot).values({
    userId,
    fixedDepositId: deposit.id,
    principal: input.principal.toString(),
    interestRate: (input.interestRate / 100).toString(),
    startDate: input.startDate,
    maturityDate: input.maturityDate,
    compoundingPerYear: input.compoundingPerYear,
    status: input.status,
    notes: input.notes || null,
  });
  await recordAuditEvent({
    userId,
    action: input.id ? "updated" : "created",
    entityType: "fixed_deposit",
    entityId: deposit.id,
    metadata: { currency: input.currency },
  });
  return { id: deposit.id };
}

export async function saveCommodity(userId: string, raw: unknown) {
  const input = commodityInput.parse(raw);
  let holding: typeof commodityHolding.$inferSelect | undefined;
  if (input.id) {
    [holding] = await db
      .update(commodityHolding)
      .set({
        name: input.name,
        commodityType: input.commodityType,
        location: input.location || null,
      })
      .where(and(eq(commodityHolding.id, input.id), eq(commodityHolding.userId, userId)))
      .returning();
  } else {
    [holding] = await db
      .insert(commodityHolding)
      .values({
        userId,
        name: input.name,
        commodityType: input.commodityType,
        location: input.location || null,
      })
      .returning();
  }
  if (!holding) throw new Error(input.id ? "Commodity not found" : "Could not save commodity");

  await db.insert(commoditySnapshot).values({
    userId,
    commodityHoldingId: holding.id,
    asOf: asOfDate(input.asOf),
    quantityGrams: input.quantityGrams.toString(),
    ownershipShare: (input.ownershipShare / 100).toString(),
    pricePerGram: input.pricePerGram.toString(),
    currency: input.currency,
  });
  await recordAuditEvent({
    userId,
    action: input.id ? "updated" : "created",
    entityType: "commodity",
    entityId: holding.id,
    metadata: { currency: input.currency },
  });
  return { id: holding.id };
}

export async function saveManualAsset(userId: string, raw: unknown) {
  const input = manualAssetInput.parse(raw);
  let asset: typeof manualAsset.$inferSelect | undefined;
  if (input.id) {
    [asset] = await db
      .update(manualAsset)
      .set({
        name: input.name,
        assetType: input.assetType,
        location: input.location || null,
        riskLevel: input.riskLevel,
        isLiquid: input.isLiquid,
        notes: input.notes || null,
      })
      .where(and(eq(manualAsset.id, input.id), eq(manualAsset.userId, userId)))
      .returning();
  } else {
    [asset] = await db
      .insert(manualAsset)
      .values({
        userId,
        name: input.name,
        assetType: input.assetType,
        location: input.location || null,
        riskLevel: input.riskLevel,
        isLiquid: input.isLiquid,
        notes: input.notes || null,
      })
      .onConflictDoUpdate({
        target: [manualAsset.userId, manualAsset.name],
        set: {
          assetType: input.assetType,
          location: input.location || null,
          riskLevel: input.riskLevel,
          isLiquid: input.isLiquid,
          notes: input.notes || null,
          archivedAt: null,
        },
      })
      .returning();
  }
  if (!asset) throw new Error(input.id ? "Asset not found" : "Could not save asset");

  await db.insert(manualAssetSnapshot).values({
    userId,
    assetId: asset.id,
    asOf: asOfDate(input.asOf),
    value: input.value.toString(),
    currency: input.currency,
    ownershipShare: (input.ownershipShare / 100).toString(),
  });
  await recordAuditEvent({
    userId,
    action: input.id ? "updated" : "created",
    entityType: "manual_asset",
    entityId: asset.id,
    metadata: { currency: input.currency, assetType: input.assetType },
  });
  return { id: asset.id };
}

export async function savePortfolioPreference(userId: string, raw: unknown) {
  const input = preferenceInput.parse(raw);
  await db
    .insert(portfolioPreference)
    .values({ userId, ...input })
    .onConflictDoUpdate({ target: portfolioPreference.userId, set: input });
  await recordAuditEvent({
    userId,
    action: "updated",
    entityType: "portfolio_preference",
    entityId: userId,
  });
  return { success: true };
}

export async function saveExchangeRate(userId: string, raw: unknown) {
  const input = exchangeRateInput.parse(raw);
  const [rate] = await db
    .insert(exchangeRateSnapshot)
    .values({
      userId,
      baseCurrency: input.baseCurrency,
      quoteCurrency: input.quoteCurrency,
      rate: input.rate.toString(),
      asOf: asOfDate(input.asOf),
    })
    .returning({ id: exchangeRateSnapshot.id });
  await recordAuditEvent({
    userId,
    action: "created",
    entityType: "exchange_rate",
    entityId: rate?.id,
    metadata: { baseCurrency: input.baseCurrency, quoteCurrency: input.quoteCurrency },
  });
  return { id: rate?.id };
}

const archiveKinds = {
  bank_account: bankAccount,
  fixed_deposit: fixedDeposit,
  commodity: commodityHolding,
  manual_asset: manualAsset,
} as const;

export type ArchiveKind = keyof typeof archiveKinds;

export async function archivePortfolioRecord(userId: string, kind: ArchiveKind, id: string) {
  const now = new Date();
  let archivedId: string | undefined;
  if (kind === "bank_account") {
    [archivedId] = (
      await db
        .update(bankAccount)
        .set({ archivedAt: now })
        .where(and(eq(bankAccount.id, id), eq(bankAccount.userId, userId)))
        .returning({ id: bankAccount.id })
    ).map((row) => row.id);
  } else if (kind === "fixed_deposit") {
    [archivedId] = (
      await db
        .update(fixedDeposit)
        .set({ archivedAt: now })
        .where(and(eq(fixedDeposit.id, id), eq(fixedDeposit.userId, userId)))
        .returning({ id: fixedDeposit.id })
    ).map((row) => row.id);
  } else if (kind === "commodity") {
    [archivedId] = (
      await db
        .update(commodityHolding)
        .set({ archivedAt: now })
        .where(and(eq(commodityHolding.id, id), eq(commodityHolding.userId, userId)))
        .returning({ id: commodityHolding.id })
    ).map((row) => row.id);
  } else {
    [archivedId] = (
      await db
        .update(manualAsset)
        .set({ archivedAt: now })
        .where(and(eq(manualAsset.id, id), eq(manualAsset.userId, userId)))
        .returning({ id: manualAsset.id })
    ).map((row) => row.id);
  }
  if (!archivedId) throw new Error("Record not found");
  await recordAuditEvent({
    userId,
    action: "archived",
    entityType: kind,
    entityId: archivedId,
  });
  return { success: true };
}
