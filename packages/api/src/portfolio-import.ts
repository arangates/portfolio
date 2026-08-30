import { createHash } from "node:crypto";

import {
  db,
  importBatch,
  importRow,
  instrument,
  ledgerEntry,
  portfolioSource,
  positionSnapshot,
} from "@portfolio/db";
import { and, desc, eq } from "drizzle-orm";
import ExcelJS from "exceljs";
import Papa from "papaparse";

export type PortfolioImportKind = "zerodha_holdings" | "zerodha_tradebook" | "degiro";

export type PortfolioImportFile = {
  name: string;
  type: string;
  bytes: Uint8Array;
};

export type PortfolioImportResult = {
  batchId: string;
  fileName: string;
  kind: string;
  duplicate: boolean;
  rowCount: number;
  insertedRows: number;
  skippedRows: number;
};

type RawRow = {
  rowNumber: number;
  values: unknown[];
  payload: Record<string, unknown>;
  rowHash: string;
};

const CHUNK_SIZE = 200;
const MAX_IMPORT_ROWS = 100_000;

function hash(value: string | Uint8Array) {
  return createHash("sha256").update(value).digest("hex");
}

function stableRowHash(values: unknown[]) {
  return hash(JSON.stringify(values.map((value) => normalizeValue(value))));
}

function normalizeValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object") {
    if ("result" in value) {
      return normalizeValue((value as { result?: unknown }).result);
    }
    if ("text" in value) {
      return normalizeValue((value as { text?: unknown }).text);
    }
    if ("richText" in value) {
      const richText = (value as { richText?: Array<{ text?: string }> }).richText;
      return richText?.map((part) => part.text ?? "").join("") ?? "";
    }
  }
  return value;
}

function stringValue(value: unknown) {
  const normalized = normalizeValue(value);
  return normalized === "" ? "" : String(normalized);
}

function numberValue(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const raw = stringValue(value).trim();
  if (!raw) return null;
  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw.replace(/,/g, "");
  const parsed = Number(normalized.replace(/[^0-9.+-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function decimal(value: number | null) {
  return value === null ? null : value.toString();
}

function uniqueHeaders(values: unknown[]) {
  const used = new Map<string, number>();
  return values.map((value, index) => {
    const base = stringValue(value) || `column_${index + 1}`;
    const count = (used.get(base) ?? 0) + 1;
    used.set(base, count);
    return count === 1 ? base : `${base}_${count}`;
  });
}

function rowPayload(headers: string[], values: unknown[]) {
  return Object.fromEntries(
    headers.map((header, index) => [header, normalizeValue(values[index])]),
  );
}

function parseEuropeanDate(dateValue: unknown, timeValue?: unknown) {
  const dateText = stringValue(dateValue);
  const match = dateText.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const timeMatch = stringValue(timeValue).match(/^(\d{1,2}):(\d{2})/);
  const hour = Number(timeMatch?.[1] ?? 12);
  const minute = Number(timeMatch?.[2] ?? 0);
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), hour, minute));
}

function parseStatementDate(value: string) {
  const iso = value.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const european = value.match(/\b(\d{2})-(\d{2})-(20\d{2})\b/);
  if (european) return `${european[3]}-${european[2]}-${european[1]}`;
  return null;
}

function parseIsoDate(value: unknown) {
  const text = stringValue(value).trim();
  const match = text.match(/^(20\d{2})-(\d{2})-(\d{2})(?:[T\s](\d{1,2}):(\d{2}))?/);
  if (!match) return null;
  const [, year, month, day, hour = "12", minute = "0"] = match;
  const parsed = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)),
  );
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseStatementPeriod(value: string) {
  const dates = [...value.matchAll(/\b(20\d{2})-(\d{2})-(\d{2})\b/g)].map(
    ([, year, month, day]) => `${year}-${month}-${day}`,
  );
  return { from: dates[0] ?? null, to: dates[1] ?? dates[0] ?? null };
}

async function ensureSource(
  userId: string,
  provider: "zerodha" | "degiro",
  name: string,
  baseCurrency: "INR" | "EUR",
) {
  const [existing] = await db
    .select()
    .from(portfolioSource)
    .where(
      and(
        eq(portfolioSource.userId, userId),
        eq(portfolioSource.provider, provider),
        eq(portfolioSource.name, name),
      ),
    )
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(portfolioSource)
    .values({ userId, provider, name, baseCurrency })
    .onConflictDoNothing()
    .returning();
  if (created) return created;

  const [concurrent] = await db
    .select()
    .from(portfolioSource)
    .where(
      and(
        eq(portfolioSource.userId, userId),
        eq(portfolioSource.provider, provider),
        eq(portfolioSource.name, name),
      ),
    )
    .limit(1);
  if (!concurrent) throw new Error("Could not create portfolio source");
  return concurrent;
}

async function findDuplicateBatch(userId: string, kind: string, fileHash: string) {
  const [existing] = await db
    .select()
    .from(importBatch)
    .where(
      and(
        eq(importBatch.userId, userId),
        eq(importBatch.kind, kind),
        eq(importBatch.fileHash, fileHash),
      ),
    )
    .limit(1);
  return existing;
}

async function createBatch(
  userId: string,
  sourceId: string,
  kind: string,
  file: PortfolioImportFile,
  fileHash: string,
) {
  const [created] = await db
    .insert(importBatch)
    .values({
      userId,
      sourceId,
      kind,
      fileName: file.name,
      fileHash,
    })
    .returning();
  if (!created) throw new Error("Could not create import batch");
  return created;
}

async function saveRawRows(userId: string, batchId: string, rows: RawRow[]) {
  for (let index = 0; index < rows.length; index += CHUNK_SIZE) {
    const chunk = rows.slice(index, index + CHUNK_SIZE);
    if (chunk.length === 0) continue;
    await db.insert(importRow).values(
      chunk.map((row) => ({
        userId,
        batchId,
        rowNumber: row.rowNumber,
        rowHash: row.rowHash,
        payload: row.payload,
      })),
    );
  }
}

async function ensureInstrument(input: {
  userId: string;
  isin: string;
  symbol?: string;
  name: string;
  assetClass: string;
  currency: string;
}) {
  const [saved] = await db
    .insert(instrument)
    .values(input)
    .onConflictDoUpdate({
      target: [instrument.userId, instrument.isin],
      set: {
        symbol: input.symbol,
        name: input.name,
        assetClass: input.assetClass,
        currency: input.currency,
      },
    })
    .returning();
  if (!saved) throw new Error(`Could not save instrument ${input.isin}`);
  return saved;
}

async function completeBatch(
  batchId: string,
  input: {
    statementDate?: string | null;
    rowCount: number;
    insertedRows: number;
    skippedRows: number;
    summary: Record<string, unknown>;
  },
) {
  await db
    .update(importBatch)
    .set({
      ...input,
      statementDate: input.statementDate ?? null,
      status: "completed",
      completedAt: new Date(),
    })
    .where(eq(importBatch.id, batchId));
}

async function failBatch(batchId: string, error: unknown) {
  await db
    .update(importBatch)
    .set({
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown import error",
      completedAt: new Date(),
    })
    .where(eq(importBatch.id, batchId));
}

async function importZerodha(userId: string, file: PortfolioImportFile) {
  const kind = "zerodha_holdings";
  const fileHash = hash(file.bytes);
  const duplicate = await findDuplicateBatch(userId, kind, fileHash);
  if (duplicate) {
    return {
      batchId: duplicate.id,
      fileName: duplicate.fileName,
      kind,
      duplicate: true,
      rowCount: duplicate.rowCount,
      insertedRows: duplicate.insertedRows,
      skippedRows: duplicate.skippedRows,
    } satisfies PortfolioImportResult;
  }

  const source = await ensureSource(userId, "zerodha", "Zerodha Console", "INR");
  const batch = await createBatch(userId, source.id, kind, file, fileHash);

  try {
    const workbook = new ExcelJS.Workbook();
    if (file.bytes[0] !== 0x50 || file.bytes[1] !== 0x4b) {
      throw new Error("The selected file is not a valid XLSX workbook");
    }
    await workbook.xlsx.load(
      file.bytes.slice().buffer as unknown as Parameters<typeof workbook.xlsx.load>[0],
    );
    const worksheets = ["Equity", "Mutual Funds"]
      .map((name) => workbook.getWorksheet(name))
      .filter((worksheet): worksheet is ExcelJS.Worksheet => Boolean(worksheet));
    if (worksheets.length === 0) {
      throw new Error("Expected an Equity or Mutual Funds worksheet");
    }

    const rawRows: RawRow[] = [];
    let statementDate: string | null = null;
    let insertedRows = 0;
    let skippedRows = 0;
    let investedValue = 0;
    let marketValue = 0;

    for (const worksheet of worksheets) {
      const preamble = Array.from({ length: Math.min(15, worksheet.rowCount) }, (_, index) => {
        const row = worksheet.getRow(index + 1);
        return Array.from({ length: row.cellCount }, (__, cellIndex) =>
          stringValue(row.getCell(cellIndex + 1).value),
        ).join(" ");
      }).join(" ");
      statementDate ??= parseStatementDate(preamble);

      let headerRowNumber = 0;
      worksheet.eachRow((row, rowNumber) => {
        const labels = Array.from({ length: row.cellCount }, (_, index) =>
          stringValue(row.getCell(index + 1).value),
        );
        if (labels.includes("Symbol") && labels.includes("ISIN")) headerRowNumber = rowNumber;
      });
      if (!headerRowNumber) continue;

      const headerRow = worksheet.getRow(headerRowNumber);
      const headerValues = Array.from({ length: headerRow.cellCount }, (_, index) =>
        normalizeValue(headerRow.getCell(index + 1).value),
      );
      const headers = uniqueHeaders(headerValues);
      for (let rowNumber = headerRowNumber + 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
        if (rawRows.length >= MAX_IMPORT_ROWS) {
          throw new Error(`The workbook exceeds the ${MAX_IMPORT_ROWS.toLocaleString()} row limit`);
        }
        const row = worksheet.getRow(rowNumber);
        const values = headers.map((_, index) => normalizeValue(row.getCell(index + 1).value));
        const payload = rowPayload(headers, values);
        const isin = stringValue(payload.ISIN);
        const symbol = stringValue(payload.Symbol);
        if (!isin || !symbol) continue;

        const rowHash = stableRowHash([worksheet.name, ...values]);
        rawRows.push({ rowNumber: rawRows.length + 1, values, payload, rowHash });

        const quantity = numberValue(payload["Quantity Available"]);
        const averagePrice = numberValue(payload["Average Price"]);
        const marketPrice = numberValue(payload["Previous Closing Price"]);
        const unrealizedPnl = numberValue(payload["Unrealized P&L"]);
        if (quantity === null) continue;

        const assetClass = stringValue(payload.Sector || payload["Instrument Type"] || "Equity");
        const savedInstrument = await ensureInstrument({
          userId,
          isin,
          symbol: worksheet.name === "Equity" ? symbol : undefined,
          name: symbol,
          assetClass,
          currency: "INR",
        });
        const rowInvestedValue = averagePrice === null ? null : quantity * averagePrice;
        const rowMarketValue = marketPrice === null ? null : quantity * marketPrice;
        const inserted = await db
          .insert(positionSnapshot)
          .values({
            userId,
            sourceId: source.id,
            batchId: batch.id,
            instrumentId: savedInstrument.id,
            snapshotAt: statementDate ? new Date(`${statementDate}T12:00:00Z`) : new Date(),
            quantity: quantity.toString(),
            averagePrice: decimal(averagePrice),
            marketPrice: decimal(marketPrice),
            investedValue: decimal(rowInvestedValue),
            marketValue: decimal(rowMarketValue),
            unrealizedPnl: decimal(unrealizedPnl),
            rawRowHash: rowHash,
          })
          .onConflictDoNothing()
          .returning({ id: positionSnapshot.id });
        if (inserted.length > 0) {
          insertedRows += 1;
          investedValue += rowInvestedValue ?? 0;
          marketValue += rowMarketValue ?? 0;
        } else {
          skippedRows += 1;
        }
      }
    }

    await saveRawRows(userId, batch.id, rawRows);
    await completeBatch(batch.id, {
      statementDate,
      rowCount: rawRows.length,
      insertedRows,
      skippedRows,
      summary: { investedValue, marketValue, unrealizedPnl: marketValue - investedValue },
    });
    return {
      batchId: batch.id,
      fileName: file.name,
      kind,
      duplicate: false,
      rowCount: rawRows.length,
      insertedRows,
      skippedRows,
    } satisfies PortfolioImportResult;
  } catch (error) {
    await failBatch(batch.id, error);
    throw error;
  }
}

async function importZerodhaTradebook(userId: string, file: PortfolioImportFile) {
  const kind = "zerodha_tradebook";
  const fileHash = hash(file.bytes);
  const duplicate = await findDuplicateBatch(userId, kind, fileHash);
  if (duplicate) {
    return {
      batchId: duplicate.id,
      fileName: duplicate.fileName,
      kind,
      duplicate: true,
      rowCount: duplicate.rowCount,
      insertedRows: duplicate.insertedRows,
      skippedRows: duplicate.skippedRows,
    } satisfies PortfolioImportResult;
  }

  const source = await ensureSource(userId, "zerodha", "Zerodha Console", "INR");
  const batch = await createBatch(userId, source.id, kind, file, fileHash);

  try {
    if (file.bytes[0] !== 0x50 || file.bytes[1] !== 0x4b) {
      throw new Error("The selected file is not a valid XLSX workbook");
    }
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(
      file.bytes.slice().buffer as unknown as Parameters<typeof workbook.xlsx.load>[0],
    );

    const rawRows: RawRow[] = [];
    const entries: Array<typeof ledgerEntry.$inferInsert> = [];
    const instrumentCache = new Map<string, typeof instrument.$inferSelect>();
    let coverageFrom: string | null = null;
    let coverageTo: string | null = null;

    for (const worksheet of workbook.worksheets) {
      let headerRowNumber = 0;
      worksheet.eachRow((row, rowNumber) => {
        const labels = Array.from({ length: row.cellCount }, (_, index) =>
          stringValue(row.getCell(index + 1).value),
        );
        const required = ["Symbol", "ISIN", "Trade Date", "Trade Type", "Quantity", "Price"];
        if (required.every((label) => labels.includes(label))) headerRowNumber = rowNumber;
      });
      if (!headerRowNumber) continue;

      const preamble = Array.from({ length: Math.min(headerRowNumber, 15) }, (_, index) => {
        const row = worksheet.getRow(index + 1);
        return Array.from({ length: row.cellCount }, (__, cellIndex) =>
          stringValue(row.getCell(cellIndex + 1).value),
        ).join(" ");
      }).join(" ");
      const period = parseStatementPeriod(preamble);
      if (period.from && (!coverageFrom || period.from < coverageFrom)) coverageFrom = period.from;
      if (period.to && (!coverageTo || period.to > coverageTo)) coverageTo = period.to;

      const headerRow = worksheet.getRow(headerRowNumber);
      const headerValues = Array.from({ length: headerRow.cellCount }, (_, index) =>
        normalizeValue(headerRow.getCell(index + 1).value),
      );
      const headers = uniqueHeaders(headerValues);
      for (let rowNumber = headerRowNumber + 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
        if (rawRows.length >= MAX_IMPORT_ROWS) {
          throw new Error(`The workbook exceeds the ${MAX_IMPORT_ROWS.toLocaleString()} row limit`);
        }
        const row = worksheet.getRow(rowNumber);
        const values = headers.map((_, index) => normalizeValue(row.getCell(index + 1).value));
        const payload = rowPayload(headers, values);
        const isin = stringValue(payload.ISIN);
        const symbol = stringValue(payload.Symbol);
        const tradeType = stringValue(payload["Trade Type"]).toLowerCase();
        const quantity = numberValue(payload.Quantity);
        const price = numberValue(payload.Price);
        const occurredAt =
          parseIsoDate(payload["Order Execution Time"]) ?? parseIsoDate(payload["Trade Date"]);
        if (
          !isin ||
          !symbol ||
          !occurredAt ||
          quantity === null ||
          quantity <= 0 ||
          price === null ||
          price < 0 ||
          !["buy", "sell"].includes(tradeType)
        ) {
          continue;
        }

        const rowHash = stableRowHash([worksheet.name, ...values]);
        rawRows.push({
          rowNumber: rawRows.length + 1,
          values,
          payload: { worksheet: worksheet.name, ...payload },
          rowHash,
        });
        coverageFrom =
          !coverageFrom || occurredAt.toISOString().slice(0, 10) < coverageFrom
            ? occurredAt.toISOString().slice(0, 10)
            : coverageFrom;
        coverageTo =
          !coverageTo || occurredAt.toISOString().slice(0, 10) > coverageTo
            ? occurredAt.toISOString().slice(0, 10)
            : coverageTo;

        let savedInstrument = instrumentCache.get(isin);
        if (!savedInstrument) {
          savedInstrument = await ensureInstrument({
            userId,
            isin,
            symbol: stringValue(payload.Symbol),
            name: symbol,
            assetClass:
              stringValue(payload.Segment).toUpperCase() === "MF" ||
              worksheet.name.toLowerCase().includes("mutual")
                ? "Indian mutual fund"
                : "Indian equity",
            currency: "INR",
          });
          instrumentCache.set(isin, savedInstrument);
        }
        const tradeId = stringValue(payload["Trade ID"]);
        const executionTime = stringValue(payload["Order Execution Time"]);
        const signedQuantity = tradeType === "sell" ? -quantity : quantity;
        const grossAmount = quantity * price;
        entries.push({
          userId,
          sourceId: source.id,
          batchId: batch.id,
          instrumentId: savedInstrument.id,
          externalId: tradeId || null,
          entryKey: `zerodha_tradebook:${tradeId || rowHash}:${isin}:${tradeType}:${executionTime}`,
          occurredAt,
          entryType: tradeType,
          description: symbol,
          quantity: signedQuantity.toString(),
          price: price.toString(),
          grossAmount: grossAmount.toString(),
          netAmount: (tradeType === "buy" ? -grossAmount : grossAmount).toString(),
          currency: "INR",
          rawRowHash: rowHash,
        });
      }
    }

    if (rawRows.length === 0) {
      throw new Error(
        "No Zerodha trades found. Expected a worksheet with Symbol, ISIN, Trade Date, Trade Type, Quantity and Price columns.",
      );
    }
    await saveRawRows(userId, batch.id, rawRows);
    let insertedRows = 0;
    for (let index = 0; index < entries.length; index += CHUNK_SIZE) {
      const chunk = entries.slice(index, index + CHUNK_SIZE);
      const inserted = await db
        .insert(ledgerEntry)
        .values(chunk)
        .onConflictDoNothing()
        .returning({ id: ledgerEntry.id });
      insertedRows += inserted.length;
    }
    const skippedRows = rawRows.length - insertedRows;
    const buyAmount = entries
      .filter((entry) => entry.entryType === "buy")
      .reduce((sum, entry) => sum + Number(entry.grossAmount ?? 0), 0);
    const sellAmount = entries
      .filter((entry) => entry.entryType === "sell")
      .reduce((sum, entry) => sum + Number(entry.grossAmount ?? 0), 0);
    await completeBatch(batch.id, {
      statementDate: coverageTo,
      rowCount: rawRows.length,
      insertedRows,
      skippedRows,
      summary: {
        coverageFrom,
        coverageTo,
        instruments: instrumentCache.size,
        buyTrades: entries.filter((entry) => entry.entryType === "buy").length,
        sellTrades: entries.filter((entry) => entry.entryType === "sell").length,
        buyAmount,
        sellAmount,
        fullyOverlapping: insertedRows === 0,
      },
    });
    return {
      batchId: batch.id,
      fileName: file.name,
      kind,
      duplicate: insertedRows === 0,
      rowCount: rawRows.length,
      insertedRows,
      skippedRows,
    } satisfies PortfolioImportResult;
  } catch (error) {
    await failBatch(batch.id, error);
    throw error;
  }
}

function parseCsvRows(file: PortfolioImportFile) {
  const text = Buffer.from(file.bytes)
    .toString("utf8")
    .replace(/^\uFEFF/, "");
  const parsed = Papa.parse<string[]>(text, { skipEmptyLines: "greedy" });
  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0]?.message ?? "Could not parse CSV");
  }
  const [headerValues, ...rows] = parsed.data;
  if (!headerValues) throw new Error("CSV has no header row");
  if (rows.length > MAX_IMPORT_ROWS) {
    throw new Error(`The CSV exceeds the ${MAX_IMPORT_ROWS.toLocaleString()} row limit`);
  }
  const headers = uniqueHeaders(headerValues);
  return { headerValues, headers, rows };
}

function csvKind(headers: string[]) {
  if (headers.includes("Order ID") && headers.includes("Quantity")) {
    return "degiro_transactions" as const;
  }
  if (headers.includes("Description") && headers.includes("Balance")) {
    return "degiro_account" as const;
  }
  throw new Error("This is not a recognized Degiro Transactions or Account export");
}

function csvIndex(headers: string[], name: string) {
  const index = headers.indexOf(name);
  if (index < 0) throw new Error(`Missing ${name} column`);
  return index;
}

async function importDegiro(userId: string, file: PortfolioImportFile) {
  const parsed = parseCsvRows(file);
  const kind = csvKind(parsed.headers);
  const fileHash = hash(file.bytes);
  const duplicate = await findDuplicateBatch(userId, kind, fileHash);
  if (duplicate) {
    return {
      batchId: duplicate.id,
      fileName: duplicate.fileName,
      kind,
      duplicate: true,
      rowCount: duplicate.rowCount,
      insertedRows: duplicate.insertedRows,
      skippedRows: duplicate.skippedRows,
    } satisfies PortfolioImportResult;
  }

  const source = await ensureSource(userId, "degiro", "Degiro", "EUR");
  const batch = await createBatch(userId, source.id, kind, file, fileHash);

  try {
    const rows: RawRow[] = parsed.rows.map((values, index) => ({
      rowNumber: index + 2,
      values,
      payload: rowPayload(parsed.headers, values),
      rowHash: stableRowHash(values),
    }));
    await saveRawRows(userId, batch.id, rows);

    const dateIndex = csvIndex(parsed.headers, "Date");
    const timeIndex = csvIndex(parsed.headers, "Time");
    const productIndex = csvIndex(parsed.headers, "Product");
    const isinIndex = csvIndex(parsed.headers, "ISIN");
    const entries: Array<typeof ledgerEntry.$inferInsert> = [];

    if (kind === "degiro_transactions") {
      const quantityIndex = csvIndex(parsed.headers, "Quantity");
      const priceIndex = csvIndex(parsed.headers, "Price");
      const localValueIndex = csvIndex(parsed.headers, "Local value");
      const valueEurIndex = csvIndex(parsed.headers, "Value EUR");
      const feesIndex = csvIndex(parsed.headers, "Transaction and/or third party fees EUR");
      const totalIndex = csvIndex(parsed.headers, "Total EUR");
      const orderIdIndex = csvIndex(parsed.headers, "Order ID");

      for (const row of rows) {
        const occurredAt = parseEuropeanDate(row.values[dateIndex], row.values[timeIndex]);
        const isin = stringValue(row.values[isinIndex]);
        const product = stringValue(row.values[productIndex]);
        if (!occurredAt || !isin || !product) continue;
        const savedInstrument = await ensureInstrument({
          userId,
          isin,
          name: product,
          assetClass: "Global equity",
          currency: "EUR",
        });
        const quantity = numberValue(row.values[quantityIndex]);
        const fees = numberValue(row.values[feesIndex]);
        entries.push({
          userId,
          sourceId: source.id,
          batchId: batch.id,
          instrumentId: savedInstrument.id,
          externalId: stringValue(row.values[orderIdIndex]) || null,
          entryKey: `${kind}:${row.rowHash}`,
          occurredAt,
          entryType: quantity !== null && quantity < 0 ? "sell" : "buy",
          description: product,
          quantity: decimal(quantity),
          price: decimal(numberValue(row.values[priceIndex])),
          grossAmount: decimal(
            numberValue(row.values[valueEurIndex]) ?? numberValue(row.values[localValueIndex]),
          ),
          fees: decimal(fees),
          netAmount: decimal(numberValue(row.values[totalIndex])),
          currency: "EUR",
          rawRowHash: row.rowHash,
        });
      }
    } else {
      const descriptionIndex = csvIndex(parsed.headers, "Description");
      const changeCurrencyIndex = csvIndex(parsed.headers, "Change");
      const changeAmountIndex = changeCurrencyIndex + 1;
      const balanceCurrencyIndex = csvIndex(parsed.headers, "Balance");
      const balanceAmountIndex = balanceCurrencyIndex + 1;
      const orderIdIndex = csvIndex(parsed.headers, "Order Id");

      for (const row of rows) {
        const occurredAt = parseEuropeanDate(row.values[dateIndex], row.values[timeIndex]);
        if (!occurredAt) continue;
        const description = stringValue(row.values[descriptionIndex]);
        const lowerDescription = description.toLowerCase();
        const entryType = lowerDescription.includes("dividend")
          ? "dividend"
          : lowerDescription.includes("fee") || lowerDescription.includes("kosten")
            ? "fee"
            : lowerDescription.includes("cash") || lowerDescription.includes("overboeking")
              ? "cash"
              : "account_activity";
        entries.push({
          userId,
          sourceId: source.id,
          batchId: batch.id,
          externalId: stringValue(row.values[orderIdIndex]) || null,
          entryKey: `${kind}:${row.rowHash}`,
          occurredAt,
          entryType,
          description,
          netAmount: decimal(numberValue(row.values[changeAmountIndex])),
          balance: decimal(numberValue(row.values[balanceAmountIndex])),
          currency:
            stringValue(row.values[changeCurrencyIndex]) ||
            stringValue(row.values[balanceCurrencyIndex]) ||
            "EUR",
          rawRowHash: row.rowHash,
        });
      }
    }

    let insertedRows = 0;
    for (let index = 0; index < entries.length; index += CHUNK_SIZE) {
      const chunk = entries.slice(index, index + CHUNK_SIZE);
      if (chunk.length === 0) continue;
      const inserted = await db
        .insert(ledgerEntry)
        .values(chunk)
        .onConflictDoNothing()
        .returning({ id: ledgerEntry.id });
      insertedRows += inserted.length;
    }
    const skippedRows = rows.length - insertedRows;
    const latestDate = rows
      .map((row) => parseEuropeanDate(row.values[dateIndex], row.values[timeIndex]))
      .filter((value): value is Date => Boolean(value))
      .sort((left, right) => right.getTime() - left.getTime())[0];
    await completeBatch(batch.id, {
      statementDate: latestDate?.toISOString().slice(0, 10),
      rowCount: rows.length,
      insertedRows,
      skippedRows,
      summary: { ledgerEntries: entries.length },
    });
    return {
      batchId: batch.id,
      fileName: file.name,
      kind,
      duplicate: false,
      rowCount: rows.length,
      insertedRows,
      skippedRows,
    } satisfies PortfolioImportResult;
  } catch (error) {
    await failBatch(batch.id, error);
    throw error;
  }
}

export async function processPortfolioImport(input: {
  userId: string;
  kind: PortfolioImportKind;
  files: PortfolioImportFile[];
}) {
  if (input.files.length === 0) throw new Error("Select at least one file");
  if (input.kind === "zerodha_holdings" && input.files.length !== 1) {
    throw new Error("Select one Zerodha holdings workbook");
  }
  const results: PortfolioImportResult[] = [];
  for (const file of input.files) {
    results.push(
      input.kind === "zerodha_holdings"
        ? await importZerodha(input.userId, file)
        : input.kind === "zerodha_tradebook"
          ? await importZerodhaTradebook(input.userId, file)
          : await importDegiro(input.userId, file),
    );
  }
  return results;
}

export async function getRecentPortfolioImports(userId: string) {
  return db
    .select({
      id: importBatch.id,
      kind: importBatch.kind,
      fileName: importBatch.fileName,
      status: importBatch.status,
      statementDate: importBatch.statementDate,
      rowCount: importBatch.rowCount,
      insertedRows: importBatch.insertedRows,
      skippedRows: importBatch.skippedRows,
      createdAt: importBatch.createdAt,
    })
    .from(importBatch)
    .where(eq(importBatch.userId, userId))
    .orderBy(desc(importBatch.createdAt))
    .limit(20);
}
