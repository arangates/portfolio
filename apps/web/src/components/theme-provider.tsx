"use client";

import {
  applyThemeTokens,
  connectRandomA11yFeed,
  deriveThemeFromPair,
  evaluateContrast,
  generateRandomAccessiblePair,
  THEME_PRESETS,
  type ColorFormat,
  type ContrastAlgorithm,
  type ContrastScore,
  type LiveColorItem,
  type ThemePreset,
} from "@portfolio/ui/lib/theme-engine";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import * as React from "react";

export type ColorPalette =
  | "default"
  | "monochrome"
  | "pastel"
  | "catppuccin-latte"
  | "catppuccin-frappe"
  | "catppuccin-macchiato"
  | "catppuccin-mocha"
  | "nord"
  | "vscode"
  | "generative";

export interface ThemeContextValue {
  palette: ColorPalette;
  setPalette: (palette: ColorPalette) => void;
  activePair: [string, string] | null;
  activePresetId: string | null;
  activePreset: ThemePreset | null;
  contrastScore: ContrastScore | null;
  algorithm: ContrastAlgorithm;
  setAlgorithm: (algo: ContrastAlgorithm) => void;
  colorFormat: ColorFormat;
  setColorFormat: (format: ColorFormat) => void;
  threshold: number;
  setThreshold: (thresh: number) => void;
  isCustom: boolean;
  rollRandomTheme: (options?: { mode?: "light" | "dark" | "any" }) => void;
  invertTheme: () => void;
  applyCustomPair: (
    bg: string,
    fg: string,
    options?: { surfaceHex?: string; accentHex?: string; presetId?: string },
  ) => void;
  applyPreset: (preset: ThemePreset) => void;
  resetTheme: () => void;
  isLiveFeedActive: boolean;
  setLiveFeedActive: (active: boolean) => void;
  liveColors: LiveColorItem[];
  liveFavorites: LiveColorItem[];
  liveConnected: boolean;
  liveError: string | null;
  favorites: LiveColorItem[];
  toggleFavorite: (item: LiveColorItem) => void;
  isFavorite: (id: string) => boolean;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function useAppearance(): ThemeContextValue {
  const value = React.useContext(ThemeContext);
  if (!value) throw new Error("useAppearance must be used inside ThemeProvider");
  return value;
}

const STORAGE_PALETTE = "selvam-color-palette";
const STORAGE_PAIR = "selvam-custom-pair";
const STORAGE_PRESET = "selvam-theme-preset";
const STORAGE_FAVORITES = "selvam-theme-favorites";
const STORAGE_ALGO = "selvam-contrast-algo";
const STORAGE_FORMAT = "selvam-color-format";
const STORAGE_THRESHOLD = "selvam-contrast-threshold";

function ThemeStateProvider({ children }: { children: React.ReactNode }) {
  const { setTheme, theme: currentThemeMode } = useTheme();
  const [palette, setPaletteState] = React.useState<ColorPalette>("default");
  const [activePair, setActivePair] = React.useState<[string, string] | null>(null);
  const [activePresetId, setActivePresetId] = React.useState<string | null>(null);
  const [contrastScore, setContrastScore] = React.useState<ContrastScore | null>(null);
  const [algorithm, setAlgorithmState] = React.useState<ContrastAlgorithm>("APCA");
  const [colorFormat, setColorFormatState] = React.useState<ColorFormat>("OKLCH");
  const [threshold, setThresholdState] = React.useState<number>(75);
  const [favorites, setFavorites] = React.useState<LiveColorItem[]>([]);

  // Live feed states (randoma11y.com/live)
  const [isLiveFeedActive, setLiveFeedActive] = React.useState(false);
  const [liveColors, setLiveColors] = React.useState<LiveColorItem[]>([]);
  const [liveFavorites, setLiveFavorites] = React.useState<LiveColorItem[]>([]);
  const [liveConnected, setLiveConnected] = React.useState(false);
  const [liveError, setLiveError] = React.useState<string | null>(null);

  // Initialize from localStorage on mount
  React.useEffect(() => {
    try {
      const savedPalette = window.localStorage.getItem(STORAGE_PALETTE) as ColorPalette | null;
      const savedPresetId = window.localStorage.getItem(STORAGE_PRESET);
      const savedPairJson = window.localStorage.getItem(STORAGE_PAIR);
      const savedFavsJson = window.localStorage.getItem(STORAGE_FAVORITES);
      const savedAlgo = window.localStorage.getItem(STORAGE_ALGO) as ContrastAlgorithm | null;
      const savedFormat = window.localStorage.getItem(STORAGE_FORMAT) as ColorFormat | null;
      const savedThreshold = window.localStorage.getItem(STORAGE_THRESHOLD);

      const validAlgos: ContrastAlgorithm[] = [
        "APCA",
        "WCAG21",
        "Michelson",
        "Weber",
        "L_star",
        "DeltaPhi",
      ];
      const validFormats: ColorFormat[] = [
        "OKLCH",
        "HEX",
        "Display-P3",
        "RGB",
        "HSL",
        "LAB",
        "OKLAB",
        "REC.2020",
        "LCH",
      ];

      const initialAlgo = savedAlgo && validAlgos.includes(savedAlgo) ? savedAlgo : "APCA";
      setAlgorithmState(initialAlgo);

      const initialFormat =
        savedFormat && validFormats.includes(savedFormat) ? savedFormat : "OKLCH";
      setColorFormatState(initialFormat);

      if (savedThreshold) {
        const parsedThresh = parseFloat(savedThreshold);
        if (!isNaN(parsedThresh)) setThresholdState(parsedThresh);
      } else {
        setThresholdState(initialAlgo === "APCA" ? 75 : 7.0);
      }

      if (savedFavsJson) {
        setFavorites(JSON.parse(savedFavsJson));
      }

      // Check if a 50-preset theme was active
      if (savedPresetId) {
        const found = THEME_PRESETS.find((p) => p.id === savedPresetId);
        if (found) {
          setActivePresetId(found.id);
          setActivePair([found.bg.hex, found.text.hex]);
          setContrastScore(evaluateContrast(found.text.hex, found.bg.hex, initialAlgo));
          setPaletteState("generative");
          document.documentElement.dataset.palette = "generative";
          const tokens = deriveThemeFromPair(found.bg.hex, found.text.hex, {
            surfaceHex: found.surface.hex,
            accentHex: found.accent.hex,
          });
          applyThemeTokens(tokens);
          return;
        }
      }

      if (savedPairJson) {
        const pair = JSON.parse(savedPairJson) as [string, string];
        if (Array.isArray(pair) && pair.length === 2) {
          setActivePair(pair);
          setContrastScore(evaluateContrast(pair[1], pair[0], initialAlgo));
          setPaletteState("generative");
          document.documentElement.dataset.palette = "generative";
          const tokens = deriveThemeFromPair(pair[0], pair[1]);
          applyThemeTokens(tokens);
          return;
        }
      }

      const supported: ColorPalette[] = [
        "default",
        "monochrome",
        "pastel",
        "catppuccin-latte",
        "catppuccin-frappe",
        "catppuccin-macchiato",
        "catppuccin-mocha",
        "nord",
        "vscode",
      ];
      const next = savedPalette && supported.includes(savedPalette) ? savedPalette : "default";
      setPaletteState(next);
      document.documentElement.dataset.palette = next;
      applyThemeTokens(null);
    } catch {
      // fallback cleanly
    }
  }, []);

  // Connect to WebSocket when isLiveFeedActive is true
  React.useEffect(() => {
    if (!isLiveFeedActive) {
      setLiveConnected(false);
      setLiveError(null);
      return;
    }

    const disconnect = connectRandomA11yFeed({
      onInitial: ({ colors, favorites: favs }) => {
        setLiveColors(colors);
        setLiveFavorites(favs);
      },
      onNewColor: (newColor) => {
        setLiveColors((prev) => {
          const filtered = prev.filter(
            (c) => !(c.colors[0] === newColor.colors[0] && c.colors[1] === newColor.colors[1]),
          );
          return [newColor, ...filtered].slice(0, 50);
        });
      },
      onNewFavorite: (newFav) => {
        setLiveFavorites((prev) => {
          const filtered = prev.filter(
            (c) => !(c.colors[0] === newFav.colors[0] && c.colors[1] === newFav.colors[1]),
          );
          return [newFav, ...filtered].slice(0, 50);
        });
      },
      onStatusChange: (connected, error) => {
        setLiveConnected(connected);
        setLiveError(error || null);
      },
    });

    return () => disconnect();
  }, [isLiveFeedActive]);

  // Set algorithm and update score dynamically
  const setAlgorithm = React.useCallback(
    (nextAlgo: ContrastAlgorithm) => {
      setAlgorithmState(nextAlgo);
      // Auto-adjust default threshold when switching algorithm
      const defaultThresh =
        nextAlgo === "APCA"
          ? 75
          : nextAlgo === "WCAG21"
            ? 7.0
            : nextAlgo === "Michelson"
              ? 0.7
              : nextAlgo === "Weber"
                ? 3.5
                : nextAlgo === "L_star"
                  ? 60
                  : 50;
      setThresholdState(defaultThresh);
      try {
        window.localStorage.setItem(STORAGE_ALGO, nextAlgo);
        window.localStorage.setItem(STORAGE_THRESHOLD, String(defaultThresh));
      } catch {}

      if (activePair) {
        setContrastScore(evaluateContrast(activePair[1], activePair[0], nextAlgo));
      }
    },
    [activePair],
  );

  const setColorFormat = React.useCallback((nextFormat: ColorFormat) => {
    setColorFormatState(nextFormat);
    try {
      window.localStorage.setItem(STORAGE_FORMAT, nextFormat);
    } catch {}
  }, []);

  const setThreshold = React.useCallback((nextThresh: number) => {
    setThresholdState(nextThresh);
    try {
      window.localStorage.setItem(STORAGE_THRESHOLD, String(nextThresh));
    } catch {}
  }, []);

  // Memoized active preset if currently matching one of the 50 presets
  const activePreset = React.useMemo(() => {
    if (activePresetId) {
      return THEME_PRESETS.find((p) => p.id === activePresetId) ?? null;
    }
    if (!activePair) return null;
    return (
      THEME_PRESETS.find(
        (p) =>
          p.bg.hex.toLowerCase() === activePair[0].toLowerCase() &&
          p.text.hex.toLowerCase() === activePair[1].toLowerCase(),
      ) ?? null
    );
  }, [activePresetId, activePair]);

  // Apply a custom accessible pair with optional surface, accent, and presetId
  const applyCustomPair = React.useCallback(
    (
      bg: string,
      fg: string,
      options?: { surfaceHex?: string; accentHex?: string; presetId?: string },
    ) => {
      const pair: [string, string] = [bg, fg];
      setActivePair(pair);
      setActivePresetId(options?.presetId ?? null);
      const score = evaluateContrast(fg, bg, algorithm);
      setContrastScore(score);
      setPaletteState("generative");
      document.documentElement.dataset.palette = "generative";

      const tokens = deriveThemeFromPair(bg, fg, options);
      applyThemeTokens(tokens);

      // Harmonize dark/light class with background lightness
      const bgHexClean = bg.replace(/^#/, "");
      const num = parseInt(
        bgHexClean.length === 3
          ? bgHexClean
              .split("")
              .map((c) => c + c)
              .join("")
          : bgHexClean,
        16,
      );
      const [r, g, b] = [(num >> 16) & 255, (num >> 8) & 255, num & 255];
      const isDark = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.45;
      setTheme(isDark ? "dark" : "light");

      try {
        if (options?.presetId) {
          window.localStorage.setItem(STORAGE_PRESET, options.presetId);
        } else {
          window.localStorage.removeItem(STORAGE_PRESET);
        }
        window.localStorage.setItem(STORAGE_PAIR, JSON.stringify(pair));
        window.localStorage.setItem(STORAGE_PALETTE, "generative");
      } catch {}
    },
    [algorithm, setTheme],
  );

  // Directly apply one of the 50 mathematically verified presets
  const applyPreset = React.useCallback(
    (preset: ThemePreset) => {
      applyCustomPair(preset.bg.hex, preset.text.hex, {
        surfaceHex: preset.surface.hex,
        accentHex: preset.accent.hex,
        presetId: preset.id,
      });
      setTheme(preset.mode);
    },
    [applyCustomPair, setTheme],
  );

  // Roll a new accessible pair algorithmically using active algorithm & threshold
  const rollRandomTheme = React.useCallback(
    (options?: { mode?: "light" | "dark" | "any" }) => {
      const mode =
        options?.mode ??
        (currentThemeMode === "dark" ? "dark" : currentThemeMode === "light" ? "light" : "any");
      const pair = generateRandomAccessiblePair({
        mode,
        minContrast: threshold,
        algorithm,
      });
      applyCustomPair(pair[0], pair[1]);
    },
    [algorithm, applyCustomPair, currentThemeMode, threshold],
  );

  // Invert current background and foreground
  const invertTheme = React.useCallback(() => {
    if (!activePair) {
      rollRandomTheme({ mode: currentThemeMode === "dark" ? "light" : "dark" });
      return;
    }
    applyCustomPair(activePair[1], activePair[0]);
  }, [activePair, applyCustomPair, rollRandomTheme, currentThemeMode]);

  // Reset to default static theme
  const resetTheme = React.useCallback(() => {
    setActivePair(null);
    setActivePresetId(null);
    setContrastScore(null);
    setPaletteState("default");
    document.documentElement.dataset.palette = "default";
    applyThemeTokens(null);
    try {
      window.localStorage.removeItem(STORAGE_PAIR);
      window.localStorage.removeItem(STORAGE_PRESET);
      window.localStorage.setItem(STORAGE_PALETTE, "default");
    } catch {}
  }, []);

  // Standard palette setter for classic presets
  const setPalette = React.useCallback(
    (next: ColorPalette) => {
      if (next === "generative") {
        rollRandomTheme();
        return;
      }
      setActivePair(null);
      setActivePresetId(null);
      setContrastScore(null);
      setPaletteState(next);
      document.documentElement.dataset.palette = next;
      applyThemeTokens(null);
      try {
        window.localStorage.removeItem(STORAGE_PAIR);
        window.localStorage.removeItem(STORAGE_PRESET);
        window.localStorage.setItem(STORAGE_PALETTE, next);
      } catch {}
    },
    [rollRandomTheme],
  );

  // Favorites management
  const toggleFavorite = React.useCallback((item: LiveColorItem) => {
    setFavorites((prev) => {
      const exists = prev.some(
        (f) =>
          f.id === item.id || (f.colors[0] === item.colors[0] && f.colors[1] === item.colors[1]),
      );
      let updated: LiveColorItem[];
      if (exists) {
        updated = prev.filter(
          (f) =>
            f.id !== item.id && !(f.colors[0] === item.colors[0] && f.colors[1] === item.colors[1]),
        );
      } else {
        updated = [item, ...prev];
      }
      try {
        window.localStorage.setItem(STORAGE_FAVORITES, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const isFavorite = React.useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites],
  );

  const contextValue: ThemeContextValue = React.useMemo(
    () => ({
      palette,
      setPalette,
      activePair,
      activePresetId,
      activePreset,
      contrastScore,
      algorithm,
      setAlgorithm,
      colorFormat,
      setColorFormat,
      threshold,
      setThreshold,
      isCustom: Boolean(activePair),
      rollRandomTheme,
      invertTheme,
      applyCustomPair,
      applyPreset,
      resetTheme,
      isLiveFeedActive,
      setLiveFeedActive,
      liveColors,
      liveFavorites,
      liveConnected,
      liveError,
      favorites,
      toggleFavorite,
      isFavorite,
    }),
    [
      palette,
      setPalette,
      activePair,
      activePresetId,
      activePreset,
      contrastScore,
      algorithm,
      setAlgorithm,
      colorFormat,
      setColorFormat,
      threshold,
      setThreshold,
      rollRandomTheme,
      invertTheme,
      applyCustomPair,
      applyPreset,
      resetTheme,
      isLiveFeedActive,
      liveColors,
      liveFavorites,
      liveConnected,
      liveError,
      favorites,
      toggleFavorite,
      isFavorite,
    ],
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <ThemeStateProvider>{children}</ThemeStateProvider>
    </NextThemesProvider>
  );
}
