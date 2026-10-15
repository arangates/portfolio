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
import { CURATED_A11Y_PALETTES } from "@portfolio/ui/lib/theme-engine";
import {
  ArrowsClockwise,
  ArrowsLeftRight,
  Broadcast,
  DiceFive,
  Heart,
  Palette,
  Sparkle,
  Trash,
} from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import * as React from "react";
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
    contrastScore,
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
  const [engineTab, setEngineTab] = React.useState<"algorithmic" | "classic">("algorithmic");

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
  const currentRatio = contrastScore?.wcagRatio.toFixed(1) ?? "14.5";
  const currentApca = contrastScore?.apcaRatio.toFixed(0) ?? "85";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Appearance & Theming</CardTitle>
              <CardDescription>
                Customize how Selvam looks with algorithmic accessible contrast or curated palettes.
              </CardDescription>
            </div>
            {/* Engine Tabs */}
            <div className="flex rounded-lg border bg-muted/40 p-1 text-xs">
              <button
                type="button"
                onClick={() => setEngineTab("algorithmic")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${
                  engineTab === "algorithmic"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkle weight="bold" className="size-3.5 text-primary" />
                RandomA11y Engine
              </button>
              <button
                type="button"
                onClick={() => setEngineTab("classic")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${
                  engineTab === "classic"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Palette weight="bold" className="size-3.5" />
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

          {engineTab === "algorithmic" ? (
            /* ───────────────────────────────────────────────────────────── */
            /* RandomA11y Algorithmic Engine UI                              */
            /* ───────────────────────────────────────────────────────────── */
            <div className="space-y-6">
              {/* Active Color Preview & Control Bar */}
              <div className="overflow-hidden rounded-xl border bg-card p-5 shadow-xs transition-all">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  {/* Swatch & Metrics */}
                  <div className="flex items-center gap-4">
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
                        <span className="font-mono text-sm font-semibold text-foreground">
                          {currentBg.toUpperCase()} / {currentFg.toUpperCase()}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          WCAG {currentRatio}:1 AAA
                        </span>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          APCA {currentApca} L<sup>c</sup>
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Perceptually uniform OKLCH derivation. All semantic tokens mathematically
                        guaranteed $\ge 4.5:1$ contrast.
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
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
                    {activePair && (
                      <Button
                        variant={isFavorite(activePair.join(",")) ? "secondary" : "outline"}
                        size="sm"
                        onClick={() =>
                          toggleFavorite({
                            id: activePair.join(","),
                            colors: activePair,
                            contrast: parseFloat(currentRatio),
                            algorithm: "WCAG21",
                            timestamp: new Date().toISOString(),
                          })
                        }
                        className="gap-1.5"
                      >
                        <Heart
                          weight={isFavorite(activePair.join(",")) ? "fill" : "regular"}
                          className={`size-4 ${isFavorite(activePair.join(",")) ? "text-rose-500" : ""}`}
                        />
                        Favorite
                      </Button>
                    )}
                    {isCustom && (
                      <Button variant="ghost" size="sm" onClick={resetTheme} className="text-xs">
                        <ArrowsClockwise className="size-3.5 mr-1" />
                        Reset
                      </Button>
                    )}
                  </div>
                </div>

                {/* Live In-Situ UI Sample */}
                <div className="mt-5 rounded-lg border bg-background/60 p-3.5 backdrop-blur-xs">
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
                      Muted text ($4.8:1$ verified)
                    </span>
                  </div>
                </div>
              </div>

              {/* ─────────────────────────────────────────────────────────── */}
              {/* Curated Hall of Fame                                        */}
              {/* ─────────────────────────────────────────────────────────── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    Curated A11y Hall of Fame
                  </h3>
                  <span className="text-xs text-muted-foreground">Proven WCAG AAA pairings</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
                  {CURATED_A11Y_PALETTES.map((item) => {
                    const isSelected =
                      activePair?.[0] === item.colors[0] && activePair?.[1] === item.colors[1];
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => applyCustomPair(item.colors[0], item.colors[1])}
                        className={`group relative flex flex-col justify-between overflow-hidden rounded-lg border p-3 text-left transition-all hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          isSelected ? "ring-2 ring-primary" : ""
                        }`}
                        style={{ backgroundColor: item.colors[0], color: item.colors[1] }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">{item.name}</span>
                          {isSelected && <Check weight="bold" className="size-3.5" />}
                        </div>
                        <div className="mt-4 flex items-center justify-between text-[10px] opacity-80">
                          <span className="font-mono">{item.colors[1]}</span>
                          <span className="rounded-full bg-black/20 px-1.5 py-0.5 font-semibold backdrop-blur-xs">
                            {item.contrast}:1
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ─────────────────────────────────────────────────────────── */}
              {/* Live Collaborative Stream (randoma11y.com/live)             */}
              {/* ─────────────────────────────────────────────────────────── */}
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
                          const isSelected =
                            activePair?.[0] === item.colors[0] &&
                            activePair?.[1] === item.colors[1];
                          return (
                            <div
                              key={item.id}
                              className={`flex items-center justify-between rounded-lg border p-2.5 transition-all hover:shadow-xs ${
                                isSelected ? "border-primary ring-1 ring-primary" : ""
                              }`}
                              style={{ backgroundColor: item.colors[0], color: item.colors[1] }}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-semibold">
                                  {item.colors[0]} / {item.colors[1]}
                                </span>
                                <span className="rounded-full bg-black/30 px-1.5 py-0.5 text-[10px] font-medium backdrop-blur-xs">
                                  {item.contrast.toFixed(1)}:1
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

              {/* ─────────────────────────────────────────────────────────── */}
              {/* User Saved Favorites                                        */}
              {/* ─────────────────────────────────────────────────────────── */}
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
                            {item.contrast.toFixed(1)}:1 WCAG
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
          ) : (
            /* ───────────────────────────────────────────────────────────── */
            /* Curated Classic Static Palettes                               */
            /* ───────────────────────────────────────────────────────────── */
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
