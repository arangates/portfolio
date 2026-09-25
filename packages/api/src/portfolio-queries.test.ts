import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { buildGlobalEquityAssets } from "./global-equity-breakdown";

describe("buildGlobalEquityAssets", () => {
  it("splits global equity into invested value and unrealized profit", () => {
    const assets = buildGlobalEquityAssets(
      [
        { marketValue: 120_000, costBasis: 90_000, unrealizedPnl: 30_000 },
        { marketValue: 80_000, costBasis: 100_000, unrealizedPnl: -20_000 },
      ],
      (value) => value,
      null,
    );

    assert.deepEqual(
      assets.map((asset) => ({ category: asset.category, nativeValue: asset.nativeValue })),
      [
        { category: "Global equity - Invested", nativeValue: 190_000 },
        { category: "Global equity - Profit", nativeValue: 10_000 },
      ],
    );
  });
});
