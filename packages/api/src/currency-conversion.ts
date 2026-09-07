export type StoredExchangeRate = {
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
};

/**
 * Stored rates express the value of one quote-currency unit in the base currency.
 * For example, base=INR, quote=EUR, rate=109.82 means EUR 1 = INR 109.82.
 */
export function resolveConversionRate(
  amountCurrency: string,
  reportingCurrency: string,
  rates: StoredExchangeRate[],
) {
  const amount = amountCurrency.toUpperCase();
  const reporting = reportingCurrency.toUpperCase();
  if (amount === reporting) return 1;

  const direct = rates.find(
    (rate) =>
      rate.baseCurrency.toUpperCase() === reporting && rate.quoteCurrency.toUpperCase() === amount,
  );
  if (direct && Number.isFinite(direct.rate) && direct.rate > 0) return direct.rate;

  const inverse = rates.find(
    (rate) =>
      rate.baseCurrency.toUpperCase() === amount && rate.quoteCurrency.toUpperCase() === reporting,
  );
  return inverse && Number.isFinite(inverse.rate) && inverse.rate > 0 ? 1 / inverse.rate : null;
}

export function convertCurrency(
  value: number,
  amountCurrency: string,
  reportingCurrency: string,
  rates: StoredExchangeRate[],
) {
  const rate = resolveConversionRate(amountCurrency, reportingCurrency, rates);
  return rate === null ? null : value * rate;
}

export type DatedStoredExchangeRate = StoredExchangeRate & {
  asOf: Date;
  rateType?: string;
};

/** Resolve a historical rate using the latest official observation on or before the event date. */
export function resolveHistoricalConversionRate(
  amountCurrency: string,
  reportingCurrency: string,
  at: Date,
  rates: DatedStoredExchangeRate[],
  maximumAgeDays = 7,
) {
  if (amountCurrency.toUpperCase() === reportingCurrency.toUpperCase()) return 1;
  const cutoff = at.getTime();
  const eligible = rates
    .filter(
      (rate) =>
        rate.asOf.getTime() <= cutoff &&
        rate.rateType !== "indicative" &&
        ((rate.baseCurrency.toUpperCase() === reportingCurrency.toUpperCase() &&
          rate.quoteCurrency.toUpperCase() === amountCurrency.toUpperCase()) ||
          (rate.baseCurrency.toUpperCase() === amountCurrency.toUpperCase() &&
            rate.quoteCurrency.toUpperCase() === reportingCurrency.toUpperCase())),
    )
    .sort((left, right) => right.asOf.getTime() - left.asOf.getTime());
  const selected = eligible[0];
  if (!selected || cutoff - selected.asOf.getTime() > maximumAgeDays * 86_400_000) return null;
  return resolveConversionRate(amountCurrency, reportingCurrency, [selected]);
}
