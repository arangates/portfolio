import "server-only";
import {
  db,
  bankAccount,
  bankBalanceSnapshot,
  fixedDeposit,
  fixedDepositSnapshot,
  commodityHolding,
  commoditySnapshot,
  manualAsset,
  manualAssetSnapshot,
  realEstateProperty,
  realEstateSnapshot,
  positionSnapshot,
  instrument,
  portfolioSource,
  importBatch,
} from "@portfolio/db";
import { and, eq, isNull, sql } from "drizzle-orm";
import { compareSnapshots, type SnapshotEvidence } from "./insight-calculations";

export async function getSnapshotEvidence(userId: string): Promise<SnapshotEvidence[]> {
  const [banks, deposits, metals, manual, property, equity] = await Promise.all([
    db
      .select({
        id: bankAccount.id,
        name: bankAccount.name,
        currency: bankAccount.currency,
        asOf: bankBalanceSnapshot.asOf,
        createdAt: bankBalanceSnapshot.createdAt,
        value: bankBalanceSnapshot.amount,
      })
      .from(bankBalanceSnapshot)
      .innerJoin(
        bankAccount,
        and(eq(bankAccount.id, bankBalanceSnapshot.accountId), eq(bankAccount.userId, userId)),
      )
      .where(and(eq(bankBalanceSnapshot.userId, userId), isNull(bankAccount.archivedAt))),
    db
      .select({
        id: fixedDeposit.id,
        name: fixedDeposit.bank,
        currency: fixedDeposit.currency,
        asOf: fixedDepositSnapshot.asOf,
        createdAt: fixedDepositSnapshot.createdAt,
        value: fixedDepositSnapshot.principal,
      })
      .from(fixedDepositSnapshot)
      .innerJoin(
        fixedDeposit,
        and(
          eq(fixedDeposit.id, fixedDepositSnapshot.fixedDepositId),
          eq(fixedDeposit.userId, userId),
        ),
      )
      .where(and(eq(fixedDepositSnapshot.userId, userId), isNull(fixedDeposit.archivedAt))),
    db
      .select({
        id: commodityHolding.id,
        name: commodityHolding.name,
        currency: commoditySnapshot.currency,
        asOf: commoditySnapshot.asOf,
        createdAt: commoditySnapshot.createdAt,
        value: sql<string>`${commoditySnapshot.quantityGrams} * ${commoditySnapshot.pricePerGram} * ${commoditySnapshot.ownershipShare}`,
        quantity: commoditySnapshot.quantityGrams,
        price: commoditySnapshot.pricePerGram,
        share: commoditySnapshot.ownershipShare,
      })
      .from(commoditySnapshot)
      .innerJoin(
        commodityHolding,
        and(
          eq(commodityHolding.id, commoditySnapshot.commodityHoldingId),
          eq(commodityHolding.userId, userId),
        ),
      )
      .where(and(eq(commoditySnapshot.userId, userId), isNull(commodityHolding.archivedAt))),
    db
      .select({
        id: manualAsset.id,
        name: manualAsset.name,
        currency: manualAssetSnapshot.currency,
        asOf: manualAssetSnapshot.asOf,
        createdAt: manualAssetSnapshot.createdAt,
        value: sql<string>`${manualAssetSnapshot.value} * ${manualAssetSnapshot.ownershipShare}`,
      })
      .from(manualAssetSnapshot)
      .innerJoin(
        manualAsset,
        and(eq(manualAsset.id, manualAssetSnapshot.assetId), eq(manualAsset.userId, userId)),
      )
      .where(and(eq(manualAssetSnapshot.userId, userId), isNull(manualAsset.archivedAt))),
    db
      .select({
        id: realEstateProperty.id,
        name: realEstateProperty.name,
        currency: realEstateSnapshot.currency,
        asOf: realEstateSnapshot.asOf,
        createdAt: realEstateSnapshot.createdAt,
        value: sql<string>`${realEstateSnapshot.marketValue} * ${realEstateSnapshot.ownershipShare}`,
        quantity: realEstateSnapshot.areaSquareFeet,
        price: realEstateSnapshot.pricePerSquareFoot,
        share: realEstateSnapshot.ownershipShare,
      })
      .from(realEstateSnapshot)
      .innerJoin(
        realEstateProperty,
        and(
          eq(realEstateProperty.id, realEstateSnapshot.propertyId),
          eq(realEstateProperty.userId, userId),
        ),
      )
      .where(and(eq(realEstateSnapshot.userId, userId), isNull(realEstateProperty.archivedAt))),
    db
      .select({
        id: instrument.id,
        sourceId: positionSnapshot.sourceId,
        batchId: positionSnapshot.batchId,
        provider: portfolioSource.provider,
        name: instrument.name,
        currency: instrument.currency,
        asOf: positionSnapshot.snapshotAt,
        createdAt: importBatch.createdAt,
        value: positionSnapshot.marketValue,
        quantity: positionSnapshot.quantity,
        price: positionSnapshot.marketPrice,
      })
      .from(positionSnapshot)
      .innerJoin(
        portfolioSource,
        and(eq(portfolioSource.id, positionSnapshot.sourceId), eq(portfolioSource.userId, userId)),
      )
      .innerJoin(
        importBatch,
        and(
          eq(importBatch.id, positionSnapshot.batchId),
          eq(importBatch.userId, userId),
          eq(importBatch.status, "completed"),
        ),
      )
      .innerJoin(
        instrument,
        and(eq(instrument.id, positionSnapshot.instrumentId), eq(instrument.userId, userId)),
      )
      .where(eq(positionSnapshot.userId, userId)),
  ]);
  type Row = {
    id: string;
    name: string;
    currency: string;
    asOf: Date;
    createdAt: Date;
    value: string | null;
    quantity?: string | null;
    price?: string | null;
    share?: string;
  };
  const normalize = (rows: Row[], kind: string, href: string) =>
    rows.map((row) => ({
      key: `${kind}-${row.id}`,
      name: row.name,
      kind,
      href,
      currency: row.currency,
      asOf: row.asOf.toISOString(),
      createdAt: row.createdAt.toISOString(),
      value: row.value === null ? null : Number(row.value),
      quantity: row.quantity == null ? null : Number(row.quantity),
      price: row.price == null ? null : Number(row.price),
      share: row.share === undefined ? 1 : Number(row.share),
    }));
  return [
    ...normalize(banks, "Bank", "/dashboard/inr").map((row) => ({
      ...row,
      href: row.currency === "EUR" ? "/dashboard/eur" : row.href,
    })),
    ...normalize(deposits, "Deposit", "/dashboard/fixed-deposits"),
    ...normalize(metals, "Commodity", "/dashboard/commodities"),
    ...normalize(manual, "Manual asset", "/dashboard"),
    ...normalize(property, "Property", "/dashboard/real-estate"),
    ...equity.flatMap((row) =>
      normalize(
        [{ ...row, id: `${row.sourceId}-${row.id}` }],
        "Equity",
        row.provider === "degiro" ? "/dashboard/global-equity" : "/dashboard/indian-equity",
      ).map((item) => ({ ...item, sourceKey: row.sourceId, revisionId: row.batchId })),
    ),
  ];
}
export async function getSnapshotChanges(userId: string) {
  return compareSnapshots(await getSnapshotEvidence(userId));
}
