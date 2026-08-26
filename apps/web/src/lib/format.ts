const INR_COMPACT_UNITS = [
  { threshold: 10_000_000, divisor: 10_000_000, suffix: "Cr" },
  { threshold: 100_000, divisor: 100_000, suffix: "L" },
  { threshold: 1_000, divisor: 1_000, suffix: "K" },
] as const;

function formatIndianCompactCurrency(value: number) {
  if (!Number.isFinite(value)) return "—";

  const absoluteValue = Math.abs(value);
  const unit = INR_COMPACT_UNITS.find((candidate) => absoluteValue >= candidate.threshold);
  const scaledValue = unit ? absoluteValue / unit.divisor : absoluteValue;
  const formattedValue = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: unit ? 2 : 0,
  }).format(scaledValue);

  return `${value < 0 ? "-" : ""}₹${formattedValue}${unit?.suffix ?? ""}`;
}

export function formatCurrency(value: number, currency: string) {
  const normalizedCurrency = currency.toUpperCase();
  if (normalizedCurrency === "INR") return formatIndianCompactCurrency(value);

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: normalizedCurrency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompactCurrency(value: number, currency: string) {
  const normalizedCurrency = currency.toUpperCase();
  if (normalizedCurrency === "INR") return formatIndianCompactCurrency(value);

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: normalizedCurrency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercent(value: number, digits = 1) {
  return new Intl.NumberFormat("en", {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatDate(value: string | Date) {
  const parsed =
    value instanceof Date
      ? value
      : /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T12:00:00Z`)
        : new Date(value);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}
