import "server-only";

import { createHash } from "node:crypto";

import {
  auditEvent,
  db,
  importBatch,
  instrument,
  ledgerEntry,
  portfolioSource,
  positionSnapshot,
  zerodhaConnection,
} from "@portfolio/db";
import { and, eq } from "drizzle-orm";

import { getKiteHoldings, getKitePositions, getKiteTrades, type KiteTrade } from "./kite-client";

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function ensureSource(userId: string) {
  const [existing] = await db
    .select()
    .from(portfolioSource)
    .where(
      and(
        eq(portfolioSource.userId, userId),
        eq(portfolioSource.provider, "zerodha"),
        eq(portfolioSource.name, "Kite Connect"),
      ),
    )
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(portfolioSource)
    .values({ userId, provider: "zerodha", name: "Kite Connect", baseCurrency: "INR" })
    .onConflictDoNothing()
    .returning();
  if (created) return created;

  const [concurrent] = await db
    .select()
    .from(portfolioSource)
    .where(
      and(
        eq(portfolioSource.userId, userId),
        eq(portfolioSource.provider, "zerodha"),
        eq(portfolioSource.name, "Kite Connect"),
      ),
    )
    .limit(1);
  if (!concurrent) throw new Error("Could not create Zerodha portfolio source");
  return concurrent;
}

async function ensureInstrument(
  userId: string,
  holding: { isin: string; tradingsymbol: string; exchange: string },
) {
  const isin = holding.isin.trim().toUpperCase();
  const [existing] = await db
    .select()
    .from(instrument)
    .where(and(eq(instrument.userId, userId), eq(instrument.isin, isin)))
    .limit(1);
  if (existing) return existing;

  const name = holding.tradingsymbol || isin;
  const assetClass = holding.exchange === "BSE" || holding.exchange === "NSE" ? "equity" : "other";
  const [created] = await db
    .insert(instrument)
    .values({ userId, isin, symbol: holding.tradingsymbol, name, assetClass, currency: "INR" })
    .onConflictDoNothing()
    .returning();
  if (created) return created;

  const [concurrent] = await db
    .select()
    .from(instrument)
    .where(and(eq(instrument.userId, userId), eq(instrument.isin, isin)))
    .limit(1);
  if (!concurrent) throw new Error(`Could not create instrument for ${isin}`);
  return concurrent;
}

export async function getActiveConnection(userId: string) {
  const [connection] = await db
    .select()
    .from(zerodhaConnection)
    .where(eq(zerodhaConnection.userId, userId))
    .limit(1);
  if (!connection) return null;
  if (connection.expiresAt < new Date()) return null;
  return connection;
}

export async function saveConnection(opts: {
  userId: string;
  accessToken: string;
  publicToken: string | null;
  loginTime: Date;
}) {
  const expiresAt = new Date(opts.loginTime);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + 1);
  expiresAt.setUTCHours(0, 30, 0, 0);

  await db
    .insert(zerodhaConnection)
    .values({
      userId: opts.userId,
      accessToken: opts.accessToken,
      publicToken: opts.publicToken,
      loginTime: opts.loginTime,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: zerodhaConnection.userId,
      set: {
        accessToken: opts.accessToken,
        publicToken: opts.publicToken,
        loginTime: opts.loginTime,
        expiresAt,
        updatedAt: new Date(),
      },
    });
}

export async function syncZerodhaPortfolio(userId: string) {
  const connection = await getActiveConnection(userId);
  if (!connection) {
    throw new Error("No active Zerodha connection. Please connect your account first.");
  }

  const source = await ensureSource(userId);
  const now = new Date();
  const dateTag = now.toISOString().slice(0, 10);
  const syncHash = hash(`kite_sync:${userId}:${now.toISOString()}`);

  const [holdings, positions, trades] = await Promise.all([
    getKiteHoldings(connection.accessToken),
    getKitePositions(connection.accessToken),
    getKiteTrades(connection.accessToken),
  ]);

  const batch = await createSyncBatch(userId, source.id, syncHash, dateTag, {
    holdingsCount: holdings.length,
    positionsCount: positions.net.length,
    tradesCount: trades.length,
  });

  let holdingsSynced = 0;
  let tradesSynced = 0;
  const errors: Array<{ item: string; message: string }> = [];

  for (const holding of holdings) {
    if (!holding.isin) continue;
    try {
      const inst = await ensureInstrument(userId, holding);
      const rowHash = hash(JSON.stringify(holding));
      await db
        .insert(positionSnapshot)
        .values({
          userId,
          sourceId: source.id,
          batchId: batch.id,
          instrumentId: inst.id,
          snapshotAt: now,
          quantity: holding.quantity.toString(),
          averagePrice: holding.average_price.toString(),
          marketPrice: holding.last_price.toString(),
          investedValue: (holding.quantity * holding.average_price).toString(),
          marketValue: (holding.quantity * holding.last_price).toString(),
          unrealizedPnl: holding.pnl.toString(),
          rawRowHash: rowHash,
        })
        .onConflictDoNothing();
      holdingsSynced += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to sync holding";
      errors.push({ item: holding.tradingsymbol, message });
    }
  }

  for (const trade of trades) {
    try {
      const tradeInst = await ensureInstrumentFromTrade(userId, trade);
      const entryKey = `kite_trade:${trade.trade_id}:${trade.order_id}`;
      const rowHash = hash(JSON.stringify(trade));
      const occurredAt = new Date(trade.fill_timestamp || trade.order_timestamp);
      const isBuy = trade.transaction_type === "BUY";
      const grossAmount = trade.quantity * trade.average_price;

      await db
        .insert(ledgerEntry)
        .values({
          userId,
          sourceId: source.id,
          batchId: batch.id,
          instrumentId: tradeInst?.id ?? null,
          externalId: trade.trade_id,
          entryKey,
          occurredAt,
          entryType: isBuy ? "buy" : "sell",
          description: `${trade.transaction_type} ${trade.quantity} ${trade.tradingsymbol} @ ${trade.average_price}`,
          quantity: (isBuy ? trade.quantity : -trade.quantity).toString(),
          price: trade.average_price.toString(),
          grossAmount: (isBuy ? grossAmount : -grossAmount).toString(),
          currency: "INR",
          rawRowHash: rowHash,
        })
        .onConflictDoNothing();
      tradesSynced += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to sync trade";
      errors.push({ item: `Trade ${trade.trade_id}`, message });
    }
  }

  const summary = {
    holdingsTotal: holdings.length,
    holdingsSynced,
    positionsTotal: positions.net.length,
    tradesTotal: trades.length,
    tradesSynced,
    errors,
    syncedAt: now.toISOString(),
  };

  await db
    .update(importBatch)
    .set({
      status: errors.length === 0 ? "completed" : "completed_with_errors",
      rowCount: holdings.length + trades.length,
      insertedRows: holdingsSynced + tradesSynced,
      skippedRows: holdings.length + trades.length - holdingsSynced - tradesSynced,
      summary,
      completedAt: now,
    })
    .where(and(eq(importBatch.id, batch.id), eq(importBatch.userId, userId)));

  await db
    .update(zerodhaConnection)
    .set({ lastSyncAt: now })
    .where(eq(zerodhaConnection.userId, userId));

  await db.insert(auditEvent).values({
    userId,
    action: "zerodha_sync",
    entityType: "import_batch",
    entityId: batch.id,
    metadata: summary,
  });

  return summary;
}

async function ensureInstrumentFromTrade(userId: string, trade: KiteTrade) {
  const symbol = trade.tradingsymbol;
  const [existing] = await db
    .select()
    .from(instrument)
    .where(and(eq(instrument.userId, userId), eq(instrument.symbol, symbol)))
    .limit(1);
  if (existing) return existing;
  return null;
}

async function createSyncBatch(
  userId: string,
  sourceId: string,
  fileHash: string,
  dateTag: string,
  counts: { holdingsCount: number; positionsCount: number; tradesCount: number },
) {
  const [created] = await db
    .insert(importBatch)
    .values({
      userId,
      sourceId,
      kind: "zerodha_kite_sync",
      fileName: `kite-sync-${dateTag}.json`,
      fileHash,
      statementDate: dateTag,
      summary: counts,
    })
    .returning();
  if (!created) throw new Error("Could not create sync batch");
  return created;
}
