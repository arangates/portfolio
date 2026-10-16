"use client";

import { Button } from "@portfolio/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@portfolio/ui/components/card";
import { Check, Laptop, Moon, Sun } from "@portfolio/ui/components/icons";
import {
  COLOR_FORMATS,
  CONTRAST_ALGORITHMS,
  THEME_PRESETS,
  THEME_PRESET_CATEGORIES,
  createOklchThemeHex,
  formatColor,
  type ThemePresetCategory,
} from "@portfolio/ui/lib/theme-engine";
import {
  ArrowsClockwise,
  ArrowsLeftRight,
  Broadcast,
  CheckCircle,
  Copy,
  DiceFive,
  Heart,
  Info,
  MagnifyingGlass,
  Palette,
  Sliders,
  Sparkle,
  Trash,
} from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import * as React from "react";
import { toast } from "sonner";
import { useAppearance, type ColorPalette } from "./theme-provider";

const lightClassicThemes: { name: string; palette: ColorPalette }[] = [
  { name: "Default Light", palette: "default" },
  { name: "Light Monochrome", palette: "monochrome" },
  { name: "Light Pastel", palette: "pastel" },
  { name: "Catppuccin Latte", palette: "catppuccin-latte" },
  { name: "VS Code Light", palette: "vscode" },
];

const darkClassicThemes: { name: string; palette: ColorPalette }[] = [
  { name: "Default Dark", palette: "default" },
  { name: "Dark Monochrome", palette: "monochrome" },
  { name: "Dark Pastel", palette: "pastel" },
  { name: "Catppuccin Frappé", palette: "catppuccin-frappe" },
  { name: "Catppuccin Macchiato", palette: "catppuccin-macchiato" },
  { name: "Catppuccin Mocha", palette: "catppuccin-mocha" },
  { name: "Nord", palette: "nord" },
  { name: "VS Code Dark", palette: "vscode" },
];

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const {
    palette,
    setPalette,
    activePair,
    activePresetId,
    activePreset,
    applyPreset,
    contrastScore,
    algorithm,
    setAlgorithm,
    colorFormat,
    setColorFormat,
    isCustom,
    rollRandomTheme,
    invertTheme,
    applyCustomPair,
    resetTheme,
    isLiveFeedActive,
    setLiveFeedActive,
    liveColors,
    liveConnected,
    liveError,
    favorites,
    toggleFavorite,
    isFavorite,
  } = useAppearance();

  const [mounted, setMounted] = React.useState(false);
  const [engineTab, setEngineTab] = React.useState<"presets" | "studio" | "classic">("presets");
  const [selectedCategory, setSelectedCategory] = React.useState<ThemePresetCategory | "all">(
    "all",
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [formulaBaseH, setFormulaBaseH] = React.useState(260);
  const [formulaAccentH, setFormulaAccentH] = React.useState(40);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    if (!activePair && palette !== "generative" && palette !== "default") {
      setEngineTab("classic");
    }
  }, [activePair, palette]);

  const mode = mounted ? (theme ?? "system") : "system";
  const isDark =
    mode === "dark" ||
    (mode === "system" && mounted && document.documentElement.classList.contains("dark"));

  const currentBg = activePair ? activePair[0] : isDark ? "#09090b" : "#ffffff";
  const currentFg = activePair ? activePair[1] : isDark ? "#f4f4f5" : "#18181b";
  const currentRatio = contrastScore?.wcagRatio ? contrastScore.wcagRatio.toFixed(1) : "14.5";
  const currentApca = contrastScore?.apcaRatio ? contrastScore.apcaRatio.toFixed(0) : "85";

  const formattedBg = formatColor(currentBg, colorFormat);
  const formattedFg = formatColor(currentFg, colorFormat);

  const copyCurrentTokens = () => {
    const css = `/* Generated via ${algorithm} & OKLCH */\n--background: ${formattedBg};\n--foreground: ${formattedFg};`;
    navigator.clipboard.writeText(css);
    setCopied(true);
    toast.success(`Copied ${colorFormat} tokens to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtered 50 presets based on category and search query
  const filteredPresets = React.useMemo(() => {
    return THEME_PRESETS.filter((preset) => {
      const matchesCategory = selectedCategory === "all" || preset.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        preset.name.toLowerCase().includes(q) ||
        preset.hueLabel.toLowerCase().includes(q) ||
        preset.categoryLabel.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const activeCategoryMeta = THEME_PRESET_CATEGORIES.find((c) => c.id === selectedCategory);

  const handleApplyFormula = () => {
    const generated = createOklchThemeHex(formulaBaseH, formulaAccentH, isDark);
    applyCustomPair(generated.bgHex, generated.textHex, {
      surfaceHex: generated.surfaceHex,
      accentHex: generated.accentHex,
    });
    toast.success(`Applied OKLCH Formula (Base: ${formulaBaseH}°, Accent: ${formulaAccentH}°)`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Appearance & Theming</CardTitle>
              <CardDescription>
                Customize Selvam with 50 mathematically verified OKLCH + APCA themes, formula-based
                dynamic generator, or classic palettes.
              </CardDescription>
            </div>
            {/* Engine Tabs */}
            <div className="flex rounded-lg border bg-muted/40 p-1 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setEngineTab("presets")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${
                  engineTab === "presets"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Palette weight="bold" className="size-3.5 text-primary" />
                50 Theme Presets
              </button>
              <button
                type="button"
                onClick={() => setEngineTab("studio")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${
                  engineTab === "studio"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkle weight="bold" className="size-3.5 text-primary" />
                Generator Studio
              </button>
              <button
                type="button"
                onClick={() => setEngineTab("classic")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${
                  engineTab === "classic"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sliders weight="bold" className="size-3.5" />
                Classic Palettes
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Base Mode (Light / Dark / System) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Color Scheme Mode
            </label>
            <div className="flex flex-wrap gap-2" aria-label="Appearance mode">
              {(
                [
                  { value: "light", label: "Light", Icon: Sun },
                  { value: "dark", label: "Dark", Icon: Moon },
                  { value: "system", label: "System", Icon: Laptop },
                ] as const
              ).map(({ value, label, Icon }) => (
                <Button
                  key={value}
                  variant={mode === value ? "secondary" : "outline"}
                  onClick={() => setTheme(value)}
                  aria-pressed={mode === value}
                  size="sm"
                >
                  <Icon className="size-4" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TAB 1: 50 OKLCH + APCA THEME PRESETS                          */}
          {/* ───────────────────────────────────────────────────────────── */}
          {engineTab === "presets" && (
            <div className="space-y-6">
              {/* Category Filter Pills & Search */}
              <div className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory("all")}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                        selectedCategory === "all"
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "bg-muted/50 border text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      All Presets (50)
                    </button>
                    {THEME_PRESET_CATEGORIES.map((cat, idx) => {
                      const isSelected = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                            isSelected
                              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                              : "bg-muted/50 border text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        >
                          {idx + 1}. {cat.name} (10)
                        </button>
                      );
                    })}
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full sm:w-56 shrink-0">
                    <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search themes or hue..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-md border bg-background pl-8 pr-3 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Category Rule Description Banner */}
                {activeCategoryMeta && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-foreground">
                        {activeCategoryMeta.name}
                      </span>
                      <p className="text-muted-foreground">{activeCategoryMeta.description}</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-bold text-primary shrink-0">
                      {activeCategoryMeta.rule}
                    </span>
                  </div>
                )}
              </div>

              {/* Grid of 50 Preset Cards */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                {filteredPresets.map((preset) => {
                  const isSelected =
                    activePresetId === preset.id ||
                    (activePair &&
                      activePair[0].toLowerCase() === preset.bg.hex.toLowerCase() &&
                      activePair[1].toLowerCase() === preset.text.hex.toLowerCase());

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border p-3.5 text-left transition-all hover:scale-[1.01] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        isSelected
                          ? "ring-2 ring-primary border-primary shadow-sm"
                          : "hover:border-foreground/30"
                      }`}
                      style={{ backgroundColor: preset.bg.hex, color: preset.text.hex }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs leading-tight">
                              {preset.name}
                            </span>
                            {isSelected && (
                              <span className="flex size-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
                                <Check className="size-2.5" />
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] opacity-75 font-mono">
                            {preset.hueLabel}
                          </span>
                        </div>
                        <span className="rounded-full bg-black/25 px-1.5 py-0.5 text-[9px] font-bold backdrop-blur-xs text-current border border-current/10 shrink-0">
                          {preset.apca} Lᶜ
                        </span>
                      </div>

                      {/* Visual Swatch Bar */}
                      <div className="mt-3.5 space-y-1">
                        <div className="flex items-center justify-between text-[9px] opacity-75 font-mono">
                          <span>Tokens</span>
                          <span className="uppercase text-[8px] tracking-wider">{preset.mode}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1 rounded-md border border-current/15 p-1 bg-black/10 backdrop-blur-xs">
                          <div
                            className="flex flex-col items-center gap-0.5"
                            title={`Background: ${preset.bg.hex}`}
                          >
                            <div
                              className="h-4 w-full rounded-xs border border-white/20"
                              style={{ backgroundColor: preset.bg.hex }}
                            />
                            <span className="text-[8px] opacity-70">bg</span>
                          </div>
                          <div
                            className="flex flex-col items-center gap-0.5"
                            title={`Surface: ${preset.surface.hex}`}
                          >
                            <div
                              className="h-4 w-full rounded-xs border border-white/20"
                              style={{ backgroundColor: preset.surface.hex }}
                            />
                            <span className="text-[8px] opacity-70">surf</span>
                          </div>
                          <div
                            className="flex flex-col items-center gap-0.5"
                            title={`Text: ${preset.text.hex}`}
                          >
                            <div
                              className="h-4 w-full rounded-xs border border-white/20"
                              style={{ backgroundColor: preset.text.hex }}
                            />
                            <span className="text-[8px] opacity-70">text</span>
                          </div>
                          <div
                            className="flex flex-col items-center gap-0.5"
                            title={`Accent: ${preset.accent.hex}`}
                          >
                            <div
                              className="h-4 w-full rounded-xs shadow-xs"
                              style={{ backgroundColor: preset.accent.hex }}
                            />
                            <span className="text-[8px] font-semibold">acc</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {filteredPresets.length === 0 && (
                <div className="flex h-36 flex-col items-center justify-center rounded-lg border border-dashed text-center text-sm text-muted-foreground">
                  <p>No presets found matching &ldquo;{searchQuery}&rdquo;</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                    className="mt-2 text-xs"
                  >
                    Clear filter
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TAB 2: DYNAMIC GENERATOR STUDIO & REAL-TIME OKLCH FORMULA     */}
          {/* ───────────────────────────────────────────────────────────── */}
          {engineTab === "studio" && (
            <div className="space-y-6">
              {/* Mathematical Generator Formula Card */}
              <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                      <Sparkle weight="fill" className="size-4 text-primary" />
                      Dynamic OKLCH Mathematical Generator Formula
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Locked lightness formula:{" "}
                      {isDark
                        ? "Dark (17% bg, 22% surface, 93% text, 72% accent)"
                        : "Light (97% bg, 93% surface, 21% text, 52% accent)"}
                      .
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => rollRandomTheme({ mode: isDark ? "dark" : "light" })}
                      className="gap-2"
                    >
                      <DiceFive weight="bold" className="size-4" />
                      Roll Random
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={invertTheme}
                      className="gap-2"
                      title="Swap background and foreground"
                    >
                      <ArrowsLeftRight weight="bold" className="size-4" />
                      Invert
                    </Button>
                    {isCustom && (
                      <Button variant="ghost" size="sm" onClick={resetTheme} className="text-xs">
                        <ArrowsClockwise className="size-3.5 mr-1" />
                        Reset
                      </Button>
                    )}
                  </div>
                </div>

                {/* Interactive Formula Hue Sliders */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 pt-2 border-t">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold">Base Hue (Canvas & Surfaces)</span>
                      <span className="font-mono font-bold text-primary">{formulaBaseH}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={formulaBaseH}
                      onChange={(e) => setFormulaBaseH(Number(e.target.value))}
                      className="w-full accent-primary h-2 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold">Accent Hue (Hero Brand & Buttons)</span>
                      <span className="font-mono font-bold text-primary">{formulaAccentH}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={formulaAccentH}
                      onChange={(e) => setFormulaAccentH(Number(e.target.value))}
                      className="w-full accent-primary h-2 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <code className="text-[11px] font-mono text-muted-foreground">
                    createOklchTheme({formulaBaseH}, {formulaAccentH}, {String(isDark)})
                  </code>
                  <Button size="sm" onClick={handleApplyFormula} className="gap-1.5">
                    <CheckCircle weight="bold" className="size-3.5" />
                    Apply Formula Theme
                  </Button>
                </div>
              </div>

              {/* Active Color Preview & Controls */}
              <div className="space-y-4 rounded-xl border bg-card/40 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    {/* Live Primary Contrast Sample */}
                    <div
                      className="relative flex size-16 shrink-0 items-center justify-center rounded-xl border shadow-inner transition-colors duration-300"
                      style={{ backgroundColor: currentBg }}
                    >
                      <span
                        className="text-lg font-bold transition-colors duration-300"
                        style={{ color: currentFg }}
                      >
                        Aa
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Primary APCA Badge */}
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary border border-primary/20">
                          <Sparkle weight="fill" className="size-3" />
                          APCA {currentApca} L<sup>c</sup> • {contrastScore?.apcaLevel ?? "AAA"}
                        </span>
                        {/* WCAG Ratio Badge */}
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          WCAG {currentRatio}:1 {contrastScore?.wcagLevel ?? "AAA"}
                        </span>
                        {/* Active Preset Tag if selected */}
                        {activePreset && (
                          <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                            Preset: {activePreset.name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Derived in perceptually uniform OKLCH. All UI tokens dynamically solved for
                        optimal contrast.
                      </p>
                    </div>
                  </div>

                  {/* Favorite button */}
                  {activePair && (
                    <Button
                      variant={isFavorite(activePair.join(",")) ? "secondary" : "outline"}
                      size="sm"
                      onClick={() =>
                        toggleFavorite({
                          id: activePair.join(","),
                          colors: activePair,
                          contrast: parseFloat(currentRatio),
                          algorithm: algorithm === "APCA" ? "APCA" : "WCAG21",
                          timestamp: new Date().toISOString(),
                        })
                      }
                      className="gap-1.5 self-start md:self-auto"
                    >
                      <Heart
                        weight={isFavorite(activePair.join(",")) ? "fill" : "regular"}
                        className={`size-4 ${isFavorite(activePair.join(",")) ? "text-rose-500" : ""}`}
                      />
                      Favorite
                    </Button>
                  )}
                </div>

                {/* Formatted Code Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 rounded-lg border bg-muted/40 p-3 font-mono text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 overflow-x-auto">
                    <div>
                      <span className="text-muted-foreground select-none mr-1.5">bg:</span>
                      <span className="font-semibold text-foreground select-all">
                        {formattedBg}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground select-none mr-1.5">fg:</span>
                      <span className="font-semibold text-foreground select-all">
                        {formattedFg}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={copyCurrentTokens}
                    className="h-7 gap-1 px-2 text-xs shrink-0 self-end sm:self-auto"
                    title={`Copy CSS tokens in ${colorFormat}`}
                  >
                    {copied ? (
                      <Check className="size-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    {copied ? "Copied" : "Copy CSS"}
                  </Button>
                </div>

                {/* Live In-Situ UI Sample */}
                <div className="rounded-lg border bg-background/60 p-3.5 backdrop-blur-xs space-y-3">
                  <div>
                    <span className="mb-2 block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                      Live Component In-Situ Preview
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button size="xs" variant="default">
                        Primary Action
                      </Button>
                      <Button size="xs" variant="secondary">
                        Secondary
                      </Button>
                      <Button size="xs" variant="outline">
                        Outline
                      </Button>
                      <span className="rounded-md border bg-card px-2 py-1 text-xs font-medium text-card-foreground">
                        Card Container
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Muted secondary text (Lᶜ ≈ 60)
                      </span>
                    </div>
                  </div>

                  {/* Harmonized Chart Series Swatches */}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                        Unified Chart Series Palette (--chart-1 to --chart-5)
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        OKLCH dynamic harmonic
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <div
                            className="h-7 w-full rounded-md border shadow-xs transition-colors duration-300"
                            style={{ backgroundColor: `var(--chart-${i})` }}
                          />
                          <span className="font-mono text-[10px] text-muted-foreground">
                            Series {i}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Algorithms & Color Formats Toolbar */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 rounded-xl border bg-muted/20 p-4">
                {/* Algorithm Selector */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    Contrast Algorithm
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {CONTRAST_ALGORITHMS.map((algo) => {
                      const isSelected = algorithm === algo.id;
                      return (
                        <button
                          key={algo.id}
                          type="button"
                          onClick={() => setAlgorithm(algo.id)}
                          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                            isSelected
                              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                              : "bg-card border text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                          title={algo.description}
                        >
                          <span>{algo.name}</span>
                          {algo.recommended && (
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                                isSelected
                                  ? "bg-white/20 text-white"
                                  : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              Modern
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Format Selector */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    Color Format
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_FORMATS.map((fmt) => {
                      const isSelected = colorFormat === fmt.id;
                      return (
                        <button
                          key={fmt.id}
                          type="button"
                          onClick={() => setColorFormat(fmt.id)}
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                            isSelected
                              ? "bg-foreground text-background font-semibold shadow-xs"
                              : "bg-card border text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <span>{fmt.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Educational APCA Callout */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Info className="size-4 text-primary shrink-0" weight="bold" />
                  Why APCA & OKLCH Produce the Most Elegant Theming
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>APCA (Accessible Perceptual Contrast Algorithm)</strong> is the
                  next-generation contrast standard developed for WCAG 3. Unlike WCAG 2.1&apos;s
                  mathematical ratio, APCA accurately models human visual cortex lightness
                  processing and polarity asymmetry. Combined with <strong>OKLCH</strong>, lightness
                  and chroma stay perceptually uniform across all hues, guaranteeing consistent
                  visual hierarchy across all 50 theme presets.
                </p>
              </div>

              {/* Live Collaborative Stream (randoma11y.com/live) */}
              <div className="rounded-xl border bg-card/50 p-4 space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`size-2.5 rounded-full transition-colors ${
                        isLiveFeedActive && liveConnected
                          ? "bg-emerald-500 animate-pulse"
                          : isLiveFeedActive
                            ? "bg-amber-500 animate-pulse"
                            : "bg-muted-foreground/40"
                      }`}
                    />
                    <div>
                      <h4 className="flex items-center gap-1.5 text-sm font-semibold">
                        <Broadcast weight="bold" className="size-4" />
                        Live Community Feed (randoma11y.com/live)
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {isLiveFeedActive && liveConnected
                          ? "Connected to live stream — showing global color generations in real-time."
                          : isLiveFeedActive && liveError
                            ? `Connection error: ${liveError}`
                            : isLiveFeedActive
                              ? "Connecting to live feed..."
                              : "Connect to receive real-time accessible color pairings streamed from designers worldwide."}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant={isLiveFeedActive ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setLiveFeedActive(!isLiveFeedActive)}
                  >
                    {isLiveFeedActive ? "Disconnect Feed" : "Connect Live Feed"}
                  </Button>
                </div>

                {isLiveFeedActive && (
                  <div className="space-y-3 pt-2">
                    {liveColors.length === 0 ? (
                      <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">
                        Listening for incoming community colors...
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 max-h-64 overflow-y-auto pr-1">
                        {liveColors.slice(0, 12).map((item) => {
                          const isCurrent =
                            activePair?.[0] === item.colors[0] &&
                            activePair?.[1] === item.colors[1];
                          return (
                            <div
                              key={item.id}
                              className={`flex items-center justify-between rounded-lg border p-2.5 transition-all hover:shadow-xs ${
                                isCurrent ? "border-primary ring-1 ring-primary" : ""
                              }`}
                              style={{ backgroundColor: item.colors[0], color: item.colors[1] }}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-semibold">
                                  {item.colors[0]} / {item.colors[1]}
                                </span>
                                <span className="rounded-full bg-black/30 px-1.5 py-0.5 text-[10px] font-medium backdrop-blur-xs">
                                  {item.algorithm === "APCA"
                                    ? `${item.contrast.toFixed(0)} Lᶜ`
                                    : `${item.contrast.toFixed(1)}:1`}
                                </span>
                              </div>
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => applyCustomPair(item.colors[0], item.colors[1])}
                                className="h-6 px-2 text-[11px] bg-black/20 hover:bg-black/40 text-current border-current/20"
                              >
                                Apply
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Saved Favorites */}
              {favorites.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Saved Favorites</h3>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                    {favorites.map((item) => (
                      <div
                        key={item.id}
                        className="group relative flex items-center justify-between rounded-lg border p-3 transition-all hover:scale-[1.02]"
                        style={{ backgroundColor: item.colors[0], color: item.colors[1] }}
                      >
                        <button
                          type="button"
                          onClick={() => applyCustomPair(item.colors[0], item.colors[1])}
                          className="flex flex-col text-left focus:outline-none"
                        >
                          <span className="font-mono text-xs font-semibold">{item.colors[1]}</span>
                          <span className="text-[10px] opacity-80">
                            {item.algorithm === "APCA"
                              ? `${item.contrast.toFixed(0)} Lᶜ APCA`
                              : `${item.contrast.toFixed(1)}:1 WCAG`}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleFavorite(item)}
                          className="opacity-0 transition-opacity group-hover:opacity-100 hover:text-rose-400 p-1"
                          title="Remove favorite"
                        >
                          <Trash className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TAB 3: CURATED CLASSIC STATIC PALETTES                        */}
          {/* ───────────────────────────────────────────────────────────── */}
          {engineTab === "classic" && (
            <div className="grid overflow-hidden rounded-lg border md:grid-cols-2">
              {[
                { title: "Light themes", themes: lightClassicThemes },
                { title: "Dark themes", themes: darkClassicThemes },
              ].map(({ title, themes }) => (
                <section
                  key={title}
                  aria-label={title}
                  className="min-w-0 p-4 md:p-5 [&+section]:border-l"
                >
                  <h3 className="mb-3 flex min-h-8 items-center gap-2 text-sm font-semibold">
                    {title}
                    {mounted && !isCustom && (title === "Dark themes") === isDark && (
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        Active
                      </span>
                    )}
                  </h3>
                  <div className="space-y-1">
                    {themes.map((item) => {
                      const selected =
                        !isCustom &&
                        palette === item.palette &&
                        (title === "Dark themes") === isDark;
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => {
                            setPalette(item.palette);
                            setTheme(title === "Dark themes" ? "dark" : "light");
                          }}
                          aria-pressed={selected}
                          className="flex min-h-11 w-full items-center justify-between rounded-md px-3 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:bg-primary/10 aria-pressed:font-semibold aria-pressed:text-primary"
                        >
                          {item.name}
                          {selected && <Check aria-hidden="true" className="size-4" />}
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
