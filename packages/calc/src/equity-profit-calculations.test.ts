import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateEquityProfitGrowth,
  formatMonthLabel,
  generateMonthRange,
} from "./equity-profit-calculations";

describe("equity-profit-calculations", () => {
  it("formats month labels consistently", () => {
    assert.equal(formatMonthLabel("2024-03"), "Mar 24");
    assert.equal(formatMonthLabel("2023-11"), "Nov 23");
  });

  it("generates continuous monthly ranges across year boundaries", () => {
    const range = generateMonthRange("2023-11", "2024-02");
    assert.deepEqual(range, ["2023-11", "2023-12", "2024-01", "2024-02"]);
  });

  it("handles empty histories gracefully", () => {
    const result = calculateEquityProfitGrowth({
      indianHistory: [],
      globalHistory: [],
      baseCurrency: "EUR",
    });
    assert.equal(result.timeline.length, 0);
    assert.equal(result.summary.hasData, false);
    assert.equal(result.summary.latestTotalProfitBase, 0);
  });

  it("tracks profit growth accurately for both Indian and Global equity", () => {
    const rates = [
      { baseCurrency: "EUR", quoteCurrency: "INR", rate: 0.011 }, // 1 INR = 0.011 EUR (approx 1 EUR = 90.9 INR)
    ];

    const indianHistory = [
      {
        date: "2024-01-15",
        investedValue: 100_000,
        marketValue: 110_000,
        unrealizedPnl: 10_000, // profit = 10k INR (~110 EUR)
      },
      {
        date: "2024-02-28",
        investedValue: 100_000,
        marketValue: 125_000,
        unrealizedPnl: 25_000, // profit = 25k INR (~275 EUR)
      },
    ];

    const globalHistory = [
      {
        date: "2023-12-10",
        investedValue: 5_000,
        marketValue: 5_500,
        unrealizedPnl: 500, // profit = 500 EUR
      },
      {
        date: "2024-02-15",
        investedValue: 6_000,
        marketValue: 7_200,
        unrealizedPnl: 1_200, // profit = 1,200 EUR
      },
    ];

    const result = calculateEquityProfitGrowth({
      indianHistory,
      globalHistory,
      rates,
      baseCurrency: "EUR",
    });

    assert.equal(result.summary.hasData, true);
    assert.equal(result.summary.hasIndianData, true);
    assert.equal(result.summary.hasGlobalData, true);

    // Timeline should span 2023-12 to 2024-02 (3 months)
    assert.equal(result.timeline.length, 3);
    assert.deepEqual(
      result.timeline.map((p) => p.month),
      ["2023-12", "2024-01", "2024-02"],
    );

    // 2023-12: only global was active
    const dec = result.timeline[0]!;
    assert.equal(dec.hasIndianData, false);
    assert.equal(dec.hasGlobalData, true);
    assert.equal(dec.globalProfitEur, 500);
    assert.equal(dec.totalProfitBase, 500);
    assert.equal(dec.globalReturnPercent, 10); // 500 / 5000 = 10%

    // 2024-01: indian joined (10k INR), global carried forward from dec (500 EUR)
    const jan = result.timeline[1]!;
    assert.equal(jan.hasIndianData, true);
    assert.equal(jan.hasGlobalData, true);
    assert.equal(jan.indianProfitInr, 10_000);
    assert.equal(jan.indianProfitBase, 110); // 10,000 * 0.011
    assert.equal(jan.indianReturnPercent, 10); // 10k / 100k = 10%
    assert.equal(jan.globalProfitEur, 500);
    assert.equal(jan.totalProfitBase, 610); // 500 + 110

    // 2024-02: both updated (indian = 25k INR, global = 1200 EUR)
    const feb = result.timeline[2]!;
    assert.equal(feb.indianProfitInr, 25_000);
    assert.equal(feb.indianProfitBase, 275); // 25,000 * 0.011
    assert.equal(feb.indianReturnPercent, 25); // 25k / 100k = 25%
    assert.equal(feb.globalProfitEur, 1_200);
    assert.equal(feb.globalReturnPercent, 20); // 1,200 / 6,000 = 20%
    assert.equal(feb.totalProfitBase, 1_475); // 1,200 + 275

    assert.equal(result.summary.latestIndianProfitInr, 25_000);
    assert.equal(result.summary.latestGlobalProfitEur, 1_200);
    assert.equal(result.summary.latestTotalProfitBase, 1_475);
    assert.equal(result.summary.peakTotalProfitBase, 1_475);
  });
});
