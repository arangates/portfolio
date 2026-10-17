import { convertCurrency, type StoredExchangeRate } from "./currency-conversion";

export type EquityHistoryInput = {
  date: string;
  investedValue: number;
  marketValue: number;
  unrealizedPnl?: number;
};

export type EquityProfitPoint = {
  month: string; // "YYYY-MM"
  date: string; // "YYYY-MM-DD"
  label: string; // e.g. "Mar 24"

  // Indian Equity
  indianProfitInr: number;
  indianProfitBase: number;
  indianInvestedInr: number;
  indianReturnPercent: number;
  hasIndianData: boolean;

  // Global Equity
  globalProfitEur: number;
  globalProfitBase: number;
  globalInvestedEur: number;
  globalReturnPercent: number;
  hasGlobalData: boolean;

  // Combined
  totalProfitBase: number;
  totalInvestedBase: number;
  totalReturnPercent: number;
};

export type EquityProfitSummary = {
  latestTotalProfitBase: number;
  latestTotalReturnPercent: number;
  latestIndianProfitInr: number;
  latestIndianProfitBase: number;
  latestIndianReturnPercent: number;
  latestGlobalProfitEur: number;
  latestGlobalProfitBase: number;
  latestGlobalReturnPercent: number;
  peakTotalProfitBase: number;
  hasIndianData: boolean;
  hasGlobalData: boolean;
  hasData: boolean;
};

export function formatMonthLabel(monthStr: string): string {
  try {
    const [year, month] = monthStr.split("-").map(Number);
    if (!year || !month) return monthStr;
    const date = new Date(Date.UTC(year, month - 1, 15));
    return new Intl.DateTimeFormat("en", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    }).format(date);
  } catch {
    return monthStr;
  }
}

export function generateMonthRange(startMonth: string, endMonth: string): string[] {
  const [startYear, startM] = startMonth.split("-").map(Number);
  const [endYear, endM] = endMonth.split("-").map(Number);
  if (!startYear || !startM || !endYear || !endM) return [];

  const months: string[] = [];
  let y = startYear;
  let m = startM;
  while (y < endYear || (y === endYear && m <= endM)) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return months;
}

export function calculateEquityProfitGrowth({
  indianHistory = [],
  globalHistory = [],
  rates = [],
  baseCurrency = "EUR",
}: {
  indianHistory?: EquityHistoryInput[];
  globalHistory?: EquityHistoryInput[];
  rates?: StoredExchangeRate[];
  baseCurrency?: string;
}): {
  timeline: EquityProfitPoint[];
  summary: EquityProfitSummary;
} {
  const indianByMonth = new Map<
    string,
    { date: string; investedValue: number; marketValue: number; unrealizedPnl: number }
  >();
  for (const item of indianHistory) {
    if (!item.date) continue;
    const month = item.date.slice(0, 7);
    const existing = indianByMonth.get(month);
    if (!existing || item.date >= existing.date) {
      const investedValue = Number(item.investedValue || 0);
      const marketValue = Number(item.marketValue || 0);
      const unrealizedPnl = Number(item.unrealizedPnl ?? marketValue - investedValue);
      indianByMonth.set(month, {
        date: item.date,
        investedValue,
        marketValue,
        unrealizedPnl,
      });
    }
  }

  const globalByMonth = new Map<
    string,
    { date: string; investedValue: number; marketValue: number; unrealizedPnl: number }
  >();
  for (const item of globalHistory) {
    if (!item.date) continue;
    const month = item.date.slice(0, 7);
    const existing = globalByMonth.get(month);
    if (!existing || item.date >= existing.date) {
      const investedValue = Number(item.investedValue || 0);
      const marketValue = Number(item.marketValue || 0);
      const unrealizedPnl = Number(item.unrealizedPnl ?? marketValue - investedValue);
      globalByMonth.set(month, {
        date: item.date,
        investedValue,
        marketValue,
        unrealizedPnl,
      });
    }
  }

  const allMonthsSet = new Set<string>([...indianByMonth.keys(), ...globalByMonth.keys()]);

  const allMonthsSorted = [...allMonthsSet].sort();
  if (allMonthsSorted.length === 0) {
    return {
      timeline: [],
      summary: {
        latestTotalProfitBase: 0,
        latestTotalReturnPercent: 0,
        latestIndianProfitInr: 0,
        latestIndianProfitBase: 0,
        latestIndianReturnPercent: 0,
        latestGlobalProfitEur: 0,
        latestGlobalProfitBase: 0,
        latestGlobalReturnPercent: 0,
        peakTotalProfitBase: 0,
        hasIndianData: false,
        hasGlobalData: false,
        hasData: false,
      },
    };
  }

  const startMonth = allMonthsSorted[0]!;
  const endMonth = allMonthsSorted.at(-1)!;
  const monthSequence = generateMonthRange(startMonth, endMonth);

  let currentIndian: {
    date: string;
    investedValue: number;
    marketValue: number;
    unrealizedPnl: number;
  } | null = null;
  let currentGlobal: {
    date: string;
    investedValue: number;
    marketValue: number;
    unrealizedPnl: number;
  } | null = null;

  const timeline: EquityProfitPoint[] = [];

  for (const month of monthSequence) {
    if (indianByMonth.has(month)) {
      currentIndian = indianByMonth.get(month)!;
    }
    if (globalByMonth.has(month)) {
      currentGlobal = globalByMonth.get(month)!;
    }

    const hasIndianData = currentIndian !== null;
    const indianProfitInr = currentIndian ? currentIndian.unrealizedPnl : 0;
    const indianInvestedInr = currentIndian ? currentIndian.investedValue : 0;
    const indianReturnPercent =
      indianInvestedInr > 0 ? (indianProfitInr / indianInvestedInr) * 100 : 0;
    const indianProfitBase = hasIndianData
      ? (convertCurrency(indianProfitInr, "INR", baseCurrency, rates) ?? indianProfitInr)
      : 0;
    const indianInvestedBase = hasIndianData
      ? (convertCurrency(indianInvestedInr, "INR", baseCurrency, rates) ?? indianInvestedInr)
      : 0;

    const hasGlobalData = currentGlobal !== null;
    const globalProfitEur = currentGlobal ? currentGlobal.unrealizedPnl : 0;
    const globalInvestedEur = currentGlobal ? currentGlobal.investedValue : 0;
    const globalReturnPercent =
      globalInvestedEur > 0 ? (globalProfitEur / globalInvestedEur) * 100 : 0;
    const globalProfitBase = hasGlobalData
      ? (convertCurrency(globalProfitEur, "EUR", baseCurrency, rates) ?? globalProfitEur)
      : 0;
    const globalInvestedBase = hasGlobalData
      ? (convertCurrency(globalInvestedEur, "EUR", baseCurrency, rates) ?? globalInvestedEur)
      : 0;

    const totalProfitBase = indianProfitBase + globalProfitBase;
    const totalInvestedBase = indianInvestedBase + globalInvestedBase;
    const totalReturnPercent =
      totalInvestedBase > 0 ? (totalProfitBase / totalInvestedBase) * 100 : 0;

    timeline.push({
      month,
      date:
        currentIndian?.date && currentIndian.date.startsWith(month)
          ? currentIndian.date
          : currentGlobal?.date && currentGlobal.date.startsWith(month)
            ? currentGlobal.date
            : `${month}-01`,
      label: formatMonthLabel(month),
      indianProfitInr,
      indianProfitBase,
      indianInvestedInr,
      indianReturnPercent,
      hasIndianData,
      globalProfitEur,
      globalProfitBase,
      globalInvestedEur,
      globalReturnPercent,
      hasGlobalData,
      totalProfitBase,
      totalInvestedBase,
      totalReturnPercent,
    });
  }

  const latest = timeline.at(-1);
  const peakTotalProfitBase =
    timeline.length > 0 ? Math.max(...timeline.map((point) => point.totalProfitBase)) : 0;

  const hasIndianData = indianByMonth.size > 0;
  const hasGlobalData = globalByMonth.size > 0;

  return {
    timeline,
    summary: {
      latestTotalProfitBase: latest?.totalProfitBase ?? 0,
      latestTotalReturnPercent: latest?.totalReturnPercent ?? 0,
      latestIndianProfitInr: currentIndian?.unrealizedPnl ?? 0,
      latestIndianProfitBase: latest?.indianProfitBase ?? 0,
      latestIndianReturnPercent: latest?.indianReturnPercent ?? 0,
      latestGlobalProfitEur: currentGlobal?.unrealizedPnl ?? 0,
      latestGlobalProfitBase: latest?.globalProfitBase ?? 0,
      latestGlobalReturnPercent: latest?.globalReturnPercent ?? 0,
      peakTotalProfitBase,
      hasIndianData,
      hasGlobalData,
      hasData: hasIndianData || hasGlobalData,
    },
  };
}
