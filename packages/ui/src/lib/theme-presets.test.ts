import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { THEME_PRESETS, THEME_PRESET_CATEGORIES, createOklchTheme } from "./theme-presets";
import { deriveThemeFromPair } from "./theme-engine";

describe("50 OKLCH + APCA Theme Presets", () => {
  test("contains exactly 50 presets distributed across 5 categories (10 each)", () => {
    assert.equal(THEME_PRESETS.length, 50, "Should have exactly 50 presets");
    assert.equal(THEME_PRESET_CATEGORIES.length, 5, "Should have 5 categories");

    for (const cat of THEME_PRESET_CATEGORIES) {
      const presetsInCat = THEME_PRESETS.filter((p) => p.category === cat.id);
      assert.equal(presetsInCat.length, 10, `Category ${cat.id} should have exactly 10 presets`);
    }
  });

  test("each preset contains valid hex, OKLCH strings, and high APCA scores", () => {
    const hexRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
    const oklchRegex = /^oklch\(/;

    for (const preset of THEME_PRESETS) {
      assert.match(preset.bg.hex, hexRegex, `${preset.id} bg.hex is valid hex`);
      assert.match(preset.surface.hex, hexRegex, `${preset.id} surface.hex is valid hex`);
      assert.match(preset.text.hex, hexRegex, `${preset.id} text.hex is valid hex`);
      assert.match(preset.accent.hex, hexRegex, `${preset.id} accent.hex is valid hex`);

      assert.match(preset.bg.oklch, oklchRegex, `${preset.id} bg.oklch is valid oklch`);
      assert.match(preset.surface.oklch, oklchRegex, `${preset.id} surface.oklch is valid oklch`);
      assert.match(preset.text.oklch, oklchRegex, `${preset.id} text.oklch is valid oklch`);
      assert.match(preset.accent.oklch, oklchRegex, `${preset.id} accent.oklch is valid oklch`);

      assert.ok(
        preset.apca >= 65,
        `${preset.id} APCA score (${preset.apca}) meets minimum threshold`,
      );
    }
  });

  test("createOklchTheme generates mathematical formulas with exact lightness locks", () => {
    // Dark theme: L locked at 17% (bg), 22% (surface), 93% (text), 72% (accent)
    const darkTheme = createOklchTheme(280, 120, true);
    assert.equal(darkTheme.bg, "oklch(17% 0.03 280)");
    assert.equal(darkTheme.surface, "oklch(22% 0.04 280)");
    assert.equal(darkTheme.text, "oklch(93% 0.02 280)");
    assert.equal(darkTheme.accent, "oklch(72% 0.16 120)");

    // Light theme: L locked at 97% (bg), 93% (surface), 21% (text), 52% (accent)
    const lightTheme = createOklchTheme(45, 180, false);
    assert.equal(lightTheme.bg, "oklch(97% 0.012 45)");
    assert.equal(lightTheme.surface, "oklch(93% 0.02 45)");
    assert.equal(lightTheme.text, "oklch(21% 0.03 45)");
    assert.equal(lightTheme.accent, "oklch(52% 0.16 180)");
  });

  test("deriveThemeFromPair integrates surfaceHex and accentHex into tokens", () => {
    const preset = THEME_PRESETS[0]!; // Pure Carbon
    const tokens = deriveThemeFromPair(preset.bg.hex, preset.text.hex, {
      surfaceHex: preset.surface.hex,
      accentHex: preset.accent.hex,
    });

    assert.equal(tokens.background, preset.bg.hex);
    assert.equal(tokens.card, preset.surface.hex, "Card should use surfaceHex");
    assert.equal(tokens.popover, preset.surface.hex, "Popover should use surfaceHex");
    assert.equal(tokens.primary, preset.accent.hex, "Primary should use accentHex");
    assert.equal(tokens.accent, preset.accent.hex, "Accent should use accentHex");
    assert.equal(tokens.chart1, preset.accent.hex, "Chart series 1 should anchor to accentHex");
    assert.equal(tokens.bg, preset.bg.hex);
    assert.equal(tokens.surface, preset.surface.hex);
    assert.equal(tokens.text, preset.text.hex);
  });
});
