export type FinancialEvent = {
  id: string;
  title: string;
  date: string;
  precision: "day" | "month" | "year";
  category: string;
  amount: number | null;
  currency: string | null;
  href: string;
  detail: string;
  planned: boolean;
};
export function validCalendarMonth(value: string | undefined, fallback: string) {
  return value && /^(19|20|21|22)\d{2}-(0[1-9]|1[0-2])$/.test(value) ? value : fallback;
}
export function calendarDay(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function billingDate(month: string, billingDay: number) {
  const [year, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(year!, m!, 0)).getUTCDate();
  return `${month}-${String(Math.min(last, Math.max(1, billingDay))).padStart(2, "0")}`;
}
export function calendarCells(month: string) {
  const [year, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year!, m! - 1, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) =>
    new Date(Date.UTC(year!, m! - 1, 1 - offset + index)).toISOString().slice(0, 10),
  );
}
export function contractEvents(
  month: string,
  contracts: Array<{ id: string; service: string; provider: string }>,
  terms: Array<{
    contractId: string;
    effectiveFrom: string;
    billingDay: number | null;
    contractEndDate: string | null;
    monthlyCost: number | null;
    status: string;
    createdAt: Date;
  }>,
  currency: string,
): FinancialEvent[] {
  const result: FinancialEvent[] = [];
  for (const contract of contracts) {
    const history = terms
      .filter((t) => t.contractId === contract.id)
      .toSorted(
        (a, b) =>
          a.effectiveFrom.localeCompare(b.effectiveFrom) ||
          a.createdAt.getTime() - b.createdAt.getTime(),
      );
    history.forEach((term, index) => {
      if (term.status !== "active") return;
      const next = history[index + 1]?.effectiveFrom;
      const valid = (date: string) =>
        date >= term.effectiveFrom &&
        (!next || date < next) &&
        (!term.contractEndDate || date <= term.contractEndDate);
      if (term.billingDay !== null) {
        const date = billingDate(month, term.billingDay);
        if (valid(date))
          result.push({
            id: `bill-${contract.id}-${date}`,
            title: `${contract.service} · ${contract.provider}`,
            date,
            precision: "day",
            category: "Bills",
            amount: term.monthlyCost,
            currency,
            href: "/dashboard/household",
            detail:
              "Scheduled from the saved billing day and effective contract terms. This is not evidence of payment. Days beyond a month's end are shown on its last day.",
            planned: true,
          });
      }
      if (term.contractEndDate?.startsWith(month) && valid(term.contractEndDate))
        result.push({
          id: `renewal-${contract.id}-${term.contractEndDate}`,
          title: `Contract ends · ${contract.service}`,
          date: term.contractEndDate,
          precision: "day",
          category: "Contracts",
          amount: null,
          currency: null,
          href: "/dashboard/household",
          detail: `${contract.provider}. Confirm renewal or cancellation; the app does not renew contracts.`,
          planned: true,
        });
    });
  }
  return result;
}
