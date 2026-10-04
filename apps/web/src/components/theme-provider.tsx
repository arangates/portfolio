"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
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
  | "vscode";

type ThemeContextValue = {
  palette: ColorPalette;
  setPalette: (palette: ColorPalette) => void;
};
const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function useAppearance() {
  const value = React.useContext(ThemeContext);
  if (!value) throw new Error("useAppearance must be used inside ThemeProvider");
  return value;
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const [palette, setPaletteState] = React.useState<ColorPalette>("default");

  React.useEffect(() => {
    const saved = window.localStorage.getItem("selvam-color-palette") as ColorPalette | null;
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
    const next = saved && supported.includes(saved) ? saved : "default";
    setPaletteState(next);
    document.documentElement.dataset.palette = next;
  }, []);

  const setPalette = React.useCallback((next: ColorPalette) => {
    setPaletteState(next);
    document.documentElement.dataset.palette = next;
    window.localStorage.setItem("selvam-color-palette", next);
  }, []);

  return (
    <NextThemesProvider {...props}>
      <ThemeContext.Provider value={{ palette, setPalette }}>{children}</ThemeContext.Provider>
    </NextThemesProvider>
  );
}
