"use client";

import {
  applyThemeTokens,
  connectRandomA11yFeed,
  deriveThemeFromPair,
  evaluateContrast,
  generateRandomAccessiblePair,
  type ContrastScore,
  type LiveColorItem,
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
  contrastScore: ContrastScore | null;
  isCustom: boolean;
  rollRandomTheme: (options?: { mode?: "light" | "dark" | "any" }) => void;
  invertTheme: () => void;
  applyCustomPair: (bg: string, fg: string) => void;
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
const STORAGE_FAVORITES = "selvam-theme-favorites";

function ThemeStateProvider({ children }: { children: React.ReactNode }) {
  const { setTheme, theme: currentThemeMode } = useTheme();
  const [palette, setPaletteState] = React.useState<ColorPalette>("default");
  const [activePair, setActivePair] = React.useState<[string, string] | null>(null);
  const [contrastScore, setContrastScore] = React.useState<ContrastScore | null>(null);
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
      const savedPairJson = window.localStorage.getItem(STORAGE_PAIR);
      const savedFavsJson = window.localStorage.getItem(STORAGE_FAVORITES);

      if (savedFavsJson) {
        setFavorites(JSON.parse(savedFavsJson));
      }

      if (savedPairJson) {
        const pair = JSON.parse(savedPairJson) as [string, string];
        if (Array.isArray(pair) && pair.length === 2) {
          setActivePair(pair);
          setContrastScore(evaluateContrast(pair[1], pair[0]));
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

  // Apply a custom accessible pair
  const applyCustomPair = React.useCallback(
    (bg: string, fg: string) => {
      const pair: [string, string] = [bg, fg];
      setActivePair(pair);
      const score = evaluateContrast(fg, bg);
      setContrastScore(score);
      setPaletteState("generative");
      document.documentElement.dataset.palette = "generative";

      const tokens = deriveThemeFromPair(bg, fg);
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
        window.localStorage.setItem(STORAGE_PAIR, JSON.stringify(pair));
        window.localStorage.setItem(STORAGE_PALETTE, "generative");
      } catch {}
    },
    [setTheme],
  );

  // Roll a new accessible pair algorithmically
  const rollRandomTheme = React.useCallback(
    (options?: { mode?: "light" | "dark" | "any" }) => {
      const mode =
        options?.mode ??
        (currentThemeMode === "dark" ? "dark" : currentThemeMode === "light" ? "light" : "any");
      const pair = generateRandomAccessiblePair({ mode, minContrast: 7.0 });
      applyCustomPair(pair[0], pair[1]);
    },
    [applyCustomPair, currentThemeMode],
  );

  // Invert current background and foreground
  const invertTheme = React.useCallback(() => {
    if (!activePair) {
      // If currently on classic theme, roll an inverted pair from current mode
      rollRandomTheme({ mode: currentThemeMode === "dark" ? "light" : "dark" });
      return;
    }
    applyCustomPair(activePair[1], activePair[0]);
  }, [activePair, applyCustomPair, rollRandomTheme, currentThemeMode]);

  // Reset to default static theme
  const resetTheme = React.useCallback(() => {
    setActivePair(null);
    setContrastScore(null);
    setPaletteState("default");
    document.documentElement.dataset.palette = "default";
    applyThemeTokens(null);
    try {
      window.localStorage.removeItem(STORAGE_PAIR);
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
      setContrastScore(null);
      setPaletteState(next);
      document.documentElement.dataset.palette = next;
      applyThemeTokens(null);
      try {
        window.localStorage.removeItem(STORAGE_PAIR);
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
      contrastScore,
      isCustom: Boolean(activePair),
      rollRandomTheme,
      invertTheme,
      applyCustomPair,
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
      contrastScore,
      rollRandomTheme,
      invertTheme,
      applyCustomPair,
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
