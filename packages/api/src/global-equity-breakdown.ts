export type GlobalEquityBreakdownHolding = {
  costBasis?: number;
  marketValue?: number;
  unrealizedPnl?: number;
};

export type GlobalEquityAsset = {
  key: string;
  name: string;
  category: string;
  nativeValue: number;
  currency: string;
  baseValue: number | null;
  isLiquid: boolean;
  risk: string;
  location: string;
  asOf: Date | string | null;
};

export function buildGlobalEquityAssets(
  holdings: GlobalEquityBreakdownHolding[],
  convert: (value: number, currency: string) => number | null,
  asOf: Date | string | null,
): GlobalEquityAsset[] {
  const investedValue = holdings.reduce((sum, item) => {
    const costBasis = Number(item.costBasis ?? item.marketValue ?? 0);
    return sum + Math.max(costBasis, 0);
  }, 0);

  const unrealizedPnl = holdings.reduce((sum, item) => sum + Number(item.unrealizedPnl ?? 0), 0);

  return [
    {
      key: "degiro-equity-invested",
      name: "Global equity",
      category: "Global equity - Invested",
      nativeValue: investedValue,
      currency: "EUR",
      baseValue: convert(investedValue, "EUR") ?? 0,
      isLiquid: true,
      risk: "High",
      location: "Degiro",
      asOf,
    },
    {
      key: "degiro-equity-profit",
      name: "Global equity",
      category: "Global equity - Profit",
      nativeValue: unrealizedPnl,
      currency: "EUR",
      baseValue: convert(unrealizedPnl, "EUR") ?? 0,
      isLiquid: true,
      risk: "High",
      location: "Degiro",
      asOf,
    },
  ];
}
