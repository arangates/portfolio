import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  chartColors,
  themeChartColors,
  UNIFIED_CATEGORICAL_PALETTE,
  THEME_BOUND_CATEGORICAL_PALETTE,
  MONOCHROME_CATEGORICAL_PALETTE,
  getCategoryPalette,
  getCategoryPaletteArray,
  generateThemeHarmonizedChartPalette,
  UNIFIED_CHART_CONFIGS,
} from "./chart-theme.ts";

describe("Chart Theme System", () => {
  it("provides all semantic chart color swatches with light and dark variants", () => {
    const keys = [
      "primary",
      "success",
      "warning",
      "danger",
      "purple",
      "cyan",
      "orange",
      "teal",
      "rose",
      "neutral",
    ] as const;
    for (const key of keys) {
      const swatch = chartColors[key];
      assert.ok(swatch, `Missing chart swatch for ${key}`);
      assert.ok(Array.isArray(swatch.light) && swatch.light.length > 0);
      assert.ok(Array.isArray(swatch.dark) && swatch.dark.length > 0);
    }
  });

  it("provides theme-bound CSS variable swatches", () => {
    assert.deepEqual(themeChartColors.chart1, {
      light: ["var(--chart-1)"],
      dark: ["var(--chart-1)"],
    });
    assert.deepEqual(themeChartColors.primary, {
      light: ["var(--primary)"],
      dark: ["var(--primary)"],
    });
  });

  it("delivers consistent categorical palettes", () => {
    assert.equal(UNIFIED_CATEGORICAL_PALETTE.length, 10);
    assert.ok(THEME_BOUND_CATEGORICAL_PALETTE.length >= 5);
    assert.ok(MONOCHROME_CATEGORICAL_PALETTE.length >= 5);

    // Tests index wrap-around
    const swatch0 = getCategoryPalette(0, "financial");
    const swatch10 = getCategoryPalette(10, "financial");
    assert.deepEqual(swatch0, swatch10);

    const array5 = getCategoryPaletteArray(5, "financial");
    assert.equal(array5.length, 5);
  });

  it("procedurally generates theme-harmonized chart palettes from background and foreground", () => {
    const palette = generateThemeHarmonizedChartPalette("#09090b", "#38ef7d", 6);
    assert.equal(palette.length, 6);
    for (const swatch of palette) {
      assert.equal(swatch.light.length, 2);
      assert.equal(swatch.dark.length, 2);
      // Valid hex strings
      assert.match(swatch.light[0]!, /^#[0-9a-f]{6}$/i);
      assert.match(swatch.dark[0]!, /^#[0-9a-f]{6}$/i);
    }
  });

  it("provides standard pre-configured chart configs", () => {
    assert.ok(UNIFIED_CHART_CONFIGS.portfolioHistory.marketValue);
    assert.ok(UNIFIED_CHART_CONFIGS.portfolioHistory.investedValue);
    assert.ok(UNIFIED_CHART_CONFIGS.salaryEarnings.netPay);
    assert.ok(UNIFIED_CHART_CONFIGS.fireProjection.median);
    assert.ok(UNIFIED_CHART_CONFIGS.wealthMix.liquid);
  });
});
