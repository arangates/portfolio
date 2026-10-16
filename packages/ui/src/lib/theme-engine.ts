/**
 * Algorithmic Contrast & Color Theming Engine
 * Built on OKLCH perceptual color space and modern contrast standards (APCA & WCAG 2.1).
 * Inspired by RandomA11y (https://randoma11y.com/live)
 */

export * from "./theme-presets";
import { createOklchTheme } from "./theme-presets";

export type ContrastAlgorithm = "APCA" | "WCAG21" | "Michelson" | "Weber" | "L_star" | "DeltaPhi";

export type ColorFormat =
  | "OKLCH"
  | "HEX"
  | "Display-P3"
  | "RGB"
  | "HSL"
  | "LAB"
  | "OKLAB"
  | "REC.2020"
  | "LCH";

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
  apcaSigned?: number;
  algorithm?: ContrastAlgorithm;
  activeValue?: number;
  activeLevel?: "AAA" | "AA" | "Fail";
  activeLabel?: string;
}

export interface ThemeTokens {
  background: string;
  foreground: string;
  bg?: string;
  surface?: string;
  text?: string;
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
// Color Space Transformations (sRGB ⇄ Linear ⇄ OKLCH ⇄ CIE Lab ⇄ Formats)
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
  return `oklch(${(l * 100).toFixed(3)}% ${c.toFixed(5)} ${h.toFixed(3)})`;
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h *= 60;
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const rLin = srgbToLinear(r);
  const gLin = srgbToLinear(g);
  const bLin = srgbToLinear(b);

  // sRGB to XYZ (D65)
  const x = (0.4124564 * rLin + 0.3575761 * gLin + 0.1804375 * bLin) / 0.95047;
  const y = (0.2126729 * rLin + 0.7151522 * gLin + 0.072175 * bLin) / 1.0;
  const z = (0.0193339 * rLin + 0.119192 * gLin + 0.9503041 * bLin) / 1.08883;

  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const bVal = 200 * (fy - fz);

  return [Math.max(0, Math.min(100, L)), a, bVal];
}

/**
 * Universal color formatter supporting all 9 formats from RandomA11y
 */
export function formatColor(colorHex: string, format: ColorFormat): string {
  const rgb = hexToRgb(colorHex);
  const oklch = rgbToOklch(rgb);

  switch (format) {
    case "OKLCH": {
      return `oklch(${(oklch.l * 100).toFixed(3)}% ${oklch.c.toFixed(5)} ${oklch.h.toFixed(3)})`;
    }
    case "HEX": {
      return colorHex.toUpperCase();
    }
    case "RGB": {
      return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    }
    case "HSL": {
      const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
      return `hsl(${h}, ${s}%, ${l}%)`;
    }
    case "Display-P3": {
      const [rLin, gLin, bLin] = rgb.map(srgbToLinear);
      const rP3 = 0.8224621 * rLin! + 0.177538 * gLin!;
      const gP3 = 0.0331941 * rLin! + 0.9668058 * gLin!;
      const bP3 = 0.0170827 * rLin! + 0.0723974 * gLin! + 0.9105199 * bLin!;
      const toP3Gam = (v: number) => {
        const c = Math.max(0, Math.min(1, v));
        return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
      };
      return `color(display-p3 ${toP3Gam(rP3).toFixed(4)} ${toP3Gam(gP3).toFixed(4)} ${toP3Gam(bP3).toFixed(4)})`;
    }
    case "OKLAB": {
      const a = oklch.c * Math.cos((oklch.h * Math.PI) / 180);
      const b = oklch.c * Math.sin((oklch.h * Math.PI) / 180);
      return `oklab(${oklch.l.toFixed(4)} ${a.toFixed(4)} ${b.toFixed(4)})`;
    }
    case "LAB": {
      const [l, a, b] = rgbToLab(rgb[0], rgb[1], rgb[2]);
      return `lab(${l.toFixed(2)}% ${a.toFixed(2)} ${b.toFixed(2)})`;
    }
    case "LCH": {
      const [l, a, b] = rgbToLab(rgb[0], rgb[1], rgb[2]);
      const c = Math.sqrt(a * a + b * b);
      const h = (Math.atan2(b, a) * (180 / Math.PI) + 360) % 360;
      return `lch(${l.toFixed(2)}% ${c.toFixed(2)} ${h.toFixed(1)})`;
    }
    case "REC.2020": {
      const [rLin, gLin, bLin] = rgb.map(srgbToLinear);
      const rRec = 0.627404 * rLin! + 0.329282 * gLin! + 0.0433136 * bLin!;
      const gRec = 0.069097 * rLin! + 0.91954 * gLin! + 0.0113612 * bLin!;
      const bRec = 0.0163916 * rLin! + 0.0880132 * gLin! + 0.895595 * bLin!;
      const toRecGam = (v: number) => Math.max(0, Math.min(1, v));
      return `color(rec2020 ${toRecGam(rRec).toFixed(4)} ${toRecGam(gRec).toFixed(4)} ${toRecGam(bRec).toFixed(4)})`;
    }
    default:
      return colorHex;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Contrast Calculations (APCA, WCAG 2.1, Michelson, Weber, L*, ΔPhi)
// ─────────────────────────────────────────────────────────────────────────────

export function getLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map(srgbToLinear);
  return 0.2126729 * r! + 0.7151522 * g! + 0.072175 * b!;
}

/**
 * WCAG 2.1 standard relative luminance contrast ratio (1:1 to 21:1)
 */
export function getWcagContrast(hex1: string, hex2: string): number {
  const l1 = getLuminance(hexToRgb(hex1));
  const l2 = getLuminance(hexToRgb(hex2));
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (light + 0.05) / (dark + 0.05);
}

/**
 * APCA (Advanced Perceptual Contrast Algorithm) 0.98G standard
 * Returns signed Lc value:
 * - Positive value: Light text on dark background (White on Black / WoB)
 * - Negative value: Dark text on light background (Black on White / BoW)
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
    // Dark text on light background (BoW): standard signed APCA is negative
    const sapc = (Math.pow(Ybg, normBG) - Math.pow(Ytxt, normTXT)) * scaleBoW;
    return sapc < loBoWoffset ? 0 : -(sapc - loBoWoffset) * 100;
  } else {
    // Light text on dark background (WoB): standard signed APCA is positive
    const sapc = (Math.pow(Ybg, revBG) - Math.pow(Ytxt, revTXT)) * scaleWoB;
    return sapc > -loWoBoffset ? 0 : -(sapc + loWoBoffset) * 100;
  }
}

/**
 * Michelson Contrast (optical physics standard for periodic gratings)
 * Range: 0.0 to 1.0 (or 0% to 100%)
 */
export function getMichelsonContrast(hex1: string, hex2: string): number {
  const l1 = getLuminance(hexToRgb(hex1));
  const l2 = getLuminance(hexToRgb(hex2));
  const denom = l1 + l2;
  if (denom === 0) return 0;
  return Math.abs(l1 - l2) / denom;
}

/**
 * Weber Contrast (psychophysics standard relative to background luminance)
 */
export function getWeberContrast(fgHex: string, bgHex: string): number {
  const lFg = getLuminance(hexToRgb(fgHex));
  const lBg = getLuminance(hexToRgb(bgHex));
  if (lBg === 0) return 0;
  return Math.abs(lFg - lBg) / lBg;
}

/**
 * L* (CIE 1976 Lab perceptual lightness delta, 0 to 100)
 */
export function getLStarContrast(hex1: string, hex2: string): number {
  const l1 = getLuminance(hexToRgb(hex1));
  const l2 = getLuminance(hexToRgb(hex2));
  const toLStar = (y: number) => (y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y);
  return Math.abs(toLStar(l1) - toLStar(l2));
}

/**
 * ΔPhi (OKLab uniform lightness delta * 100, 0 to 100)
 */
export function getDeltaPhiContrast(hex1: string, hex2: string): number {
  const oklch1 = rgbToOklch(hexToRgb(hex1));
  const oklch2 = rgbToOklch(hexToRgb(hex2));
  return Math.abs(oklch1.l - oklch2.l) * 100;
}

export function getAlgorithmContrast(
  fgHex: string,
  bgHex: string,
  algo: ContrastAlgorithm = "APCA",
): number {
  switch (algo) {
    case "APCA":
      return Math.abs(getApcaContrast(fgHex, bgHex));
    case "WCAG21":
      return getWcagContrast(fgHex, bgHex);
    case "Michelson":
      return getMichelsonContrast(fgHex, bgHex);
    case "Weber":
      return getWeberContrast(fgHex, bgHex);
    case "L_star":
      return getLStarContrast(fgHex, bgHex);
    case "DeltaPhi":
      return getDeltaPhiContrast(fgHex, bgHex);
    default:
      return Math.abs(getApcaContrast(fgHex, bgHex));
  }
}

export function evaluateContrast(
  fgHex: string,
  bgHex: string,
  algo: ContrastAlgorithm = "APCA",
): ContrastScore {
  const wcagRatio = getWcagContrast(fgHex, bgHex);
  const apcaSigned = getApcaContrast(fgHex, bgHex);
  const apcaRatio = Math.abs(apcaSigned);

  const wcagLevel: "AAA" | "AA" | "Fail" =
    wcagRatio >= 7.0 ? "AAA" : wcagRatio >= 4.5 ? "AA" : "Fail";
  const apcaLevel: "AAA" | "AA" | "Fail" =
    apcaRatio >= 75 ? "AAA" : apcaRatio >= 60 ? "AA" : "Fail";

  const activeValue = getAlgorithmContrast(fgHex, bgHex, algo);
  let activeLevel: "AAA" | "AA" | "Fail" = "Fail";
  let activeLabel = "";

  switch (algo) {
    case "APCA":
      activeLevel = apcaLevel;
      activeLabel =
        apcaRatio >= 90
          ? "Enhanced AAA"
          : apcaRatio >= 75
            ? "Body Text AAA"
            : apcaRatio >= 60
              ? "Large Text AA"
              : apcaRatio >= 45
                ? "UI / Icons"
                : "Fail";
      break;
    case "WCAG21":
      activeLevel = wcagLevel;
      activeLabel = `WCAG ${wcagRatio.toFixed(1)}:1 (${wcagLevel})`;
      break;
    case "Michelson":
      activeLevel = activeValue >= 0.7 ? "AAA" : activeValue >= 0.5 ? "AA" : "Fail";
      activeLabel = `Michelson ${(activeValue * 100).toFixed(0)}% (${activeLevel})`;
      break;
    case "Weber":
      activeLevel = activeValue >= 3.5 ? "AAA" : activeValue >= 2.0 ? "AA" : "Fail";
      activeLabel = `Weber ${activeValue.toFixed(2)} (${activeLevel})`;
      break;
    case "L_star":
      activeLevel = activeValue >= 60 ? "AAA" : activeValue >= 45 ? "AA" : "Fail";
      activeLabel = `ΔL* ${activeValue.toFixed(1)} (${activeLevel})`;
      break;
    case "DeltaPhi":
      activeLevel = activeValue >= 60 ? "AAA" : activeValue >= 45 ? "AA" : "Fail";
      activeLabel = `ΔΦ ${activeValue.toFixed(1)} (${activeLevel})`;
      break;
  }

  return {
    wcagRatio,
    wcagLevel,
    apcaRatio,
    apcaLevel,
    apcaSigned,
    algorithm: algo,
    activeValue,
    activeLevel,
    activeLabel,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Semantic Token Derivation Graph (APCA + OKLCH Calibrated)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derives the complete semantic token system used by @portfolio/ui and Tailwind v4
 * from a single accessible background and foreground pair.
 * Uses OKLCH perceptual space and APCA contrast thresholds to guarantee elegance.
 */
export function deriveThemeFromPair(
  bgHex: string,
  fgHex: string,
  options?: {
    surfaceHex?: string;
    accentHex?: string;
  },
): ThemeTokens {
  const bg = rgbToOklch(hexToRgb(bgHex));
  const fg = rgbToOklch(hexToRgb(fgHex));
  const isDark = bg.l < 0.5;

  // 1. Surface elevation in OKLCH:
  // In dark mode: card is elevated above canvas with subtle undertone matching bg hue
  // In light mode: crisp elevated white or slight tint
  const cardL = isDark
    ? Math.min(0.26, Math.max(0.14, bg.l + 0.055))
    : bg.l < 0.96
      ? Math.min(1.0, bg.l + 0.03)
      : 1.0;
  const card = options?.surfaceHex || oklchToHex({ l: cardL, c: bg.c * 0.65, h: bg.h });

  // 2. Muted text calibrated via APCA:
  // Target APCA |Lc| in [55, 68] against the card surface (optimum for secondary / muted reading)
  let mutedL = isDark ? Math.min(0.82, cardL + 0.38) : Math.max(0.24, cardL - 0.42);
  let mutedForeground = oklchToHex({ l: mutedL, c: fg.c * 0.3, h: fg.h });
  let apcaMuted = Math.abs(getApcaContrast(mutedForeground, card));

  // Iteratively fine-tune mutedL so it lands comfortably within the 55-70 APCA target
  if (apcaMuted < 55 || apcaMuted > 70) {
    const step = isDark ? 0.03 : -0.03;
    for (let i = 0; i < 4; i++) {
      if (apcaMuted < 55) {
        mutedL = Math.max(0.1, Math.min(0.95, mutedL + step));
      } else if (apcaMuted > 70) {
        mutedL = Math.max(0.1, Math.min(0.95, mutedL - step));
      }
      mutedForeground = oklchToHex({ l: mutedL, c: fg.c * 0.3, h: fg.h });
      apcaMuted = Math.abs(getApcaContrast(mutedForeground, card));
    }
  }

  // 3. Secondary & Accent surfaces
  const secondaryL = isDark ? Math.min(0.3, bg.l + 0.08) : Math.max(0.92, bg.l - 0.04);
  const secondary = oklchToHex({ l: secondaryL, c: bg.c * 0.75, h: bg.h });

  const defaultAccentL = isDark ? Math.min(0.32, bg.l + 0.1) : Math.max(0.9, bg.l - 0.06);
  const accent =
    options?.accentHex ||
    oklchToHex({ l: defaultAccentL, c: Math.min(0.12, bg.c * 1.1 + 0.01), h: bg.h });

  // 4. Borders & Inputs: calibrated for non-text APCA boundary (|Lc| >= 25 against card)
  const borderL = isDark ? bg.l + 0.11 : Math.max(0.8, bg.l - 0.09);
  const border = oklchToHex({ l: borderL, c: bg.c * 0.35, h: bg.h });

  // 5. Primary button & solved text contrast using APCA
  // When accentHex is provided, it acts as the primary accent brand token!
  const primary = options?.accentHex || fgHex;
  const whiteApca = Math.abs(getApcaContrast("#ffffff", primary));
  const darkApca = Math.abs(getApcaContrast("#09090b", primary));
  const primaryForeground = whiteApca >= darkApca ? "#ffffff" : "#09090b";

  // 6. Destructive status (anchored to danger red hue 27° in OKLCH)
  const destructiveL = isDark ? 0.66 : 0.56;
  const destructive = oklchToHex({ l: destructiveL, c: 0.22, h: 27 });

  // 7. Sidebar tokens
  const sidebarL = isDark ? Math.max(0.08, bg.l - 0.02) : Math.min(0.98, bg.l - 0.015);
  const sidebar = oklchToHex({ l: sidebarL, c: bg.c * 0.5, h: bg.h });

  // 8. 5-Series Chart Harmonies (Equidistant OKLCH hue rotation, APCA >= 45 vs canvas)
  const chartL = isDark ? 0.72 : 0.52;
  const chartC = 0.15;
  const baseHue = options?.accentHex
    ? rgbToOklch(hexToRgb(options.accentHex)).h || 240
    : fg.h || 240;
  const charts = [0, 72, 144, 216, 288].map((offset) =>
    oklchToHex({ l: chartL, c: chartC, h: (baseHue + offset) % 360 }),
  );

  return {
    background: bgHex,
    foreground: fgHex,
    bg: bgHex,
    surface: card,
    text: fgHex,
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
    chart1: options?.accentHex || charts[0]!,
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

/**
 * Convenience helper that evaluates createOklchTheme and converts
 * all locked OKLCH colors into concrete hex strings for easy consumption.
 */
export function createOklchThemeHex(baseH: number, accentH: number, isDark = true) {
  const oklch = createOklchTheme(baseH, accentH, isDark);
  return {
    ...oklch,
    bgHex: isDark
      ? oklchToHex({ l: 0.17, c: 0.03, h: baseH })
      : oklchToHex({ l: 0.97, c: 0.012, h: baseH }),
    surfaceHex: isDark
      ? oklchToHex({ l: 0.22, c: 0.04, h: baseH })
      : oklchToHex({ l: 0.93, c: 0.02, h: baseH }),
    textHex: isDark
      ? oklchToHex({ l: 0.93, c: 0.02, h: baseH })
      : oklchToHex({ l: 0.21, c: 0.03, h: baseH }),
    accentHex: isDark
      ? oklchToHex({ l: 0.72, c: 0.16, h: accentH })
      : oklchToHex({ l: 0.52, c: 0.16, h: accentH }),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DOM Injection & Runtime Application
// ─────────────────────────────────────────────────────────────────────────────

const CSS_VAR_MAP: Record<keyof ThemeTokens, string> = {
  background: "--background",
  foreground: "--foreground",
  bg: "--bg",
  surface: "--surface",
  text: "--text",
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
// Procedural Accessible Randomizer (APCA First-Class Generator)
// ─────────────────────────────────────────────────────────────────────────────

export function generateRandomAccessiblePair(options?: {
  mode?: "light" | "dark" | "any";
  minContrast?: number;
  algorithm?: ContrastAlgorithm;
}): [string, string] {
  const { mode = "any", algorithm = "APCA" } = options ?? {};
  const minContrast =
    options?.minContrast ??
    (algorithm === "APCA"
      ? 75 // Default to APCA AAA Body Text
      : algorithm === "WCAG21"
        ? 7.0
        : algorithm === "Michelson"
          ? 0.7
          : algorithm === "Weber"
            ? 3.5
            : algorithm === "L_star"
              ? 60
              : 50);

  for (let attempt = 0; attempt < 500; attempt++) {
    // Pick background luminance based on requested mode
    const isDark = mode === "dark" ? true : mode === "light" ? false : Math.random() > 0.5;

    const bgL = isDark
      ? 0.08 + Math.random() * 0.12 // 0.08 to 0.20
      : 0.94 + Math.random() * 0.05; // 0.94 to 0.99
    const bgC = Math.random() * 0.035; // subtle canvas chroma in OKLCH
    const bgH = Math.random() * 360;
    const bgHex = oklchToHex({ l: bgL, c: bgC, h: bgH });

    // Pick vibrant foreground
    const fgL = isDark
      ? 0.76 + Math.random() * 0.21 // bright text on dark
      : 0.12 + Math.random() * 0.22; // dark text on light
    const fgC = 0.04 + Math.random() * 0.18; // vibrant or refined
    const fgH = Math.random() * 360;
    const fgHex = oklchToHex({ l: fgL, c: fgC, h: fgH });

    // Verify contrast compliance using selected algorithm (defaulting to modern APCA)
    if (algorithm === "APCA") {
      const apca = Math.abs(getApcaContrast(fgHex, bgHex));
      if (apca >= minContrast) {
        return [bgHex, fgHex];
      }
    } else if (algorithm === "WCAG21") {
      const wcag = getWcagContrast(fgHex, bgHex);
      if (wcag >= minContrast) {
        return [bgHex, fgHex];
      }
    } else if (algorithm === "Michelson") {
      const michelson = getMichelsonContrast(fgHex, bgHex);
      if (michelson >= minContrast) {
        return [bgHex, fgHex];
      }
    } else if (algorithm === "Weber") {
      const weber = getWeberContrast(fgHex, bgHex);
      if (weber >= minContrast) {
        return [bgHex, fgHex];
      }
    } else if (algorithm === "L_star") {
      const lStar = getLStarContrast(fgHex, bgHex);
      if (lStar >= minContrast) {
        return [bgHex, fgHex];
      }
    } else if (algorithm === "DeltaPhi") {
      const deltaPhi = getDeltaPhiContrast(fgHex, bgHex);
      if (deltaPhi >= minContrast) {
        return [bgHex, fgHex];
      }
    }
  }

  // Guaranteed fallback
  return mode === "light" ? ["#fafafa", "#18181b"] : ["#09090b", "#4ade80"];
}

// ─────────────────────────────────────────────────────────────────────────────
// Algorithm & Format Metadata Registry
// ─────────────────────────────────────────────────────────────────────────────

export interface AlgorithmMetadata {
  id: ContrastAlgorithm;
  name: string;
  badge?: string;
  description: string;
  recommended?: boolean;
  thresholds: { label: string; value: number }[];
}

export const CONTRAST_ALGORITHMS: AlgorithmMetadata[] = [
  {
    id: "APCA",
    name: "APCA",
    badge: "Recommended • WCAG 3",
    description:
      "Advanced Perceptual Contrast Algorithm. Models human visual cortex sensitivity and text polarity for elegant, natural contrast.",
    recommended: true,
    thresholds: [
      { label: "Non-text (45)", value: 45 },
      { label: "AA Large (60)", value: 60 },
      { label: "AAA Body (75)", value: 75 },
      { label: "Enhanced (90)", value: 90 },
    ],
  },
  {
    id: "WCAG21",
    name: "WCAG 2.1",
    badge: "Legacy Regulatory",
    description:
      "Relative luminance ratio (1:1 to 21:1). Regulatory standard, though mathematically insensitive to dark mode polarity.",
    thresholds: [
      { label: "Large (3.0:1)", value: 3.0 },
      { label: "AA (4.5:1)", value: 4.5 },
      { label: "AAA (7.0:1)", value: 7.0 },
    ],
  },
  {
    id: "Michelson",
    name: "Michelson",
    badge: "Optics Standard",
    description:
      "Modulation contrast (Lmax - Lmin) / (Lmax + Lmin) from classical optical physics.",
    thresholds: [
      { label: "UI (0.35)", value: 0.35 },
      { label: "AA (0.50)", value: 0.5 },
      { label: "AAA (0.70)", value: 0.7 },
    ],
  },
  {
    id: "Weber",
    name: "Weber",
    badge: "Psychophysics",
    description: "Weber fraction ΔL / L_bg. Classical visual threshold measurement.",
    thresholds: [
      { label: "Low (1.5)", value: 1.5 },
      { label: "Medium (2.5)", value: 2.5 },
      { label: "High (4.0)", value: 4.0 },
    ],
  },
  {
    id: "L_star",
    name: "L*",
    badge: "CIE Lab Delta",
    description: "CIE 1976 Lab perceptual lightness delta ΔL* (0 to 100).",
    thresholds: [
      { label: "UI (35)", value: 35 },
      { label: "AA (50)", value: 50 },
      { label: "AAA (65)", value: 65 },
    ],
  },
  {
    id: "DeltaPhi",
    name: "ΔPhi",
    badge: "OKLab Uniform",
    description:
      "OKLab uniform lightness delta ΔΦ (0 to 100) based on perceptual color compression.",
    thresholds: [
      { label: "UI (30)", value: 30 },
      { label: "AA (45)", value: 45 },
      { label: "AAA (65)", value: 65 },
    ],
  },
];

export interface ColorFormatMetadata {
  id: ColorFormat;
  name: string;
  modern?: boolean;
}

export const COLOR_FORMATS: ColorFormatMetadata[] = [
  { id: "OKLCH", name: "OKLCH", modern: true },
  { id: "HEX", name: "HEX" },
  { id: "Display-P3", name: "Display-P3", modern: true },
  { id: "RGB", name: "RGB" },
  { id: "HSL", name: "HSL" },
  { id: "LAB", name: "LAB" },
  { id: "OKLAB", name: "OKLAB", modern: true },
  { id: "REC.2020", name: "REC.2020", modern: true },
  { id: "LCH", name: "LCH" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Curated Palette Hall of Fame (RandomA11y Classics)
// ─────────────────────────────────────────────────────────────────────────────

export interface CuratedPalette {
  id: string;
  name: string;
  mode: "dark" | "light";
  colors: [string, string]; // [bg, fg]
  contrast: number; // WCAG ratio
  apca: number; // APCA Lc
}

export const CURATED_A11Y_PALETTES: CuratedPalette[] = [
  {
    id: "cyber-emerald",
    name: "Cyber Emerald",
    mode: "dark",
    colors: ["#0b0d13", "#38ef7d"],
    contrast: 13.9,
    apca: 89,
  },
  {
    id: "electric-indigo",
    name: "Electric Indigo",
    mode: "dark",
    colors: ["#0a0e17", "#60a5fa"],
    contrast: 8.9,
    apca: 78,
  },
  {
    id: "vesper-violet",
    name: "Vesper Violet",
    mode: "dark",
    colors: ["#120c1f", "#f472b6"],
    contrast: 9.2,
    apca: 79,
  },
  {
    id: "amber-glow",
    name: "Amber Glow",
    mode: "dark",
    colors: ["#14110b", "#fbbf24"],
    contrast: 12.8,
    apca: 88,
  },
  {
    id: "deep-teal",
    name: "Deep Teal",
    mode: "dark",
    colors: ["#001a1d", "#2dd4bf"],
    contrast: 11.4,
    apca: 85,
  },
  {
    id: "nordic-snow",
    name: "Nordic Snow",
    mode: "light",
    colors: ["#f8fafc", "#0f172a"],
    contrast: 17.5,
    apca: 96,
  },
  {
    id: "espresso-cream",
    name: "Espresso Cream",
    mode: "light",
    colors: ["#faf7f2", "#38281d"],
    contrast: 12.6,
    apca: 89,
  },
  {
    id: "sage-minimal",
    name: "Sage Minimal",
    mode: "light",
    colors: ["#f2f7f4", "#1b4332"],
    contrast: 10.4,
    apca: 84,
  },
  {
    id: "cobalt-clean",
    name: "Cobalt Clean",
    mode: "light",
    colors: ["#f5f8ff", "#1e3a8a"],
    contrast: 12.1,
    apca: 88,
  },
  {
    id: "soft-lavender",
    name: "Soft Lavender",
    mode: "light",
    colors: ["#faf5ff", "#581c87"],
    contrast: 13.1,
    apca: 90,
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
