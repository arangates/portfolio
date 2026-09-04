import "server-only";

import {
  db,
  mutualFundInstrumentLink,
  mutualFundNav,
  mutualFundScheme,
  mutualFundSyncRun,
} from "@portfolio/db";
import { and, eq, max, sql } from "drizzle-orm";

import { fetchMfapiCatalog, fetchMfapiFund, mfapiDateToIso } from "./mfapi-client";
import { getLatestZerodhaPortfolio } from "./portfolio-queries";

const NAV_BATCH_SIZE = 500;

function nextIsoDay(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  worker: (value: T) => Promise<R>,
) {
  const output: R[] = [];
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, async () => {
      while (cursor < values.length) {
        const index = cursor;
        cursor += 1;
        output[index] = await worker(values[index]!);
      }
    }),
  );
  return output;
}

export async function syncMutualFundNav(userId: string) {
  const portfolio = await getLatestZerodhaPortfolio(userId);
  const holdings = (portfolio?.holdings ?? []).filter((holding) => Boolean(holding.isin));
  const [run] = await db
    .insert(mutualFundSyncRun)
    .values({ userId, schemesRequested: holdings.length })
    .returning({ id: mutualFundSyncRun.id });
  if (!run) throw new Error("Unable to create the MFAPI sync audit record");

  if (holdings.length === 0) {
    await db
      .update(mutualFundSyncRun)
      .set({ status: "completed", completedAt: new Date(), summary: { message: "No holdings" } })
      .where(and(eq(mutualFundSyncRun.id, run.id), eq(mutualFundSyncRun.userId, userId)));
    return { requested: 0, matched: 0, synced: 0, navRowsWritten: 0, errors: [] };
  }

  try {
    const catalog = await fetchMfapiCatalog();
    const byIsin = new Map<string, (typeof catalog)[number]>();
    for (const item of catalog) {
      if (item.isinGrowth) byIsin.set(item.isinGrowth.trim().toUpperCase(), item);
      if (item.isinDivReinvestment) byIsin.set(item.isinDivReinvestment.trim().toUpperCase(), item);
    }

    const results = await mapWithConcurrency(holdings, 4, async (holding) => {
      const catalogItem = byIsin.get(holding.isin.trim().toUpperCase());
      if (!catalogItem) {
        await db
          .insert(mutualFundInstrumentLink)
          .values({
            userId,
            instrumentId: holding.instrumentId,
            status: "unmatched",
            errorMessage: "No exact ISIN match in the current MFAPI catalog",
          })
          .onConflictDoUpdate({
            target: [mutualFundInstrumentLink.userId, mutualFundInstrumentLink.instrumentId],
            set: {
              schemeCode: null,
              matchMethod: null,
              status: "unmatched",
              errorMessage: "No exact ISIN match in the current MFAPI catalog",
              updatedAt: new Date(),
            },
          });
        return { matched: false, synced: false, rows: 0, name: holding.name, error: null };
      }

      try {
        const [latestStored] = await db
          .select({ date: max(mutualFundNav.navDate) })
          .from(mutualFundNav)
          .where(eq(mutualFundNav.schemeCode, catalogItem.schemeCode));
        const startDate = latestStored?.date ? nextIsoDay(latestStored.date) : undefined;
        const fund = await fetchMfapiFund(catalogItem.schemeCode, { startDate });

        await db
          .insert(mutualFundScheme)
          .values({
            schemeCode: fund.meta.scheme_code,
            schemeName: fund.meta.scheme_name,
            fundHouse: fund.meta.fund_house,
            schemeType: fund.meta.scheme_type,
            schemeCategory: fund.meta.scheme_category,
            isinGrowth: fund.meta.isin_growth ?? null,
            isinDivReinvestment: fund.meta.isin_div_reinvestment ?? null,
            sourceUpdatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: mutualFundScheme.schemeCode,
            set: {
              schemeName: fund.meta.scheme_name,
              fundHouse: fund.meta.fund_house,
              schemeType: fund.meta.scheme_type,
              schemeCategory: fund.meta.scheme_category,
              isinGrowth: fund.meta.isin_growth ?? null,
              isinDivReinvestment: fund.meta.isin_div_reinvestment ?? null,
              sourceUpdatedAt: new Date(),
            },
          });

        const now = new Date();
        await db
          .insert(mutualFundInstrumentLink)
          .values({
            userId,
            instrumentId: holding.instrumentId,
            schemeCode: fund.meta.scheme_code,
            matchMethod: "exact_isin",
            status: "synced",
            matchedAt: now,
            lastSyncedAt: now,
          })
          .onConflictDoUpdate({
            target: [mutualFundInstrumentLink.userId, mutualFundInstrumentLink.instrumentId],
            set: {
              schemeCode: fund.meta.scheme_code,
              matchMethod: "exact_isin",
              status: "synced",
              errorMessage: null,
              matchedAt: now,
              lastSyncedAt: now,
              updatedAt: now,
            },
          });

        const navRows = fund.data.map((point) => ({
          schemeCode: fund.meta.scheme_code,
          navDate: mfapiDateToIso(point.date),
          nav: point.nav,
          fetchedAt: now,
        }));
        for (let index = 0; index < navRows.length; index += NAV_BATCH_SIZE) {
          const batch = navRows.slice(index, index + NAV_BATCH_SIZE);
          if (batch.length === 0) continue;
          await db
            .insert(mutualFundNav)
            .values(batch)
            .onConflictDoUpdate({
              target: [mutualFundNav.schemeCode, mutualFundNav.navDate],
              set: { nav: sql`excluded.nav`, fetchedAt: now },
            });
        }
        return {
          matched: true,
          synced: true,
          rows: navRows.length,
          name: holding.name,
          error: null,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "MFAPI sync failed";
        await db
          .insert(mutualFundInstrumentLink)
          .values({
            userId,
            instrumentId: holding.instrumentId,
            status: "error",
            errorMessage: message.slice(0, 500),
          })
          .onConflictDoUpdate({
            target: [mutualFundInstrumentLink.userId, mutualFundInstrumentLink.instrumentId],
            set: { status: "error", errorMessage: message.slice(0, 500), updatedAt: new Date() },
          });
        return { matched: true, synced: false, rows: 0, name: holding.name, error: message };
      }
    });

    const summary = {
      requested: holdings.length,
      matched: results.filter((item) => item.matched).length,
      synced: results.filter((item) => item.synced).length,
      navRowsWritten: results.reduce((sum, item) => sum + item.rows, 0),
      errors: results
        .filter((item) => item.error)
        .map((item) => ({ fund: item.name, message: item.error })),
    };
    await db
      .update(mutualFundSyncRun)
      .set({
        status: summary.errors.length === holdings.length ? "failed" : "completed",
        schemesMatched: summary.matched,
        schemesSynced: summary.synced,
        navRowsWritten: summary.navRowsWritten,
        summary,
        completedAt: new Date(),
      })
      .where(and(eq(mutualFundSyncRun.id, run.id), eq(mutualFundSyncRun.userId, userId)));
    return summary;
  } catch (error) {
    const message = error instanceof Error ? error.message : "MFAPI sync failed";
    await db
      .update(mutualFundSyncRun)
      .set({ status: "failed", errorMessage: message.slice(0, 1000), completedAt: new Date() })
      .where(and(eq(mutualFundSyncRun.id, run.id), eq(mutualFundSyncRun.userId, userId)));
    throw error;
  }
}
