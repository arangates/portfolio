import "server-only";

import {
  commodityHolding,
  commodityInventoryItem,
  commodityInventorySnapshot,
  db,
} from "@portfolio/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { recordAuditEvent } from "./portfolio-mutations";

const optionalNumber = (schema: z.ZodType<number, unknown>) =>
  z.preprocess((value) => (value === "" || value === null ? undefined : value), schema.optional());

export const commodityInventoryInput = z
  .object({
    id: z.uuid().optional(),
    commodityHoldingId: z.uuid(),
    name: z.string().trim().min(1).max(160),
    itemCount: z.coerce.number().positive().max(1_000_000),
    countUnit: z.string().trim().min(1).max(30),
    ownerLabel: z.string().trim().max(120).optional(),
    provenance: z.string().trim().max(300).optional(),
    location: z.string().trim().max(160).optional(),
    eligibleForFire: z.boolean().default(false),
    notes: z.string().trim().max(1_000).optional(),
    grossWeightGrams: optionalNumber(z.coerce.number().nonnegative().max(1_000_000_000)),
    purityPercent: optionalNumber(z.coerce.number().min(0).max(100)),
    ownershipPercent: optionalNumber(z.coerce.number().min(0).max(100)),
    liquidationPercent: optionalNumber(z.coerce.number().min(0).max(100)),
    appraisalValue: optionalNumber(z.coerce.number().nonnegative().max(1_000_000_000_000_000)),
    appraisalCurrency: z
      .string()
      .trim()
      .regex(/^[A-Z]{3}$/)
      .optional()
      .or(z.literal("")),
    asOf: z.iso.date().optional(),
  })
  .superRefine((input, context) => {
    if ((input.appraisalValue == null) !== !input.appraisalCurrency) {
      context.addIssue({
        code: "custom",
        path: ["appraisalCurrency"],
        message: "Appraisal value and currency must be provided together",
      });
    }
    if (input.eligibleForFire && input.liquidationPercent == null) {
      context.addIssue({
        code: "custom",
        path: ["liquidationPercent"],
        message: "A liquidation factor is required before an item can count toward FIRE",
      });
    }
  });

function asOfDate(value?: string) {
  return value ? new Date(`${value}T12:00:00.000Z`) : new Date();
}

export async function saveCommodityInventoryItem(userId: string, raw: unknown) {
  const input = commodityInventoryInput.parse(raw);
  const [holding] = await db
    .select({ id: commodityHolding.id })
    .from(commodityHolding)
    .where(
      and(eq(commodityHolding.id, input.commodityHoldingId), eq(commodityHolding.userId, userId)),
    )
    .limit(1);
  if (!holding) throw new Error("Commodity holding not found");

  let item: typeof commodityInventoryItem.$inferSelect | undefined;
  if (input.id) {
    [item] = await db
      .update(commodityInventoryItem)
      .set({
        commodityHoldingId: input.commodityHoldingId,
        name: input.name,
        itemCount: input.itemCount.toString(),
        countUnit: input.countUnit,
        ownerLabel: input.ownerLabel || null,
        provenance: input.provenance || null,
        location: input.location || null,
        eligibleForFire: input.eligibleForFire,
        notes: input.notes || null,
        updatedAt: new Date(),
      })
      .where(
        and(eq(commodityInventoryItem.id, input.id), eq(commodityInventoryItem.userId, userId)),
      )
      .returning();
  } else {
    [item] = await db
      .insert(commodityInventoryItem)
      .values({
        userId,
        commodityHoldingId: input.commodityHoldingId,
        name: input.name,
        itemCount: input.itemCount.toString(),
        countUnit: input.countUnit,
        ownerLabel: input.ownerLabel || null,
        provenance: input.provenance || null,
        location: input.location || null,
        eligibleForFire: input.eligibleForFire,
        notes: input.notes || null,
      })
      .returning();
  }
  if (!item)
    throw new Error(input.id ? "Inventory item not found" : "Could not save inventory item");

  const asOf = asOfDate(input.asOf);
  await db
    .insert(commodityInventorySnapshot)
    .values({
      userId,
      itemId: item.id,
      asOf,
      grossWeightGrams: input.grossWeightGrams?.toString() ?? null,
      purityFraction: input.purityPercent == null ? null : (input.purityPercent / 100).toString(),
      ownershipShare:
        input.ownershipPercent == null ? null : (input.ownershipPercent / 100).toString(),
      liquidationFactor:
        input.liquidationPercent == null ? null : (input.liquidationPercent / 100).toString(),
      appraisalValue: input.appraisalValue?.toString() ?? null,
      appraisalCurrency: input.appraisalCurrency || null,
      source: "manual",
    })
    .onConflictDoUpdate({
      target: [commodityInventorySnapshot.itemId, commodityInventorySnapshot.asOf],
      set: {
        grossWeightGrams: input.grossWeightGrams?.toString() ?? null,
        purityFraction: input.purityPercent == null ? null : (input.purityPercent / 100).toString(),
        ownershipShare:
          input.ownershipPercent == null ? null : (input.ownershipPercent / 100).toString(),
        liquidationFactor:
          input.liquidationPercent == null ? null : (input.liquidationPercent / 100).toString(),
        appraisalValue: input.appraisalValue?.toString() ?? null,
        appraisalCurrency: input.appraisalCurrency || null,
        source: "manual",
      },
    });
  await recordAuditEvent({
    userId,
    action: input.id ? "updated" : "created",
    entityType: "commodity_inventory_item",
    entityId: item.id,
    metadata: {
      commodityHoldingId: input.commodityHoldingId,
      eligibleForFire: input.eligibleForFire,
    },
  });
  return { id: item.id };
}

export async function archiveCommodityInventoryItem(userId: string, id: string) {
  const parsedId = z.uuid().parse(id);
  const [item] = await db
    .update(commodityInventoryItem)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(commodityInventoryItem.id, parsedId), eq(commodityInventoryItem.userId, userId)))
    .returning({ id: commodityInventoryItem.id });
  if (!item) throw new Error("Inventory item not found");
  await recordAuditEvent({
    userId,
    action: "archived",
    entityType: "commodity_inventory_item",
    entityId: item.id,
  });
  return item;
}
