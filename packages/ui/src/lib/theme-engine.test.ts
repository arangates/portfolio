import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateContrast,
  getApcaContrast,
  getWcagContrast,
  getMichelsonContrast,
  getWeberContrast,
  getLStarContrast,
  getDeltaPhiContrast,
  rgbToOklch,
  oklchToRgb,
  formatColor,
  deriveThemeFromPair,
  generateRandomAccessiblePair,
} from "./theme-engine";

describe("Theme Engine - APCA & OKLCH", () => {
  it("calculates APCA contrast with proper polarity", () => {
    // Dark text on white background (BoW - negative signed Lc in APCA)
    const darkOnWhite = getApcaContrast("#000000", "#ffffff");
    assert.ok(darkOnWhite < -95, `Expected dark on white to be < -95, got ${darkOnWhite}`);

    // Light text on black background (WoB - positive signed Lc in APCA)
    const whiteOnDark = getApcaContrast("#ffffff", "#000000");
    assert.ok(whiteOnDark > 100, `Expected white on dark to be > 100, got ${whiteOnDark}`);

    // Evaluation returns absolute magnitude and AAA level
    const evalResult = evaluateContrast("#ffffff", "#000000", "APCA");
    assert.equal(evalResult.apcaLevel, "AAA");
    assert.ok(evalResult.apcaRatio >= 100);
  });

  it("handles OKLCH roundtrip conversions faithfully", () => {
    const originalRgb: [number, number, number] = [40, 180, 120];
    const oklch = rgbToOklch(originalRgb);
    assert.ok(oklch.l > 0 && oklch.l < 1);
    assert.ok(oklch.c > 0);
    assert.ok(oklch.h >= 0 && oklch.h < 360);

    const reconstructedRgb = oklchToRgb(oklch);
    for (let i = 0; i < 3; i++) {
      assert.ok(
        Math.abs(originalRgb[i]! - reconstructedRgb[i]!) <= 2,
        `Channel ${i} deviated: ${originalRgb[i]} vs ${reconstructedRgb[i]}`,
      );
    }
  });

  it("formats colors across all 9 color formats", () => {
    const testColor = "#3b82f6";

    const oklchStr = formatColor(testColor, "OKLCH");
    assert.match(oklchStr, /^oklch\(\d+(\.\d+)?% \d+(\.\d+)? \d+(\.\d+)?\)$/);

    const hexStr = formatColor(testColor, "HEX");
    assert.equal(hexStr, "#3B82F6");

    const rgbStr = formatColor(testColor, "RGB");
    assert.match(rgbStr, /^rgb\(\d+, \d+, \d+\)$/);

    const hslStr = formatColor(testColor, "HSL");
    assert.match(hslStr, /^hsl\(\d+, \d+%, \d+%\)$/);

    const p3Str = formatColor(testColor, "Display-P3");
    assert.match(p3Str, /^color\(display-p3 \d+(\.\d+)? \d+(\.\d+)? \d+(\.\d+)?\)$/);

    const oklabStr = formatColor(testColor, "OKLAB");
    assert.match(oklabStr, /^oklab\(/);

    const labStr = formatColor(testColor, "LAB");
    assert.match(labStr, /^lab\(/);

    const lchStr = formatColor(testColor, "LCH");
    assert.match(lchStr, /^lch\(/);

    const recStr = formatColor(testColor, "REC.2020");
    assert.match(recStr, /^color\(rec2020 /);
  });

  it("calculates all 6 contrast metrics accurately", () => {
    const fg = "#ffffff";
    const bg = "#09090b";

    const apca = Math.abs(getApcaContrast(fg, bg));
    const wcag = getWcagContrast(fg, bg);
    const michelson = getMichelsonContrast(fg, bg);
    const weber = getWeberContrast(fg, bg);
    const lStar = getLStarContrast(fg, bg);
    const deltaPhi = getDeltaPhiContrast(fg, bg);

    assert.ok(apca > 80, `APCA: ${apca}`);
    assert.ok(wcag > 15, `WCAG: ${wcag}`);
    assert.ok(michelson > 0.8, `Michelson: ${michelson}`);
    assert.ok(weber > 10, `Weber: ${weber}`);
    assert.ok(lStar > 80, `L*: ${lStar}`);
    assert.ok(deltaPhi > 70, `DeltaPhi: ${deltaPhi}`);
  });

  it("derives complete semantic theme tokens with APCA contrast guarantees", () => {
    const tokens = deriveThemeFromPair("#09090b", "#4ade80");

    assert.equal(tokens.background, "#09090b");
    assert.equal(tokens.foreground, "#4ade80");
    assert.ok(tokens.card);
    assert.ok(tokens.primary);
    assert.ok(tokens.mutedForeground);
    assert.ok(tokens.border);
    assert.ok(tokens.chart1);
    assert.ok(tokens.chart2);
    assert.ok(tokens.chart3);
    assert.ok(tokens.chart4);
    assert.ok(tokens.chart5);

    // Primary button foreground contrast solved via APCA
    const primaryButtonApca = Math.abs(getApcaContrast(tokens.primaryForeground, tokens.primary));
    assert.ok(
      primaryButtonApca >= 50,
      `Primary button text APCA should be >= 50, got ${primaryButtonApca}`,
    );

    // Muted text contrast against card surface
    const mutedApca = Math.abs(getApcaContrast(tokens.mutedForeground, tokens.card));
    assert.ok(mutedApca >= 50, `Muted text APCA should be >= 50 against card, got ${mutedApca}`);
  });

  it("procedurally generates random accessible pairs using APCA", () => {
    const [bgDark, fgDark] = generateRandomAccessiblePair({
      mode: "dark",
      algorithm: "APCA",
      minContrast: 75,
    });
    const darkScore = Math.abs(getApcaContrast(fgDark, bgDark));
    assert.ok(darkScore >= 75, `Dark pair should have APCA >= 75, got ${darkScore}`);

    const [bgLight, fgLight] = generateRandomAccessiblePair({
      mode: "light",
      algorithm: "APCA",
      minContrast: 75,
    });
    const lightScore = Math.abs(getApcaContrast(fgLight, bgLight));
    assert.ok(lightScore >= 75, `Light pair should have APCA >= 75, got ${lightScore}`);
  });
});
