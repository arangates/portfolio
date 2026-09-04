export type NavPoint = { date: string; nav: number };

const DAY_MS = 86_400_000;
const YEAR_DAYS = 365.2425;

export const PERFORMANCE_HORIZONS = [
  { key: "1m", label: "1M", months: 1 },
  { key: "3m", label: "3M", months: 3 },
  { key: "6m", label: "6M", months: 6 },
  { key: "1y", label: "1Y", years: 1 },
  { key: "3y", label: "3Y", years: 3 },
  { key: "5y", label: "5Y", years: 5 },
] as const;

function utcDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function normalizeNavSeries(points: NavPoint[]) {
  const byDate = new Map<string, number>();
  for (const point of points) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(point.date) && Number.isFinite(point.nav) && point.nav > 0) {
      byDate.set(point.date, point.nav);
    }
  }
  return [...byDate.entries()]
    .map(([date, nav]) => ({ date, nav }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

function targetDate(latestDate: string, months: number, years: number) {
  const target = utcDate(latestDate);
  target.setUTCFullYear(target.getUTCFullYear() - years);
  target.setUTCMonth(target.getUTCMonth() - months);
  return target;
}

function observationAtOrBefore(points: NavPoint[], target: Date) {
  const targetTime = target.getTime();
  for (let index = points.length - 1; index >= 0; index -= 1) {
    const point = points[index];
    if (point && utcDate(point.date).getTime() <= targetTime) return point;
  }
  return null;
}

export function trailingReturn(input: NavPoint[], period: { months?: number; years?: number }) {
  const points = normalizeNavSeries(input);
  const latest = points.at(-1);
  if (!latest) return null;
  const months = period.months ?? 0;
  const years = period.years ?? 0;
  const target = targetDate(latest.date, months, years);
  const start = observationAtOrBefore(points, target);
  if (!start) return null;

  const elapsedDays = (utcDate(latest.date).getTime() - utcDate(start.date).getTime()) / DAY_MS;
  const requestedDays = years * YEAR_DAYS + months * (YEAR_DAYS / 12);
  // Do not label a materially shorter history as a complete trailing period.
  if (elapsedDays < requestedDays - 14) return null;
  const growth = latest.nav / start.nav;
  if (!(growth > 0)) return null;
  return requestedDays >= YEAR_DAYS ? Math.pow(growth, YEAR_DAYS / elapsedDays) - 1 : growth - 1;
}

export function dailyReturns(input: NavPoint[], startDate?: string) {
  const points = normalizeNavSeries(input).filter((point) => !startDate || point.date >= startDate);
  const returns: Array<{ date: string; value: number }> = [];
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    if (!previous || !current || previous.nav <= 0) continue;
    const value = current.nav / previous.nav - 1;
    if (Number.isFinite(value)) returns.push({ date: current.date, value });
  }
  return returns;
}

export function annualizedVolatility(input: NavPoint[], years = 3) {
  const points = normalizeNavSeries(input);
  const latest = points.at(-1);
  if (!latest) return null;
  const from = targetDate(latest.date, 0, years).toISOString().slice(0, 10);
  const returns = dailyReturns(points, from).map((item) => item.value);
  if (returns.length < 60) return null;
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance =
    returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(variance) * Math.sqrt(252);
}

export function downsideDeviation(input: NavPoint[], years = 3) {
  const points = normalizeNavSeries(input);
  const latest = points.at(-1);
  if (!latest) return null;
  const from = targetDate(latest.date, 0, years).toISOString().slice(0, 10);
  const returns = dailyReturns(points, from).map((item) => Math.min(item.value, 0));
  if (returns.length < 60) return null;
  return (
    Math.sqrt(returns.reduce((sum, value) => sum + value ** 2, 0) / returns.length) * Math.sqrt(252)
  );
}

export function drawdownSeries(input: NavPoint[], years = 5) {
  const points = normalizeNavSeries(input);
  const latest = points.at(-1);
  if (!latest) return [];
  const from = targetDate(latest.date, 0, years).toISOString().slice(0, 10);
  const scoped = points.filter((point) => point.date >= from);
  let peak = 0;
  return scoped.map((point) => {
    peak = Math.max(peak, point.nav);
    return { date: point.date, drawdown: peak > 0 ? point.nav / peak - 1 : 0 };
  });
}

export function maxDrawdown(input: NavPoint[], years = 5) {
  const series = drawdownSeries(input, years);
  return series.length ? Math.min(...series.map((point) => point.drawdown)) : null;
}

export function rollingAnnualReturns(input: NavPoint[], years = 5, sampleEvery = 20) {
  const points = normalizeNavSeries(input);
  const latest = points.at(-1);
  if (!latest) return [];
  const from = targetDate(latest.date, 0, years).toISOString().slice(0, 10);
  const scoped = points.filter((point) => point.date >= from);
  const result: Array<{ date: string; value: number }> = [];
  for (let index = 0; index < scoped.length; index += Math.max(sampleEvery, 1)) {
    const current = scoped[index];
    if (!current) continue;
    const startTarget = targetDate(current.date, 0, 1);
    const start = observationAtOrBefore(points, startTarget);
    if (!start) continue;
    const elapsedDays = (utcDate(current.date).getTime() - utcDate(start.date).getTime()) / DAY_MS;
    if (elapsedDays < YEAR_DAYS - 14) continue;
    result.push({
      date: current.date,
      value: Math.pow(current.nav / start.nav, YEAR_DAYS / elapsedDays) - 1,
    });
  }
  return result;
}

export function pearsonCorrelation(left: NavPoint[], right: NavPoint[], years = 3) {
  const leftPoints = normalizeNavSeries(left);
  const rightPoints = normalizeNavSeries(right);
  const latestDate = [leftPoints.at(-1)?.date, rightPoints.at(-1)?.date]
    .filter((date): date is string => Boolean(date))
    .sort()
    .at(-1);
  if (!latestDate) return null;
  const from = targetDate(latestDate, 0, years).toISOString().slice(0, 10);
  const leftReturns = new Map(
    dailyReturns(leftPoints, from).map((item) => [item.date, item.value]),
  );
  const pairs = dailyReturns(rightPoints, from)
    .filter((item) => leftReturns.has(item.date))
    .map((item) => [leftReturns.get(item.date)!, item.value] as const);
  if (pairs.length < 60) return null;
  const leftMean = pairs.reduce((sum, pair) => sum + pair[0], 0) / pairs.length;
  const rightMean = pairs.reduce((sum, pair) => sum + pair[1], 0) / pairs.length;
  let numerator = 0;
  let leftVariance = 0;
  let rightVariance = 0;
  for (const [leftValue, rightValue] of pairs) {
    const leftDelta = leftValue - leftMean;
    const rightDelta = rightValue - rightMean;
    numerator += leftDelta * rightDelta;
    leftVariance += leftDelta ** 2;
    rightVariance += rightDelta ** 2;
  }
  const denominator = Math.sqrt(leftVariance * rightVariance);
  return denominator > 0 ? numerator / denominator : null;
}
