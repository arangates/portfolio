import { FinancialCalendar } from "@/components/financial-calendar";
import { SnapshotChanges } from "@/components/snapshot-changes";
import { SectionCards } from "@/components/section-cards";
import { AmountModeToggle } from "@/components/amount-preferences";
import { getAmountFormatter } from "@/lib/amount-format-server";
import { compareSnapshots } from "@portfolio/api/insight-calculations";
import { validCalendarMonth, type FinancialEvent } from "@portfolio/api/calendar-calculations";
import { DataTable } from "@/components/data-table";
export default async function FeatureVerification({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { formatCurrency } = await getAmountFormatter();
  const month = validCalendarMonth((await searchParams).month, "2026-09");
  const event = {
    id: "bill",
    title: "Internet · Sample provider",
    date: `${month}-15`,
    precision: "day",
    category: "Bills",
    amount: 1234.56,
    currency: "EUR",
    href: "/dashboard/household",
    detail: "Scheduled billing date. This is not evidence of payment.",
    planned: true,
  } satisfies FinancialEvent;
  const base = {
    key: "sample",
    name: "Sample savings",
    kind: "Bank",
    href: "/dashboard/eur",
    currency: "EUR",
    asOf: "2026-09-01T00:00:00Z",
    createdAt: "2026-09-01T00:00:00Z",
    value: 123456.78,
  };
  return (
    <main className="mx-auto max-w-6xl space-y-4 py-4">
      <div className="px-4">
        <AmountModeToggle />
      </div>
      <SectionCards
        items={[
          {
            label: "Sample net worth",
            value: formatCurrency(123456.78, "EUR"),
            note: "Synthetic verification data",
            href: "/dashboard",
            explanation: {
              formula: "Sum of the saved asset values.",
              inputs: [{ label: "Savings", value: formatCurrency(123456.78, "EUR") }],
              limitations: "Synthetic test records only.",
              sourceHref: "/dashboard",
            },
          },
        ]}
      />
      <SnapshotChanges
        changes={compareSnapshots([base, { ...base, asOf: "2026-08-01T00:00:00Z", value: 120000 }])}
      />
      <DataTable
        assets={[
          {
            key: "sample",
            name: "Sample savings",
            category: "Cash",
            nativeValue: 123456.78,
            currency: "EUR",
            baseValue: 123456.78,
            isLiquid: true,
            risk: "low",
            location: "Test",
            asOf: "2026-01-01",
          },
        ]}
        baseCurrency="EUR"
      />
      <FinancialCalendar
        key={month}
        month={month}
        today="2026-09-10"
        timeZone="Europe/Amsterdam"
        undatedContracts={1}
        events={[
          event,
          {
            ...event,
            id: "salary",
            title: "Sample payslip",
            date: month,
            precision: "month",
            category: "Salary",
            planned: false,
          },
          {
            ...event,
            id: "goal",
            title: "Sample annual goal",
            date: month.slice(0, 4),
            precision: "year",
            category: "Planning",
          },
        ]}
      />
    </main>
  );
}
