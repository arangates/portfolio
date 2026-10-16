/**
 * Unified Chart Color & Theming System
 * Centralized color configurations, semantic palettes, and theme-adaptive series
 * for all charts in @portfolio/ui and apps/web.
 */

import { oklchToHex, rgbToOklch, hexToRgb } from "./theme-engine";

export type ChartColorMode = "financial" | "theme" | "monochrome";

export interface ChartSwatch {
  light: string[];
  dark: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Semantic Chart Swatches (Curated High-Contrast Financial Palettes)
// ─────────────────────────────────────────────────────────────────────────────

export const chartColors = {
  // Primary (Market value, current balances, core series)
  primary: {
    light: ["#2563eb", "#7c3aed"],
    dark: ["#60a5fa", "#a78bfa"],
  },
  // Success (Invested value, growth, returns, net pay, positive flows)
  success: {
    light: ["#059669", "#10b981"],
    dark: ["#34d399", "#6ee7b7"],
  },
  // Warning (Targets, deterministic models, pension, scheduled forecasts)
  warning: {
    light: ["#d97706", "#ca8a04"],
    dark: ["#fbbf24", "#facc15"],
  },
  // Danger (Taxes, living expenses, conservative P10, risk)
  danger: {
    light: ["#dc2626", "#fb7185"],
    dark: ["#f87171", "#fda4af"],
  },
  // Purple / Violet (Bonus, supplemental income, long-term assets)
  purple: {
    light: ["#7c3aed", "#a78bfa"],
    dark: ["#a78bfa", "#c4b5fd"],
  },
  // Cyan / Sky (Liquid funds, global equity, scheduled proceeds)
  cyan: {
    light: ["#0891b2", "#0284c7"],
    dark: ["#22d3ee", "#38bdf8"],
  },
  // Orange (Domestic / Indian equity profit, alternative investments)
  orange: {
    light: ["#ea580c", "#f97316"],
    dark: ["#f97316", "#fdba74"],
  },
  // Teal (Operating cash flow, bank liquidity, deposits)
  teal: {
    light: ["#0f766e", "#14b8a6"],
    dark: ["#14b8a6", "#5eead4"],
  },
  // Rose (One-time expenses, gap / deficit, special deductions)
  rose: {
    light: ["#be123c", "#fb7185"],
    dark: ["#f43f5e", "#fda4af"],
  },
  // Neutral / Muted (Residuals, unallocated, benchmark baseline)
  neutral: {
    light: ["#71717a", "#a1a1aa"],
    dark: ["#a1a1aa", "#d4d4d8"],
  },
} as const satisfies Record<string, ChartSwatch>;

// ─────────────────────────────────────────────────────────────────────────────
// 2. Theme-Bound Chart Swatches (Synchronized with CSS Custom Properties)
// ─────────────────────────────────────────────────────────────────────────────

export const themeChartColors = {
  chart1: {
    light: ["var(--chart-1)"],
    dark: ["var(--chart-1)"],
  },
  chart2: {
    light: ["var(--chart-2)"],
    dark: ["var(--chart-2)"],
  },
  chart3: {
    light: ["var(--chart-3)"],
    dark: ["var(--chart-3)"],
  },
  chart4: {
    light: ["var(--chart-4)"],
    dark: ["var(--chart-4)"],
  },
  chart5: {
    light: ["var(--chart-5)"],
    dark: ["var(--chart-5)"],
  },
  primary: {
    light: ["var(--primary)"],
    dark: ["var(--primary)"],
  },
  secondary: {
    light: ["var(--secondary)"],
    dark: ["var(--secondary)"],
  },
  accent: {
    light: ["var(--accent)"],
    dark: ["var(--accent)"],
  },
  destructive: {
    light: ["var(--destructive)"],
    dark: ["var(--destructive)"],
  },
} as const satisfies Record<string, ChartSwatch>;

// ─────────────────────────────────────────────────────────────────────────────
// 3. Unified Categorical Palettes (Multi-slice Pies, Allocations, Flows)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * High-contrast 10-step categorical palette for asset allocations, wealth mix,
 * and portfolio categories.
 */
export const UNIFIED_CATEGORICAL_PALETTE: ChartSwatch[] = [
  chartColors.primary, // 0: Blue / Indigo
  chartColors.purple, // 1: Violet
  chartColors.success, // 2: Emerald
  chartColors.warning, // 3: Amber
  chartColors.danger, // 4: Red
  chartColors.cyan, // 5: Cyan
  chartColors.rose, // 6: Pink / Rose
  { light: ["#65a30d", "#a3e635"], dark: ["#a3e635", "#d9f99d"] }, // 7: Lime
  { light: ["#4f46e5", "#818cf8"], dark: ["#818cf8", "#c7d2fe"] }, // 8: Indigo
  chartColors.orange, // 9: Orange
];

/**
 * Theme-bound palette that pulls directly from the active theme's `--chart-n` vars
 */
export const THEME_BOUND_CATEGORICAL_PALETTE: ChartSwatch[] = [
  themeChartColors.chart1,
  themeChartColors.chart2,
  themeChartColors.chart3,
  themeChartColors.chart4,
  themeChartColors.chart5,
  themeChartColors.primary,
  themeChartColors.accent,
];

/**
 * Monochrome palette for understated, editorial visual designs
 */
export const MONOCHROME_CATEGORICAL_PALETTE: ChartSwatch[] = [
  { light: ["#18181b"], dark: ["#f4f4f5"] },
  { light: ["#3f3f46"], dark: ["#d4d4d8"] },
  { light: ["#71717a"], dark: ["#a1a1aa"] },
  { light: ["#a1a1aa"], dark: ["#71717a"] },
  { light: ["#d4d4d8"], dark: ["#3f3f46"] },
];

/**
 * Returns a swatch for any category index under the chosen mode
 */
export function getCategoryPalette(index: number, mode: ChartColorMode = "financial"): ChartSwatch {
  switch (mode) {
    case "theme":
      return THEME_BOUND_CATEGORICAL_PALETTE[index % THEME_BOUND_CATEGORICAL_PALETTE.length]!;
    case "monochrome":
      return MONOCHROME_CATEGORICAL_PALETTE[index % MONOCHROME_CATEGORICAL_PALETTE.length]!;
    case "financial":
    default:
      return UNIFIED_CATEGORICAL_PALETTE[index % UNIFIED_CATEGORICAL_PALETTE.length]!;
  }
}

/**
 * Generates an array of swatches for a given count
 */
export function getCategoryPaletteArray(
  count: number,
  mode: ChartColorMode = "financial",
): ChartSwatch[] {
  return Array.from({ length: count }, (_, i) => getCategoryPalette(i, mode));
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Procedural Theme-Harmonized Chart Generator (OKLCH + APCA)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Procedurally generates an N-series chart palette derived directly from an active
 * background and foreground color pair using OKLCH cylindrical space and APCA contrast.
 */
export function generateThemeHarmonizedChartPalette(
  bgHex: string,
  fgHex: string,
  seriesCount = 6,
): ChartSwatch[] {
  const bg = rgbToOklch(hexToRgb(bgHex));
  const fg = rgbToOklch(hexToRgb(fgHex));

  const baseHue = fg.h || 240;
  const hueStep = 360 / seriesCount;

  return Array.from({ length: seriesCount }, (_, i) => {
    const hue = (baseHue + i * hueStep) % 360;

    // Dark mode: elevated bright tones calibrated against canvas
    const darkBaseL = Math.max(0.68, Math.min(0.85, fg.l > bg.l ? fg.l : 0.78));
    const darkColor1 = oklchToHex({ l: darkBaseL, c: 0.16, h: hue });
    const darkColor2 = oklchToHex({ l: Math.min(0.92, darkBaseL + 0.1), c: 0.12, h: hue });

    // Light mode: rich saturated tones calibrated against canvas
    const lightBaseL = Math.max(0.38, Math.min(0.55, fg.l < bg.l ? fg.l : 0.45));
    const lightColor1 = oklchToHex({ l: lightBaseL, c: 0.18, h: hue });
    const lightColor2 = oklchToHex({ l: Math.min(0.72, lightBaseL + 0.15), c: 0.14, h: hue });

    return {
      light: [lightColor1, lightColor2],
      dark: [darkColor1, darkColor2],
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Pre-Configured Domain Chart Specifications
// ─────────────────────────────────────────────────────────────────────────────

export const UNIFIED_CHART_CONFIGS = {
  // Portfolio History (Net Worth, Invested, Market Value)
  portfolioHistory: {
    marketValue: {
      label: "Market value",
      colors: chartColors.primary,
    },
    investedValue: {
      label: "Invested value",
      colors: chartColors.success,
    },
  },

  // Salary & Compensation Charts
  salaryEarnings: {
    baseSalary: {
      label: "Base salary",
      colors: { light: ["#2563eb"], dark: ["#60a5fa"] },
    },
    supplementalGross: {
      label: "Bonus & special",
      colors: chartColors.purple,
    },
    netPay: {
      label: "Net pay",
      colors: chartColors.success,
    },
  },
  salaryDeductions: {
    wageTax: {
      label: "Wage tax",
      colors: chartColors.danger,
    },
    pensionContribution: {
      label: "Pension",
      colors: chartColors.warning,
    },
    socialInsurance: {
      label: "Insurance",
      colors: chartColors.purple,
    },
  },

  // FIRE Projections & Cash Flow
  fireProjection: {
    p10: {
      label: "Conservative (P10)",
      colors: { light: ["#dc2626"], dark: ["#f87171"] },
    },
    median: {
      label: "Median outcome",
      colors: chartColors.primary,
    },
    p90: {
      label: "Optimistic (P90)",
      colors: { light: ["#059669"], dark: ["#34d399"] },
    },
    deterministic: {
      label: "Expected path",
      colors: chartColors.warning,
    },
  },
  fireCashFlow: {
    expenses: {
      label: "Living expenses",
      colors: chartColors.primary,
    },
    oneTimeCosts: {
      label: "One-time costs",
      colors: chartColors.danger,
    },
    income: {
      label: "Income stream",
      colors: chartColors.success,
    },
  },

  // Capital Deployment Policies & Maturity
  capitalDeployment: {
    current: {
      label: "Current",
      colors: chartColors.primary,
    },
    target: {
      label: "Policy target",
      colors: { light: ["#059669"], dark: ["#34d399"] },
    },
    purchases: {
      label: "Purchases",
      colors: chartColors.primary,
    },
    redemptions: {
      label: "Redemptions",
      colors: { light: ["#059669"], dark: ["#34d399"] },
    },
    netPurchases: {
      label: "Net purchases",
      colors: chartColors.warning,
    },
    maturity: {
      label: "Scheduled proceeds",
      colors: chartColors.purple,
    },
  },

  // Equity Profit & Growth Tracking
  equityProfit: {
    totalProfit: {
      label: "Total equity profit",
      colors: chartColors.success,
    },
    indianProfit: {
      label: "Indian equity profit",
      colors: chartColors.orange,
    },
    globalProfit: {
      label: "Global equity profit",
      colors: chartColors.cyan,
    },
  },

  // Financial Twin (Income, Expenses, Retained, Gap)
  financialTwin: {
    income: {
      label: "Income",
      colors: chartColors.teal,
    },
    expense: {
      label: "Expenses",
      colors: chartColors.danger,
    },
    surplus: {
      label: "Surplus",
      colors: chartColors.primary,
    },
    retained: {
      label: "Retained",
      colors: chartColors.warning,
    },
    gap: {
      label: "Funding gap",
      colors: chartColors.rose,
    },
    capacity: {
      label: "Monthly capacity",
      colors: chartColors.primary,
    },
  },

  // Wealth Mix & Liquidity
  wealthMix: {
    liquid: {
      label: "Liquid assets",
      colors: chartColors.success,
    },
    longTerm: {
      label: "Long-term assets",
      colors: chartColors.primary,
    },
  },

  // Mortgage & Real Estate
  mortgage: {
    principal: {
      label: "Principal paid",
      colors: chartColors.success,
    },
    interest: {
      label: "Interest paid",
      colors: chartColors.warning,
    },
    balance: {
      label: "Remaining loan balance",
      colors: chartColors.primary,
    },
    overpayment: {
      label: "Extra repayments",
      colors: chartColors.cyan,
    },
  },

  // Bank & Cash Flow
  bankAccounts: {
    inflow: {
      label: "Inflow / Income",
      colors: chartColors.success,
    },
    outflow: {
      label: "Outflow / Spend",
      colors: chartColors.danger,
    },
    balance: {
      label: "Net Balance",
      colors: chartColors.primary,
    },
  },
};
