import "server-only";

import { auditEvent, db, exchangeRateSnapshot } from "@portfolio/db";
import { env } from "@portfolio/env/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { parseEcbReferenceRatesXml, type EcbReferenceRate } from "./exchange-rate-parser";

const ECB_HISTORY_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.xml";
const ECB_DAILY_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";
const TWELVE_DATA_URL = "https://api.twelvedata.com/exchange_rate";
const BATCH_SIZE = 500;

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: { accept: "application/xml,text/xml;q=0.9", "user-agent": "Selvam/1.0" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Exchange-rate provider returned HTTP ${response.status}`);
  return response.text();
}

export async function fetchEcbEurInrRates(fullHistory: boolean) {
  const observations = parseEcbReferenceRatesXml(
    await fetchText(fullHistory ? ECB_HISTORY_URL : ECB_DAILY_URL),
  );
  if (observations.length === 0) throw new Error("ECB did not return any EUR/INR observations");
  return observations;
}

const twelveDataResponse = z.object({
  rate: z.coerce.number().positive(),
  timestamp: z.coerce.number().int().positive(),
});

async function fetchTwelveDataEurInrRate() {
  if (!env.TWELVE_DATA_API_KEY) return null;
  const url = new URL(TWELVE_DATA_URL);
  url.searchParams.set("symbol", "EUR/INR");
  url.searchParams.set("apikey", env.TWELVE_DATA_API_KEY);
  const response = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Twelve Data returned HTTP ${response.status}`);
  const parsed = twelveDataResponse.safeParse(await response.json());
  if (!parsed.success) throw new Error("Twelve Data returned an invalid EUR/INR quote");
  const asOf = new Date(parsed.data.timestamp * 1000);
  if (Date.now() - asOf.getTime() > 24 * 60 * 60 * 1000) {
    throw new Error("Twelve Data returned a stale EUR/INR quote");
  }
  return { rate: parsed.data.rate, asOf };
}

async function storeEcbRates(userId: string, observations: EcbReferenceRate[]) {
  const retrievedAt = new Date();
  for (let offset = 0; offset < observations.length; offset += BATCH_SIZE) {
    const batch = observations.slice(offset, offset + BATCH_SIZE);
    await db
      .insert(exchangeRateSnapshot)
      .values(
        batch.map((observation) => ({
          userId,
          // This table stores the value of one quote unit in the base currency.
          baseCurrency: "INR",
          quoteCurrency: "EUR",
          rate: observation.rate.toString(),
          source: "ecb",
          rateType: "reference",
          asOf: new Date(`${observation.date}T12:00:00.000Z`),
          retrievedAt,
        })),
      )
      .onConflictDoUpdate({
        target: [
          exchangeRateSnapshot.userId,
          exchangeRateSnapshot.baseCurrency,
          exchangeRateSnapshot.quoteCurrency,
          exchangeRateSnapshot.asOf,
        ],
        set: {
          rate: sql`excluded.rate`,
          source: "ecb",
          rateType: "reference",
          retrievedAt,
        },
      });
  }
}

export async function syncEurInrExchangeRates(userId: string, fullHistory = false) {
  const [existingOfficial] = await db
    .select({ id: exchangeRateSnapshot.id })
    .from(exchangeRateSnapshot)
    .where(and(eq(exchangeRateSnapshot.userId, userId), eq(exchangeRateSnapshot.source, "ecb")))
    .limit(1);
  const shouldFetchHistory = fullHistory || !existingOfficial;
  const observations = await fetchEcbEurInrRates(shouldFetchHistory);
  await storeEcbRates(userId, observations);

  let indicative: { rate: number; asOf: Date } | null = null;
  let indicativeError: string | null = null;
  if (env.TWELVE_DATA_API_KEY) {
    try {
      indicative = await fetchTwelveDataEurInrRate();
      if (indicative) {
        await db
          .insert(exchangeRateSnapshot)
          .values({
            userId,
            baseCurrency: "INR",
            quoteCurrency: "EUR",
            rate: indicative.rate.toString(),
            source: "twelve_data",
            rateType: "indicative",
            asOf: indicative.asOf,
          })
          .onConflictDoNothing();
      }
    } catch (error) {
      indicativeError = error instanceof Error ? error.message : "Intraday quote failed";
    }
  }

  const latestOfficial = observations.at(-1)!;
  await db.insert(auditEvent).values({
    userId,
    action: "synced",
    entityType: "exchange_rate",
    metadata: {
      pair: "EUR/INR",
      officialSource: "ecb",
      officialObservations: observations.length,
      fullHistory: shouldFetchHistory,
      indicativeSource: env.TWELVE_DATA_API_KEY ? "twelve_data" : null,
      indicativeAvailable: Boolean(indicative),
    },
  });

  return {
    official: {
      source: "European Central Bank",
      imported: observations.length,
      latestDate: latestOfficial.date,
      latestRate: latestOfficial.rate,
      fullHistory: shouldFetchHistory,
    },
    indicative: indicative
      ? { source: "Twelve Data", rate: indicative.rate, asOf: indicative.asOf.toISOString() }
      : null,
    indicativeError,
    liveConfigured: Boolean(env.TWELVE_DATA_API_KEY),
  };
}

export async function getEurInrExchangeRateStatus(userId: string) {
  const [official, indicative, aggregate] = await Promise.all([
    db
      .select({ rate: exchangeRateSnapshot.rate, asOf: exchangeRateSnapshot.asOf })
      .from(exchangeRateSnapshot)
      .where(and(eq(exchangeRateSnapshot.userId, userId), eq(exchangeRateSnapshot.source, "ecb")))
      .orderBy(desc(exchangeRateSnapshot.asOf))
      .limit(1),
    db
      .select({ rate: exchangeRateSnapshot.rate, asOf: exchangeRateSnapshot.asOf })
      .from(exchangeRateSnapshot)
      .where(
        and(
          eq(exchangeRateSnapshot.userId, userId),
          eq(exchangeRateSnapshot.source, "twelve_data"),
        ),
      )
      .orderBy(desc(exchangeRateSnapshot.asOf))
      .limit(1),
    db
      .select({
        count: sql<number>`count(*)::int`,
        first: sql<string | null>`min(${exchangeRateSnapshot.asOf})::text`,
      })
      .from(exchangeRateSnapshot)
      .where(and(eq(exchangeRateSnapshot.userId, userId), eq(exchangeRateSnapshot.source, "ecb"))),
  ]);
  return {
    official: official[0]
      ? { rate: Number(official[0].rate), asOf: official[0].asOf.toISOString() }
      : null,
    indicative: indicative[0]
      ? { rate: Number(indicative[0].rate), asOf: indicative[0].asOf.toISOString() }
      : null,
    historyCount: aggregate[0]?.count ?? 0,
    historyStartsAt: aggregate[0]?.first ? new Date(aggregate[0].first).toISOString() : null,
    liveConfigured: Boolean(env.TWELVE_DATA_API_KEY),
  };
}
