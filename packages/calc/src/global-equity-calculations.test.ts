import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import Papa from "papaparse";

import {
  calculateGlobalEquityPortfolio,
  consolidateDegiroTrades,
  type DegiroRawTrade,
} from "./global-equity-calculations";

describe("global-equity-calculations", () => {
  it("consolidates multi-venue fills for the same order ID without duplicating", () => {
    const rawFills: DegiroRawTrade[] = [
      {
        orderId: "ef19a7a1-e5ee-4402-ba07-a2d243f1e5d4",
        occurredAt: new Date("2026-10-15T09:14:00Z"),
        isin: "NL0010273215",
        name: "ASML HOLDING N.V.",
        quantity: 2,
        price: 1431,
        grossAmount: -2862,
        fees: 0,
        netAmount: -2862,
        venue: "MESI",
      },
      {
        orderId: "ef19a7a1-e5ee-4402-ba07-a2d243f1e5d4",
        occurredAt: new Date("2026-10-15T09:14:00Z"),
        isin: "NL0010273215",
        name: "ASML HOLDING N.V.",
        quantity: 2,
        price: 1431,
        grossAmount: -2862,
        fees: -3,
        netAmount: -2865,
        venue: "XAMS",
      },
    ];

    const consolidated = consolidateDegiroTrades(rawFills);
    assert.equal(consolidated.length, 1);
    assert.equal(consolidated[0]!.orderId, "ef19a7a1-e5ee-4402-ba07-a2d243f1e5d4");
    assert.equal(consolidated[0]!.quantity, 4);
    assert.equal(consolidated[0]!.grossAmount, 5724);
    assert.equal(consolidated[0]!.fees, -3);
    assert.equal(consolidated[0]!.netAmount, -5727);
    assert.equal(consolidated[0]!.price, 1431);
    assert.equal(consolidated[0]!.entryType, "buy");
  });

  it("calculates moving-average cost basis (BEP) and realized P&L accurately", () => {
    const trades = [
      // Buy 10 @ 100 EUR = 1000 EUR
      {
        isin: "US1234567890",
        name: "Test Stock",
        occurredAt: new Date("2025-01-01T10:00:00Z"),
        quantity: 10,
        price: 100,
        grossAmount: 1000,
      },
      // Buy 10 @ 120 EUR = 1200 EUR (Total 20 @ 110 EUR = 2200 EUR)
      {
        isin: "US1234567890",
        name: "Test Stock",
        occurredAt: new Date("2025-01-02T10:00:00Z"),
        quantity: 10,
        price: 120,
        grossAmount: 1200,
      },
      // Sell 15 @ 130 EUR (Proceeds = 1950 EUR, Cost = 15 * 110 = 1650 EUR, Realized = +300 EUR)
      // Remaining: 5 @ 110 EUR = 550 EUR cost basis
      {
        isin: "US1234567890",
        name: "Test Stock",
        occurredAt: new Date("2025-01-03T10:00:00Z"),
        quantity: -15,
        price: 130,
        grossAmount: 1950,
      },
    ];

    const result = calculateGlobalEquityPortfolio(trades);
    assert.equal(result.holdings.length, 1);
    const holding = result.holdings[0]!;
    assert.equal(holding.quantity, 5);
    assert.equal(holding.averagePrice, 110);
    assert.equal(holding.costBasis, 550);
    assert.equal(holding.latestPrice, 130);
    assert.equal(holding.marketValue, 650);
    assert.equal(holding.unrealizedPnl, 100);
    assert.equal(result.realizedPnl, 300);
  });

  it("resets cost basis to 0 when position is fully sold", () => {
    const trades = [
      {
        isin: "TEST0001",
        name: "Full Sale Stock",
        occurredAt: new Date("2025-01-01T10:00:00Z"),
        quantity: 100,
        price: 50,
        grossAmount: 5000,
      },
      {
        isin: "TEST0001",
        name: "Full Sale Stock",
        occurredAt: new Date("2025-02-01T10:00:00Z"),
        quantity: -100,
        price: 60,
        grossAmount: 6000,
      },
    ];

    const result = calculateGlobalEquityPortfolio(trades);
    assert.equal(result.holdings.length, 0);
    assert.equal(result.realizedPnl, 1000);
  });

  it("precisely matches real Degiro 2021-2026 export data and Degiro screenshot", () => {
    const csvPath = fileURLToPath(
      new URL("../../../degiro exports/Transactions latest.csv", import.meta.url),
    );
    if (!fs.existsSync(csvPath)) return;

    const content = fs.readFileSync(csvPath, "utf8");
    const parsed = Papa.parse<Record<string, string>>(content, {
      header: true,
      skipEmptyLines: true,
    });

    const parseNum = (val?: string) => {
      if (!val) return 0;
      return parseFloat(val.replace(/\./g, "").replace(",", "."));
    };

    const rawTrades: DegiroRawTrade[] = [];
    for (const r of parsed.data) {
      const isin = r["ISIN"]?.trim();
      const product = r["Product"]?.trim();
      const dateText = r["Date"]?.trim();
      const timeText = r["Time"]?.trim();
      if (!isin || !product || !dateText || !timeText) continue;

      const [d, m, y] = dateText.split("-");
      const [hh, mm] = timeText.split(":");
      const occurredAt = new Date(
        Date.UTC(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm)),
      );

      rawTrades.push({
        orderId: r["Order ID"]?.trim() || null,
        occurredAt,
        isin,
        name: product,
        quantity: parseNum(r["Quantity"]),
        price: parseNum(r["Price"]),
        grossAmount: parseNum(r["Value EUR"]) || parseNum(r["Local value"]),
        fees: parseNum(r["Transaction and/or third party fees EUR"]),
        netAmount: parseNum(r["Total EUR"]),
        venue: r["Venue"]?.trim(),
      });
    }

    const consolidated = consolidateDegiroTrades(rawTrades);
    const result = calculateGlobalEquityPortfolio(consolidated);

    // Verify EXACT open positions matching Degiro screenshot:
    // 1. Defiance Memory UCITS USD ACC ETF: Qty 1300, BEP: 4.736323
    // 2. ASML Holding N.V.: Qty 4, BEP: 1431.00
    // 3. ASM International NV: Qty 1, BEP: 743.00
    assert.equal(result.holdings.length, 3, "Must have exactly 3 open holdings");

    const byIsin = new Map(result.holdings.map((h) => [h.isin, h]));

    // ASM International NV (NL0000334118)
    const asm = byIsin.get("NL0000334118");
    assert.ok(asm, "ASM International NV must be present");
    assert.equal(asm.quantity, 1);
    assert.equal(asm.averagePrice, 743);
    assert.equal(asm.costBasis, 743);

    // ASML Holding N.V. (NL0010273215)
    const asml = byIsin.get("NL0010273215");
    assert.ok(asml, "ASML Holding N.V. must be present");
    assert.equal(asml.quantity, 4);
    assert.equal(asml.averagePrice, 1431);
    assert.equal(asml.costBasis, 5724);

    // Defiance Memory UCITS USD ACC ETF (IE000CEUZ052)
    const dram = byIsin.get("IE000CEUZ052");
    assert.ok(dram, "Defiance Memory ETF must be present");
    assert.equal(dram.quantity, 1300);
    assert.ok(
      Math.abs(dram.averagePrice - 4.736323) < 0.0001,
      `BEP must be ~4.736323, got ${dram.averagePrice}`,
    );
    assert.ok(
      Math.abs(dram.costBasis - 6157.22) < 0.01,
      `Cost basis must be 6157.22, got ${dram.costBasis}`,
    );

    // Total cost basis: 743 + 5724 + 6157.22 = 12624.22
    const totalCostBasis = result.holdings.reduce((sum, h) => sum + h.costBasis, 0);
    assert.ok(Math.abs(totalCostBasis - 12624.22) < 0.01);

    // Total Market Value at latest trade prices (4 * 1431 + 1300 * 4.4574 + 1 * 743 = 12261.62)
    const totalMarketValue = result.holdings.reduce((sum, h) => sum + h.marketValue, 0);
    assert.ok(Math.abs(totalMarketValue - 12261.62) < 0.05);

    // Realized P&L across all closed positions from 2021 to 2026: ~€11,103.44
    assert.ok(
      Math.abs(result.realizedPnl - 11103.44) < 0.1,
      `Realized PnL should be ~11103.44, got ${result.realizedPnl}`,
    );
  });
});
