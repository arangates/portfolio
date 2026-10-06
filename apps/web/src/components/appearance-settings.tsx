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
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useAppearance, type ColorPalette } from "./theme-provider";

const lightThemes: { name: string; palette: ColorPalette }[] = [
  { name: "Light", palette: "default" },
  { name: "Light Monochrome", palette: "monochrome" },
  { name: "Light Pastel", palette: "pastel" },
  { name: "Catppuccin Latte", palette: "catppuccin-latte" },
  { name: "VS Code Light", palette: "vscode" },
];
const darkThemes: { name: string; palette: ColorPalette }[] = [
  { name: "Dark", palette: "default" },
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
  const { palette, setPalette } = useAppearance();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const mode = mounted ? (theme ?? "system") : "system";
  const dark =
    mode === "dark" ||
    (mode === "system" && mounted && document.documentElement.classList.contains("dark"));
  const activeThemes = dark ? darkThemes : lightThemes;
  const activeThemeName =
    activeThemes.find((item) => item.palette === palette)?.name ?? (dark ? "Dark" : "Light");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Choose how Selvam looks across your devices and sessions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
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
            >
              <Icon className="size-4" />
              {label}
            </Button>
          ))}
        </div>
        <div className="grid overflow-hidden rounded-lg border md:grid-cols-2">
          {[
            { title: "Light themes", themes: lightThemes },
            { title: "Dark themes", themes: darkThemes },
          ].map(({ title, themes }) => (
            <section
              key={title}
              aria-label={title}
              className="min-w-0 p-4 md:p-5 [&+section]:border-l"
            >
              <h3 className="mb-3 flex min-h-8 items-center gap-2 text-sm font-semibold">
                {title}
                {mounted && (title === "Dark themes") === dark && (
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    Active
                  </span>
                )}
              </h3>
              <div className="space-y-1">
                {themes.map((item) => {
                  const selected = palette === item.palette && activeThemeName === item.name;
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
      </CardContent>
    </Card>
  );
}
