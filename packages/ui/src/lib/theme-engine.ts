/**
 * Algorithmic Contrast & Color Theming Engine
 * Built on OKLCH perceptual color space and WCAG 2.1 / APCA contrast standards.
 * Inspired by RandomA11y (https://randoma11y.com/live)
 */

export interface OklchColor {
  l: number; // 0 to 1
  c: number; // 0 to ~0.4
  h: number; // 0 to 360
}

export interface ContrastScore {
  wcagRatio: number;
  wcagLevel: "AAA" | "AA" | "Fail";
  apcaRatio: number;
  apcaLevel: "AAA" | "AA" | "Fail";
}

export interface ThemeTokens {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  border: string;
  input: string;
  ring: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
}

export interface LiveColorItem {
  id: string;
  colors: [string, string]; // [background, foreground]
  contrast: number;
  algorithm: "WCAG21" | "APCA";
  timestamp: string;
  label?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Color Space Transformations (sRGB ⇄ Linear ⇄ OKLCH)
// ─────────────────────────────────────────────────────────────────────────────

export function hexToRgb(hex: string): [number, number, number] {
  let cleaned = hex.trim().replace(/^#/, "");
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(cleaned, 16);
  if (isNaN(num)) return [0, 0, 0];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v)));
  return (
    "#" +
    [r, g, b]
      .map(clamp)
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
  );
}

export function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function linearToSrgb(c: number): number {
  const v = Math.min(1, Math.max(0, c));
  const s = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  return s * 255;
}

export function rgbToOklch([r, g, b]: [number, number, number]): OklchColor {
  const rLin = srgbToLinear(r);
  const gLin = srgbToLinear(g);
  const bLin = srgbToLinear(b);

  const l_ = Math.cbrt(0.4122214708 * rLin + 0.5363325363 * gLin + 0.0514459929 * bLin);
  const m_ = Math.cbrt(0.2119034982 * rLin + 0.6806995451 * gLin + 0.1073969566 * bLin);
  const s_ = Math.cbrt(0.0883024619 * rLin + 0.2817188376 * gLin + 0.6299787005 * bLin);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bVal = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const C = Math.sqrt(a * a + bVal * bVal);
  const h = (Math.atan2(bVal, a) * (180 / Math.PI) + 360) % 360;

  return { l: L, c: C, h: isNaN(h) ? 0 : h };
}

export function oklchToRgb({ l, c, h }: OklchColor): [number, number, number] {
  const a = c * Math.cos((h * Math.PI) / 180);
  const bVal = c * Math.sin((h * Math.PI) / 180);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * bVal;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * bVal;
  const s_ = l - 0.0894841775 * a - 1.291485548 * bVal;

  const lCubed = l_ * l_ * l_;
  const mCubed = m_ * m_ * m_;
  const sCubed = s_ * s_ * s_;

  const rLin = +4.0767434036 * lCubed - 3.3077115913 * mCubed + 0.2309699292 * sCubed;
  const gLin = -1.2684380046 * lCubed + 2.6097574011 * mCubed - 0.3413193965 * sCubed;
  const bLin = -0.0041960863 * lCubed - 0.7034186147 * mCubed + 1.707614701 * sCubed;

  return [linearToSrgb(rLin), linearToSrgb(gLin), linearToSrgb(bLin)];
}

export function oklchToHex(color: OklchColor): string {
  const [r, g, b] = oklchToRgb(color);
  return rgbToHex(r, g, b);
}

export function formatOklchCss({ l, c, h }: OklchColor): string {
  return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Contrast Calculations (WCAG 2.1 & APCA)
// ─────────────────────────────────────────────────────────────────────────────

export function getLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map(srgbToLinear);
  return 0.2126729 * r! + 0.7151522 * g! + 0.072175 * b!;
}

export function getWcagContrast(hex1: string, hex2: string): number {
  const l1 = getLuminance(hexToRgb(hex1));
  const l2 = getLuminance(hexToRgb(hex2));
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (light + 0.05) / (dark + 0.05);
}

/**
 * APCA (Advanced Perceptual Contrast Algorithm) 0.98G standard
 */
export function getApcaContrast(txtHex: string, bgHex: string): number {
  const txtY = getLuminance(hexToRgb(txtHex));
  const bgY = getLuminance(hexToRgb(bgHex));

  const normBG = 0.56;
  const normTXT = 0.57;
  const revTXT = 0.62;
  const revBG = 0.65;
  const blkThrs = 0.022;
  const blkClmp = 1.414;
  const scaleBoW = 1.14;
  const scaleWoB = 1.14;
  const loBoWoffset = 0.027;
  const loWoBoffset = 0.027;

  const Ytxt = txtY > blkThrs ? txtY : txtY + Math.pow(blkThrs - txtY, blkClmp);
  const Ybg = bgY > blkThrs ? bgY : bgY + Math.pow(blkThrs - bgY, blkClmp);

  if (Math.abs(Ybg - Ytxt) < 0.0005) return 0;

  if (Ybg > Ytxt) {
    const sapc = (Math.pow(Ybg, normBG) - Math.pow(Ytxt, normTXT)) * scaleBoW;
    return sapc < loBoWoffset ? 0 : (sapc - loBoWoffset) * 100;
  } else {
    const sapc = (Math.pow(Ybg, revBG) - Math.pow(Ytxt, revTXT)) * scaleWoB;
    return sapc > -loWoBoffset ? 0 : (sapc + loWoBoffset) * 100;
  }
}

export function evaluateContrast(fgHex: string, bgHex: string): ContrastScore {
  const wcagRatio = getWcagContrast(fgHex, bgHex);
  const apcaRatio = Math.abs(getApcaContrast(fgHex, bgHex));

  const wcagLevel: "AAA" | "AA" | "Fail" =
    wcagRatio >= 7.0 ? "AAA" : wcagRatio >= 4.5 ? "AA" : "Fail";
  const apcaLevel: "AAA" | "AA" | "Fail" =
    apcaRatio >= 75 ? "AAA" : apcaRatio >= 60 ? "AA" : "Fail";

  return { wcagRatio, wcagLevel, apcaRatio, apcaLevel };
}

// ─────────────────────────────────────────────────────────────────────────────
// Semantic Token Derivation Graph
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derives the complete semantic token system used by @portfolio/ui and Tailwind v4
 * from a single accessible background and foreground pair.
 */
export function deriveThemeFromPair(bgHex: string, fgHex: string): ThemeTokens {
  const bg = rgbToOklch(hexToRgb(bgHex));
  const fg = rgbToOklch(hexToRgb(fgHex));
  const isDark = bg.l < 0.5;

  // 1. Surface elevation
  // In dark mode: card is elevated (lighter than canvas) with subtle undertone
  // In light mode: card is crisp elevated white or slightly lighter surface
  const cardL = isDark
    ? Math.min(0.28, Math.max(0.16, bg.l + 0.06))
    : bg.l < 0.96
      ? Math.min(1.0, bg.l + 0.035)
      : 1.0;
  const card = oklchToHex({ l: cardL, c: bg.c * 0.7, h: bg.h });

  // 2. Muted text: algebraically bounded to ~4.8:1 - 5.5:1 against card surface
  const mutedL = isDark ? Math.min(0.85, cardL + 0.4) : Math.max(0.22, cardL - 0.44);
  const mutedForeground = oklchToHex({ l: mutedL, c: fg.c * 0.35, h: fg.h });

  // 3. Secondary & Accent surfaces
  const secondaryL = isDark ? bg.l + 0.08 : Math.max(0.92, bg.l - 0.045);
  const secondary = oklchToHex({ l: secondaryL, c: bg.c * 0.8, h: bg.h });

  const accentL = isDark ? bg.l + 0.1 : Math.max(0.9, bg.l - 0.06);
  const accent = oklchToHex({ l: accentL, c: bg.c * 1.1, h: bg.h });

  // 4. Borders & Inputs: calibrated ΔL for clear 3:1 non-text boundary
  const borderL = isDark ? bg.l + 0.12 : Math.max(0.78, bg.l - 0.08);
  const border = oklchToHex({ l: borderL, c: bg.c * 0.4, h: bg.h });

  // 5. Primary button & solved text contrast
  const primary = fgHex;
  const whiteContrast = getWcagContrast(primary, "#ffffff");
  const darkContrast = getWcagContrast(primary, "#09090b");
  const primaryForeground =
    whiteContrast >= darkContrast && whiteContrast >= 4.5 ? "#ffffff" : "#09090b";

  // 6. Destructive status (anchored to danger red hue 27°)
  const destructiveL = isDark ? 0.68 : 0.58;
  const destructive = oklchToHex({ l: destructiveL, c: 0.22, h: 27 });

  // 7. Sidebar tokens
  const sidebarL = isDark ? Math.max(0.1, bg.l - 0.02) : Math.min(0.98, bg.l - 0.015);
  const sidebar = oklchToHex({ l: sidebarL, c: bg.c * 0.6, h: bg.h });

  // 8. 5-Series Chart Harmonies (Equidistant OKLCH hue rotation)
  // Ensures distinct categorical series in ECharts that contrast with canvas
  const chartL = isDark ? 0.72 : 0.52;
  const chartC = 0.15;
  const baseHue = fg.h || 240;
  const charts = [0, 72, 144, 216, 288].map((offset) =>
    oklchToHex({ l: chartL, c: chartC, h: (baseHue + offset) % 360 }),
  );

  return {
    background: bgHex,
    foreground: fgHex,
    card,
    cardForeground: fgHex,
    popover: card,
    popoverForeground: fgHex,
    primary,
    primaryForeground,
    secondary,
    secondaryForeground: fgHex,
    muted: secondary,
    mutedForeground,
    accent,
    accentForeground: fgHex,
    destructive,
    border,
    input: border,
    ring: primary,
    chart1: charts[0]!,
    chart2: charts[1]!,
    chart3: charts[2]!,
    chart4: charts[3]!,
    chart5: charts[4]!,
    sidebar,
    sidebarForeground: fgHex,
    sidebarPrimary: primary,
    sidebarPrimaryForeground: primaryForeground,
    sidebarAccent: secondary,
    sidebarAccentForeground: fgHex,
    sidebarBorder: border,
    sidebarRing: primary,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DOM Injection & Runtime Application
// ─────────────────────────────────────────────────────────────────────────────

const CSS_VAR_MAP: Record<keyof ThemeTokens, string> = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  popover: "--popover",
  popoverForeground: "--popover-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  destructive: "--destructive",
  border: "--border",
  input: "--input",
  ring: "--ring",
  chart1: "--chart-1",
  chart2: "--chart-2",
  chart3: "--chart-3",
  chart4: "--chart-4",
  chart5: "--chart-5",
  sidebar: "--sidebar",
  sidebarForeground: "--sidebar-foreground",
  sidebarPrimary: "--sidebar-primary",
  sidebarPrimaryForeground: "--sidebar-primary-foreground",
  sidebarAccent: "--sidebar-accent",
  sidebarAccentForeground: "--sidebar-accent-foreground",
  sidebarBorder: "--sidebar-border",
  sidebarRing: "--sidebar-ring",
};

/**
 * Applies or removes dynamic CSS custom properties directly onto document.documentElement.
 */
export function applyThemeTokens(tokens: ThemeTokens | null, doc: Document = document): void {
  if (typeof doc === "undefined") return;
  const root = doc.documentElement;

  if (!tokens) {
    // Clear dynamic overrides so static stylesheet takes over
    for (const varName of Object.values(CSS_VAR_MAP)) {
      root.style.removeProperty(varName);
    }
    delete root.dataset.generativeTheme;
    return;
  }

  // Apply all semantic tokens
  for (const [key, varName] of Object.entries(CSS_VAR_MAP)) {
    const val = tokens[key as keyof ThemeTokens];
    if (val) {
      root.style.setProperty(varName, val);
    }
  }
  root.dataset.generativeTheme = "true";

  // Synchronize mobile status bar / browser chrome
  updateMetaThemeColor(tokens.background, doc);
}

export function updateMetaThemeColor(hex: string, doc: Document = document): void {
  if (typeof doc === "undefined") return;
  const metas = doc.querySelectorAll('meta[name="theme-color"]');
  if (metas.length === 0) {
    const meta = doc.createElement("meta");
    meta.setAttribute("name", "theme-color");
    meta.setAttribute("content", hex);
    doc.head.appendChild(meta);
  } else {
    metas.forEach((meta) => meta.setAttribute("content", hex));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Procedural Accessible Randomizer (Offline Generator)
// ─────────────────────────────────────────────────────────────────────────────

export function generateRandomAccessiblePair(options?: {
  mode?: "light" | "dark" | "any";
  minContrast?: number;
  algorithm?: "WCAG21" | "APCA";
}): [string, string] {
  const { mode = "any", minContrast = 7.0, algorithm = "WCAG21" } = options ?? {};

  for (let attempt = 0; attempt < 500; attempt++) {
    // Pick background luminance based on requested mode
    const isDark = mode === "dark" ? true : mode === "light" ? false : Math.random() > 0.5;

    const bgL = isDark
      ? 0.08 + Math.random() * 0.12 // 0.08 to 0.20
      : 0.94 + Math.random() * 0.05; // 0.94 to 0.99
    const bgC = Math.random() * 0.04; // subtle canvas chroma
    const bgH = Math.random() * 360;
    const bgHex = oklchToHex({ l: bgL, c: bgC, h: bgH });

    // Pick vibrant foreground
    const fgL = isDark
      ? 0.75 + Math.random() * 0.22 // bright text on dark
      : 0.12 + Math.random() * 0.25; // dark text on light
    const fgC = 0.05 + Math.random() * 0.18; // vibrant or refined
    const fgH = Math.random() * 360;
    const fgHex = oklchToHex({ l: fgL, c: fgC, h: fgH });

    // Verify contrast compliance
    if (algorithm === "APCA") {
      const apca = Math.abs(getApcaContrast(fgHex, bgHex));
      if (apca >= (minContrast >= 7.0 ? 75 : 60)) {
        return [bgHex, fgHex];
      }
    } else {
      const wcag = getWcagContrast(fgHex, bgHex);
      if (wcag >= minContrast) {
        return [bgHex, fgHex];
      }
    }
  }

  // Guaranteed fallback
  return mode === "light" ? ["#fafafa", "#18181b"] : ["#09090b", "#4ade80"];
}

// ─────────────────────────────────────────────────────────────────────────────
// Curated Palette Hall of Fame (RandomA11y Classics)
// ─────────────────────────────────────────────────────────────────────────────

export interface CuratedPalette {
  id: string;
  name: string;
  mode: "dark" | "light";
  colors: [string, string]; // [bg, fg]
  contrast: number;
}

export const CURATED_A11Y_PALETTES: CuratedPalette[] = [
  {
    id: "cyber-emerald",
    name: "Cyber Emerald",
    mode: "dark",
    colors: ["#0b0d13", "#38ef7d"],
    contrast: 13.9,
  },
  {
    id: "electric-indigo",
    name: "Electric Indigo",
    mode: "dark",
    colors: ["#0a0e17", "#60a5fa"],
    contrast: 8.9,
  },
  {
    id: "vesper-violet",
    name: "Vesper Violet",
    mode: "dark",
    colors: ["#120c1f", "#f472b6"],
    contrast: 9.2,
  },
  {
    id: "amber-glow",
    name: "Amber Glow",
    mode: "dark",
    colors: ["#14110b", "#fbbf24"],
    contrast: 12.8,
  },
  {
    id: "deep-teal",
    name: "Deep Teal",
    mode: "dark",
    colors: ["#001a1d", "#2dd4bf"],
    contrast: 11.4,
  },
  {
    id: "nordic-snow",
    name: "Nordic Snow",
    mode: "light",
    colors: ["#f8fafc", "#0f172a"],
    contrast: 17.5,
  },
  {
    id: "espresso-cream",
    name: "Espresso Cream",
    mode: "light",
    colors: ["#faf7f2", "#38281d"],
    contrast: 12.6,
  },
  {
    id: "sage-minimal",
    name: "Sage Minimal",
    mode: "light",
    colors: ["#f2f7f4", "#1b4332"],
    contrast: 10.4,
  },
  {
    id: "cobalt-clean",
    name: "Cobalt Clean",
    mode: "light",
    colors: ["#f5f8ff", "#1e3a8a"],
    contrast: 12.1,
  },
  {
    id: "soft-lavender",
    name: "Soft Lavender",
    mode: "light",
    colors: ["#faf5ff", "#581c87"],
    contrast: 13.1,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Real-Time WebSocket Feed (randoma11y.com/live)
// ─────────────────────────────────────────────────────────────────────────────

export const RANDOM_A11Y_FEED_WS = "wss://randoma11y-feed.adam-f8f.workers.dev/ws";

export interface FeedSubscriptionHandlers {
  onInitial?: (data: { colors: LiveColorItem[]; favorites: LiveColorItem[] }) => void;
  onNewColor?: (color: LiveColorItem) => void;
  onNewFavorite?: (favorite: LiveColorItem) => void;
  onStatusChange?: (connected: boolean, error?: string | null) => void;
}

export function connectRandomA11yFeed(handlers: FeedSubscriptionHandlers): () => void {
  if (typeof window === "undefined" || typeof WebSocket === "undefined") {
    return () => {};
  }

  let ws: WebSocket | null = null;
  let retryCount = 0;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let isClosedExplicitly = false;

  function connect() {
    if (isClosedExplicitly) return;
    try {
      ws = new WebSocket(RANDOM_A11Y_FEED_WS);

      ws.onopen = () => {
        retryCount = 0;
        handlers.onStatusChange?.(true, null);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          switch (msg.type) {
            case "initial": {
              const colors: LiveColorItem[] = (msg.recentColors || []).map(formatFeedItem);
              const favorites: LiveColorItem[] = (msg.recentFavorites || []).map(formatFeedItem);
              handlers.onInitial?.({ colors, favorites });
              break;
            }
            case "newColor": {
              if (msg.color) {
                handlers.onNewColor?.(formatFeedItem(msg.color));
              }
              break;
            }
            case "newFavorite": {
              if (msg.favorite) {
                handlers.onNewFavorite?.(formatFeedItem(msg.favorite));
              }
              break;
            }
          }
        } catch {
          // ignore malformed frame
        }
      };

      ws.onerror = () => {
        handlers.onStatusChange?.(false, "Connection error");
      };

      ws.onclose = () => {
        handlers.onStatusChange?.(false, null);
        if (!isClosedExplicitly && retryCount < 5) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 15000);
          retryCount++;
          retryTimer = setTimeout(connect, delay);
        }
      };
    } catch (err) {
      handlers.onStatusChange?.(false, err instanceof Error ? err.message : "Failed to connect");
    }
  }

  function formatFeedItem(raw: any): LiveColorItem {
    return {
      id: raw.id || Math.random().toString(36).slice(2),
      colors: [raw.colors?.[0] || "#111111", raw.colors?.[1] || "#ffffff"],
      contrast: typeof raw.contrast === "number" ? raw.contrast : 7.0,
      algorithm: raw.algorithm === "APCA" ? "APCA" : "WCAG21",
      timestamp: raw.timestamp || new Date().toISOString(),
      label: raw.label,
    };
  }

  connect();

  return () => {
    isClosedExplicitly = true;
    if (retryTimer) clearTimeout(retryTimer);
    if (ws) {
      ws.close();
      ws = null;
    }
  };
}
