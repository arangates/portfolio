"use client";

import { TableCard } from "@/components/table-card";
import { formatFullCurrency } from "@/lib/format";
import {
  monthIndex,
  type MortgageModel,
  type PaymentComparisonRow,
  type ScheduleRow,
} from "@portfolio/api/mortgage-calculations";
import { Badge } from "@portfolio/ui/components/badge";
import { Button } from "@portfolio/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@portfolio/ui/components/table";
import { cn } from "@portfolio/ui/lib/utils";
import { DownloadIcon } from "lucide-react";
import { useState } from "react";

const eur = (value: number) => formatFullCurrency(value, "EUR");
const longMonth = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T12:00:00Z`),
  );
const shortMonth = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T12:00:00Z`),
  );
const MONTH_LABELS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

type CellState = "match" | "different" | "extra" | "missing" | "no-data" | "modelled" | "future";

const CELL_STYLE: Record<CellState, string> = {
  match: "bg-emerald-500/80 text-white",
  modelled: "bg-blue-500/70 text-white",
  extra: "bg-amber-500 text-white",
  different: "bg-orange-500 text-white",
  missing: "bg-rose-500 text-white",
  "no-data": "bg-blue-500/40 text-white",
  future: "bg-muted text-muted-foreground",
};

const CELL_LABEL: Record<CellState, string> = {
  match: "Paid as scheduled (bank debit matched)",
  modelled: "Paid (modelled — no bank data)",
  extra: "Paid more than scheduled",
  different: "Paid a different amount",
  missing: "No bank debit found",
  "no-data": "Paid (modelled — before bank history)",
  future: "Upcoming",
};

/** Year × month grid: one cell per instalment across the entire loan. */
export function MortgagePaymentCalendar({
  model,
  comparison,
}: {
  model: MortgageModel;
  comparison: PaymentComparisonRow[];
}) {
  const hasBank = comparison.some((row) => row.actual !== null);
  const history = new Map(model.history.map((row) => [row.date, row]));
  const future = new Map(model.baseline.rows.map((row) => [row.date, row]));
  const status = new Map(comparison.map((row) => [row.date, row]));
  const firstYear = Number(model.timeline[0]?.date.slice(0, 4));
  const lastYear = Number(model.timeline.at(-1)?.date.slice(0, 4));
  const years = Array.from({ length: lastYear - firstYear + 1 }, (_, i) => firstYear + i);
  return (
    <TableCard
      title="Every instalment at a glance"
      description="One square per month of the loan. Hover a square for the split between interest and principal."
      dataTable={false}
    >
      <div className="space-y-3 px-4 py-4 sm:px-5">
        <div className="overflow-x-auto">
          <div className="grid min-w-[560px] grid-cols-[3rem_repeat(12,minmax(0,1fr))] gap-1 text-[11px]">
            <span />
            {MONTH_LABELS.map((label, index) => (
              <span key={index} className="text-center text-muted-foreground">
                {label}
              </span>
            ))}
            {years.map((year) => (
              <YearRow
                key={year}
                year={year}
                history={history}
                future={future}
                status={status}
                hasBank={hasBank}
              />
            ))}
          </div>
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {(Object.keys(CELL_LABEL) as CellState[])
            .filter((state) => hasBank || (state !== "match" && state !== "missing"))
            .filter((state) => state !== (hasBank ? "modelled" : "no-data"))
            .map((state) => (
              <li key={state} className="flex items-center gap-1.5">
                <span className={cn("size-3 rounded-sm", CELL_STYLE[state])} />
                {CELL_LABEL[state]}
              </li>
            ))}
        </ul>
      </div>
    </TableCard>
  );
}

function YearRow({
  year,
  history,
  future,
  status,
  hasBank,
}: {
  year: number;
  history: Map<string, ScheduleRow>;
  future: Map<string, ScheduleRow>;
  status: Map<string, PaymentComparisonRow>;
  hasBank: boolean;
}) {
  return (
    <>
      <span className="self-center font-medium tabular-nums">{year}</span>
      {Array.from({ length: 12 }, (_, month) => {
        const date = `${year}-${String(month + 1).padStart(2, "0")}-01`;
        const past = history.get(date);
        const ahead = future.get(date);
        const row = past ?? ahead;
        if (!row) return <span key={date} className="h-6 rounded-sm bg-muted/30" />;
        const compared = status.get(date);
        const state: CellState = ahead
          ? "future"
          : hasBank && compared
            ? compared.status === "no-data"
              ? "no-data"
              : compared.status
            : "modelled";
        const title = `${shortMonth(date)} · ${CELL_LABEL[state]}\nPayment ${eur(row.payment + row.extra)} = interest ${eur(row.interest)} + principal ${eur(row.principal + row.extra)}\nBalance after: ${eur(row.closing)}`;
        return (
          <span
            key={date}
            title={title}
            className={cn("h-6 rounded-sm transition-opacity hover:opacity-70", CELL_STYLE[state])}
          />
        );
      })}
    </>
  );
}

const STATUS_BADGE: Record<
  PaymentComparisonRow["status"],
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  match: { label: "Matched", variant: "default" },
  different: { label: "Different amount", variant: "destructive" },
  extra: { label: "Extra repayment", variant: "secondary" },
  missing: { label: "No debit found", variant: "destructive" },
  "no-data": { label: "No bank data", variant: "outline" },
};

export function MortgagePaymentLedger({
  model,
  comparison,
}: {
  model: MortgageModel;
  comparison: PaymentComparisonRow[];
}) {
  const rows = model.history.map((row, index) => ({ row, check: comparison[index]! })).reverse();
  return (
    <TableCard
      title="Payment ledger"
      description="Every instalment since the first payment: what was scheduled, what the bank shows and how it splits."
      dataTable={false}
    >
      <div className="max-h-[520px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">Scheduled</TableHead>
              <TableHead className="text-right">Bank debit</TableHead>
              <TableHead className="text-right">Interest</TableHead>
              <TableHead className="text-right">Principal</TableHead>
              <TableHead className="text-right">Balance after</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ row, check }) => (
              <TableRow key={row.date}>
                <TableCell className="font-medium">{longMonth(row.date)}</TableCell>
                <TableCell className="text-right tabular-nums">{eur(row.payment)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {check.actual === null ? "—" : eur(check.actual)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{eur(row.interest)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {eur(row.principal + row.extra)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{eur(row.closing)}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_BADGE[check.status].variant}>
                    {STATUS_BADGE[check.status].label}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TableCard>
  );
}

export function MortgageYearlyTable({ model }: { model: MortgageModel }) {
  return (
    <TableCard
      title="Year by year"
      description="Calendar-year totals. Projected years assume the current payment and rate continue."
      dataTable={false}
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Year</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Interest</TableHead>
              <TableHead className="text-right">Principal</TableHead>
              <TableHead className="text-right">Year-end balance</TableHead>
              <TableHead>Basis</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {model.yearly.map((row) => (
              <TableRow key={row.year}>
                <TableCell className="font-medium">{row.year}</TableCell>
                <TableCell className="text-right tabular-nums">{eur(row.payments)}</TableCell>
                <TableCell className="text-right tabular-nums">{eur(row.interest)}</TableCell>
                <TableCell className="text-right tabular-nums">{eur(row.principal)}</TableCell>
                <TableCell className="text-right tabular-nums">{eur(row.closing)}</TableCell>
                <TableCell>
                  <Badge variant={row.projected ? "outline" : "secondary"}>
                    {row.projected ? "Projected" : "Past"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TableCard>
  );
}

export function MortgageAmortizationTable({ model }: { model: MortgageModel }) {
  const [scope, setScope] = useState<"all" | "past" | "future">("future");
  const rows = model.timeline.filter((row) => scope === "all" || row.kind === scope);
  const exportCsv = () => {
    const header = "date,type,opening,payment,interest,principal,extra,closing";
    const lines = model.timeline.map((row) =>
      [
        row.date,
        row.kind,
        row.opening,
        row.payment,
        row.interest,
        row.principal,
        row.extra,
        row.closing,
      ]
        .map((value) => (typeof value === "number" ? value.toFixed(2) : value))
        .join(","),
    );
    const url = URL.createObjectURL(
      new Blob([[header, ...lines].join("\n")], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "mortgage-amortization.csv";
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <TableCard
      title="Full amortization schedule"
      description={`${rows.length} monthly instalments. The projection starts from the balance reported by your lender.`}
      dataTable={false}
      action={
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {(["future", "past", "all"] as const).map((option) => (
            <Button
              key={option}
              size="sm"
              variant={scope === option ? "default" : "outline"}
              onClick={() => setScope(option)}
            >
              {option === "future" ? "Upcoming" : option === "past" ? "Past" : "All"}
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <DownloadIcon /> CSV
          </Button>
        </div>
      }
    >
      <div className="max-h-[520px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">Opening</TableHead>
              <TableHead className="text-right">Payment</TableHead>
              <TableHead className="text-right">Interest</TableHead>
              <TableHead className="text-right">Principal</TableHead>
              <TableHead className="text-right">Closing</TableHead>
              <TableHead className="text-right">Interest share</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.date}>
                <TableCell className="font-medium">{shortMonth(row.date)}</TableCell>
                <TableCell className="text-right tabular-nums">{eur(row.opening)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {eur(row.payment + row.extra)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{eur(row.interest)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {eur(row.principal + row.extra)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{eur(row.closing)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.payment + row.extra > 0
                    ? `${((row.interest / (row.payment + row.extra)) * 100).toFixed(0)}%`
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TableCard>
  );
}

export function MortgageRateTable({ model }: { model: MortgageModel }) {
  return (
    <TableCard
      title="Rate reset sensitivity"
      description={`Payment from ${longMonth(model.terms.fixedRateEndDate)} for different renewal rates, re-amortised over ${monthIndex(model.terms.endDate) - monthIndex(model.terms.fixedRateEndDate) + 1} months.`}
      dataTable={false}
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Renewal rate</TableHead>
              <TableHead className="text-right">New payment</TableHead>
              <TableHead className="text-right">Change vs today</TableHead>
              <TableHead className="text-right">Interest after reset</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {model.sensitivity.map((row) => (
              <TableRow key={row.delta}>
                <TableCell className="font-medium">
                  {(row.rate * 100).toFixed(2)}%
                  {row.delta === 0 ? (
                    <span className="text-muted-foreground"> (unchanged)</span>
                  ) : null}
                </TableCell>
                <TableCell className="text-right tabular-nums">{eur(row.payment)}</TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums",
                    row.change > 1 ? "text-rose-600 dark:text-rose-400" : "",
                    row.change < -1 ? "text-emerald-600 dark:text-emerald-400" : "",
                  )}
                >
                  {row.change >= 0 ? "+" : ""}
                  {eur(row.change)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {eur(row.remainingInterest)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TableCard>
  );
}
