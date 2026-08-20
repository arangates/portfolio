import "server-only";

import {
  commodityHolding,
  commodityInventoryItem,
  commodityInventorySnapshot,
  commoditySnapshot,
  db,
} from "@portfolio/db";
import { and, desc, eq, isNull } from "drizzle-orm";

function latestBy<T>(rows: T[], key: (row: T) => string) {
  const latest = new Map<string, T>();
  for (const row of rows) {
    const id = key(row);
    if (!latest.has(id)) latest.set(id, row);
  }
  return latest;
}

export async function getCommodityInventoryDashboard(userId: string) {
  const [holdingRows, itemRows, snapshotRows] = await Promise.all([
    db
      .select({
        id: commodityHolding.id,
        name: commodityHolding.name,
        commodityType: commodityHolding.commodityType,
        location: commodityHolding.location,
        quantityGrams: commoditySnapshot.quantityGrams,
        ownershipShare: commoditySnapshot.ownershipShare,
        pricePerGram: commoditySnapshot.pricePerGram,
        currency: commoditySnapshot.currency,
        asOf: commoditySnapshot.asOf,
      })
      .from(commodityHolding)
      .leftJoin(
        commoditySnapshot,
        and(
          eq(commodityHolding.id, commoditySnapshot.commodityHoldingId),
          eq(commoditySnapshot.userId, userId),
        ),
      )
      .where(and(eq(commodityHolding.userId, userId), isNull(commodityHolding.archivedAt)))
      .orderBy(desc(commoditySnapshot.asOf)),
    db
      .select()
      .from(commodityInventoryItem)
      .where(
        and(eq(commodityInventoryItem.userId, userId), isNull(commodityInventoryItem.archivedAt)),
      )
      .orderBy(commodityInventoryItem.name),
    db
      .select()
      .from(commodityInventorySnapshot)
      .where(eq(commodityInventorySnapshot.userId, userId))
      .orderBy(desc(commodityInventorySnapshot.asOf), desc(commodityInventorySnapshot.createdAt)),
  ]);

  const holdingLatest = latestBy(holdingRows, (row) => row.id);
  const snapshotLatest = latestBy(snapshotRows, (row) => row.itemId);
  const historyCounts = new Map<string, number>();
  for (const row of snapshotRows) {
    historyCounts.set(row.itemId, (historyCounts.get(row.itemId) ?? 0) + 1);
  }

  const holdings = [...holdingLatest.values()].map((row) => ({
    ...row,
    quantityGrams: row.quantityGrams == null ? null : Number(row.quantityGrams),
    ownershipShare: row.ownershipShare == null ? null : Number(row.ownershipShare),
    pricePerGram: row.pricePerGram == null ? null : Number(row.pricePerGram),
  }));
  const holdingMap = new Map(holdings.map((holding) => [holding.id, holding]));

  const items = itemRows.map((item) => {
    const snapshot = snapshotLatest.get(item.id);
    const holding = holdingMap.get(item.commodityHoldingId);
    const grossWeightGrams =
      snapshot?.grossWeightGrams == null ? null : Number(snapshot.grossWeightGrams);
    const purityFraction =
      snapshot?.purityFraction == null ? null : Number(snapshot.purityFraction);
    const ownershipShare =
      snapshot?.ownershipShare == null ? null : Number(snapshot.ownershipShare);
    const liquidationFactor =
      snapshot?.liquidationFactor == null ? null : Number(snapshot.liquidationFactor);
    const appraisalValue =
      snapshot?.appraisalValue == null ? null : Number(snapshot.appraisalValue);
    const pureWeightGrams =
      grossWeightGrams == null || purityFraction == null ? null : grossWeightGrams * purityFraction;
    const spotValue =
      pureWeightGrams == null || holding?.pricePerGram == null || ownershipShare == null
        ? null
        : pureWeightGrams * holding.pricePerGram * ownershipShare;
    const appraisedOwnedValue =
      appraisalValue == null || ownershipShare == null ? null : appraisalValue * ownershipShare;
    const ownedValue = appraisedOwnedValue ?? spotValue;
    const valuationCurrency =
      appraisedOwnedValue == null
        ? (holding?.currency ?? null)
        : (snapshot?.appraisalCurrency ?? null);
    const liquidationValue =
      ownedValue == null || liquidationFactor == null ? null : ownedValue * liquidationFactor;

    return {
      id: item.id,
      commodityHoldingId: item.commodityHoldingId,
      holdingName: holding?.name ?? "Unknown holding",
      commodityType: holding?.commodityType ?? "Unknown",
      name: item.name,
      itemCount: Number(item.itemCount),
      countUnit: item.countUnit,
      ownerLabel: item.ownerLabel,
      provenance: item.provenance,
      location: item.location ?? holding?.location ?? null,
      eligibleForFire: item.eligibleForFire,
      notes: item.notes,
      sourceKey: item.sourceKey,
      grossWeightGrams,
      purityFraction,
      ownershipShare,
      liquidationFactor,
      appraisalValue,
      appraisalCurrency: snapshot?.appraisalCurrency ?? null,
      asOf: snapshot?.asOf ?? null,
      source: snapshot?.source ?? null,
      pureWeightGrams,
      spotValue,
      ownedValue,
      valuationCurrency,
      liquidationValue,
      fireEligibleValue: item.eligibleForFire ? liquidationValue : null,
      historyCount: historyCounts.get(item.id) ?? 0,
    };
  });

  const reconciliation = holdings.map((holding) => {
    const children = items.filter((item) => item.commodityHoldingId === holding.id);
    const itemizedGrossGrams = children.reduce(
      (sum, item) => sum + (item.grossWeightGrams ?? 0),
      0,
    );
    const recordedUnits = children.reduce((sum, item) => sum + item.itemCount, 0);
    const gapGrams =
      holding.quantityGrams == null ? null : holding.quantityGrams - itemizedGrossGrams;
    const coveragePercent =
      holding.quantityGrams && holding.quantityGrams > 0
        ? (itemizedGrossGrams / holding.quantityGrams) * 100
        : null;
    const status =
      children.length === 0
        ? "not-itemized"
        : gapGrams == null
          ? "no-declared-total"
          : Math.abs(gapGrams) <= 0.01
            ? "reconciled"
            : gapGrams > 0
              ? "incomplete"
              : "over-allocated";
    return {
      ...holding,
      itemRecords: children.length,
      recordedUnits,
      itemizedGrossGrams,
      gapGrams,
      coveragePercent,
      status,
    };
  });

  const fireEligibleByCurrency = new Map<string, number>();
  for (const item of items) {
    if (item.fireEligibleValue == null || !item.valuationCurrency) continue;
    fireEligibleByCurrency.set(
      item.valuationCurrency,
      (fireEligibleByCurrency.get(item.valuationCurrency) ?? 0) + item.fireEligibleValue,
    );
  }

  return {
    holdings,
    items,
    reconciliation,
    metrics: {
      itemRecords: items.length,
      recordedUnits: items.reduce((sum, item) => sum + item.itemCount, 0),
      missingWeight: items.filter((item) => item.grossWeightGrams == null).length,
      missingPurity: items.filter(
        (item) => item.grossWeightGrams != null && item.purityFraction == null,
      ).length,
      fireEligibleItems: items.filter((item) => item.eligibleForFire).length,
      fireEligibleByCurrency: Object.fromEntries(fireEligibleByCurrency),
    },
  };
}

export async function getCommodityInventoryExport(userId: string) {
  const dashboard = await getCommodityInventoryDashboard(userId);
  const history = await db
    .select()
    .from(commodityInventorySnapshot)
    .where(eq(commodityInventorySnapshot.userId, userId))
    .orderBy(desc(commodityInventorySnapshot.asOf));
  return { ...dashboard, history };
}
