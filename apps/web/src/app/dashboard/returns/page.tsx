import { EmptyDataState } from "@/components/empty-data-state";
import { PageHeader } from "@/components/page-header";
import { SectionCards } from "@/components/section-cards";
import { TableCard } from "@/components/table-card";
import { VerifiedReturnsCharts } from "@/components/verified-returns-charts";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { getVerifiedReturnsEngine } from "@portfolio/api/verified-returns-queries";
import { auth } from "@portfolio/auth";
import { Badge } from "@portfolio/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@portfolio/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@portfolio/ui/components/table";
import {
  BadgeCheckIcon,
  CalculatorIcon,
  ChartNoAxesCombinedIcon,
  CircleHelpIcon,
  GaugeIcon,
  ScaleIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
} from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const gradeLabels = {
  reconciled: "Reconciled",
  exact: "Exact source",
  derived: "Derived",
  unavailable: "Unavailable",
} as const;

const statusLabels: Record<string, string> = {
  ok: "Available",
  invalid: "Insufficient cash flows",
  no_root: "No valid solution",
  ambiguous: "Multiple possible returns",
  unreconciled: "Opening history missing",
};

function returnValue(value: number | null) {
  return value === null ? "—" : formatPercent(value, 2);
}

export default async function VerifiedReturnsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const engine = await getVerifiedReturnsEngine(session.user.id);
  const zerodha = engine.scopes.find((scope) => scope.id === "zerodha");
  const degiro = engine.scopes.find((scope) => scope.id === "degiro");

  if (engine.scopes.length === 0) {
    return (
      <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col py-4 sm:py-5 md:py-6">
        <PageHeader
          title="Verified returns"
          description="Auditable money-weighted performance with explicit data-quality boundaries."
        />
        <div className="mt-4 px-4 lg:px-6">
          <EmptyDataState
            icon={ChartNoAxesCombinedIcon}
            title="No return history yet"
            description="Import Zerodha holdings and tradebooks or complete Degiro Transactions and Account exports."
          />
        </div>
      </div>
    );
  }

  const positions = engine.scopes.flatMap((scope) =>
    scope.positions.map((position) => ({
      ...position,
      account: scope.label,
      currency: scope.currency,
    })),
  );
  const chartScopes = engine.scopes.map((scope) => ({
    id: scope.id,
    label: scope.label,
    currency: scope.currency,
    monthly: scope.monthly.map((item) => ({
      month: item.month,
      contributions: item.contributions,
      withdrawals: item.withdrawals,
      cumulativeNetContributions: item.cumulativeNetContributions,
    })),
    intervals: scope.intervals.map((interval) => ({
      from: interval.from,
      to: interval.to,
      return: interval.return,
    })),
    positions: scope.positions.map((position) => ({
      name: position.name,
      currentValue: position.currentValue,
      xirr: position.xirr,
    })),
  }));

  return (
    <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 py-4 sm:py-5 md:gap-5 md:py-6">
      <PageHeader
        title="Verified returns"
        description="Money-weighted returns, cash-flow gain and cost attribution—calculated only to the precision supported by imported evidence."
      />

      <div className="grid gap-3 px-4 lg:grid-cols-2 lg:px-6">
        <div className="flex gap-3 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 text-sm">
          <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-blue-600" />
          <p>
            Zerodha XIRR includes only holdings whose imported transaction units reconcile to the
            latest broker snapshot. Unmatched opening units are excluded, not estimated.
          </p>
        </div>
        <div className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
          <CircleHelpIcon className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p>
            Degiro returns remain derived because open holdings use their last imported trade price.
            Combined INR/EUR performance is withheld until historical FX is available.
          </p>
        </div>
      </div>

      <SectionCards
        items={[
          {
            label: "Indian money-weighted return",
            value: returnValue(zerodha?.metrics.moneyWeightedReturn ?? null),
            badge: zerodha ? gradeLabels[zerodha.evidenceGrade] : "No data",
            note: zerodha
              ? `${formatPercent(zerodha.coverage.valueCoverage ?? 0, 2)} of current value included`
              : "Import holdings and tradebooks",
            detail: "Since first reconciled cash flow",
            icon: TrendingUpIcon,
          },
          {
            label: "Indian cash-flow gain",
            value: zerodha ? formatCurrency(zerodha.metrics.cashFlowGain, zerodha.currency) : "—",
            badge: zerodha ? `${zerodha.coverage.includedInstruments} instruments` : "No data",
            note: "Closing value + sales − purchases",
            detail: "Reconciled subset only",
            icon: CalculatorIcon,
          },
          {
            label: "Global account return",
            value: returnValue(degiro?.metrics.moneyWeightedReturn ?? null),
            badge: degiro ? gradeLabels[degiro.evidenceGrade] : "No data",
            note: degiro ? formatCurrency(degiro.metrics.cashFlowGain, degiro.currency) : "No data",
            detail: "Economic gain from external cash flows",
            icon: GaugeIcon,
          },
          {
            label: "Verified value coverage",
            value: formatPercent(engine.summary.verifiedValueCoverage, 2),
            badge: zerodha
              ? `${zerodha.coverage.reconciledHoldings}/${zerodha.coverage.holdings} holdings`
              : "No holdings",
            note:
              engine.summary.excludedClosingValue > 0
                ? `${formatCurrency(engine.summary.excludedClosingValue, "INR")} excluded`
                : "No excluded Indian value",
            detail: "Coverage is value-weighted",
            icon: BadgeCheckIcon,
          },
        ]}
      />

      <VerifiedReturnsCharts scopes={chartScopes} />

      <section className="space-y-3 px-4 lg:px-6" aria-labelledby="return-scopes">
        <div>
          <h2 id="return-scopes" className="text-lg font-semibold tracking-tight">
            Return scopes
          </h2>
          <p className="text-sm text-muted-foreground">
            Each broker remains in its native currency; no latest-rate FX shortcut is used.
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {engine.scopes.map((scope) => (
            <Card key={scope.id} className="min-w-0 gap-4 py-4 shadow-xs">
              <CardHeader className="px-4 sm:px-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{scope.label}</CardTitle>
                    <CardDescription>
                      As of {formatDate(scope.valuationDate)} · {scope.valuationBasis}
                    </CardDescription>
                  </div>
                  <Badge variant={scope.evidenceGrade === "reconciled" ? "secondary" : "outline"}>
                    {gradeLabels[scope.evidenceGrade]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-x-4 gap-y-5 px-4 text-sm sm:grid-cols-3 sm:px-5 xl:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">XIRR</p>
                  <p className="mt-1 font-semibold tabular-nums">
                    {returnValue(scope.metrics.moneyWeightedReturn)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {statusLabels[scope.metrics.moneyWeightedStatus]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Closing value</p>
                  <p className="mt-1 font-semibold tabular-nums">
                    {formatCurrency(scope.metrics.closingValue, scope.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Net contributions</p>
                  <p className="mt-1 font-semibold tabular-nums">
                    {formatCurrency(scope.metrics.netContributions, scope.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cash-flow gain</p>
                  <p className="mt-1 font-semibold tabular-nums">
                    {formatCurrency(scope.metrics.cashFlowGain, scope.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Average-cost realized</p>
                  <p className="mt-1 font-semibold tabular-nums">
                    {formatCurrency(scope.metrics.realizedPnl, scope.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Unrealized</p>
                  <p className="mt-1 font-semibold tabular-nums">
                    {formatCurrency(scope.metrics.unrealizedPnl, scope.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fees</p>
                  <p className="mt-1 font-semibold tabular-nums">
                    {scope.metrics.fees === null
                      ? "Not in export"
                      : formatCurrency(scope.metrics.fees, scope.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Net dividends</p>
                  <p className="mt-1 font-semibold tabular-nums">
                    {scope.metrics.dividends === null
                      ? "Not in export"
                      : scope.metrics.dividends
                          .map((item) => formatCurrency(item.amount, item.currency))
                          .join(" · ") || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Attribution residual</p>
                  <p className="mt-1 font-semibold tabular-nums">
                    {formatCurrency(scope.metrics.attributionResidual, scope.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Linked snapshot return</p>
                  <p className="mt-1 font-semibold tabular-nums">
                    {returnValue(scope.metrics.linkedModifiedDietz)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="px-4 lg:px-6">
        <TableCard
          title="Instrument return register"
          description="Searchable performance, reconciliation and valuation evidence for every imported instrument."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instrument</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Evidence</TableHead>
                <TableHead className="text-right">Purchases</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Current value</TableHead>
                <TableHead className="text-right">Cash-flow gain</TableHead>
                <TableHead className="text-right">XIRR</TableHead>
                <TableHead className="text-right">Realized</TableHead>
                <TableHead className="text-right">Unrealized</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((position) => (
                <TableRow key={`${position.account}:${position.instrumentId}`}>
                  <TableCell>
                    <p className="max-w-72 truncate font-medium" title={position.name}>
                      {position.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{position.isin}</p>
                  </TableCell>
                  <TableCell>{position.account}</TableCell>
                  <TableCell>
                    <Badge variant={position.reconciled ? "secondary" : "outline"}>
                      {position.reconciled
                        ? position.account.includes("Zerodha")
                          ? "Reconciled"
                          : "Derived"
                        : "Opening gap"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(position.purchases, position.currency)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(position.sales, position.currency)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(position.currentValue, position.currency)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {position.cashFlowGain === null
                      ? "—"
                      : formatCurrency(position.cashFlowGain, position.currency)}
                  </TableCell>
                  <TableCell
                    className="text-right tabular-nums"
                    title={statusLabels[position.xirrStatus]}
                  >
                    {returnValue(position.xirr)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {position.realizedPnl === null
                      ? "—"
                      : formatCurrency(position.realizedPnl, position.currency)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {position.unrealizedPnl === null
                      ? "—"
                      : formatCurrency(position.unrealizedPnl, position.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      </div>

      <div className="grid min-w-0 gap-4 px-4 xl:grid-cols-2 lg:px-6">
        <TableCard
          title="Evidence register"
          description="What is observed, reconciled, estimated or deliberately withheld."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evidence</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {engine.evidence.map((item) => (
                <TableRow key={item.key}>
                  <TableCell>
                    <p className="font-medium">{item.label}</p>
                    <p className="max-w-xl whitespace-normal text-xs text-muted-foreground">
                      {item.detail}
                    </p>
                  </TableCell>
                  <TableCell>{gradeLabels[item.grade]}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === "available" ? "secondary" : "outline"}>
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>

        <Card className="min-w-0 gap-4 py-4 shadow-xs">
          <CardHeader className="px-4 sm:px-5">
            <CardTitle className="flex items-center gap-2 text-base">
              <ScaleIcon className="size-4" /> Methodology
            </CardTitle>
            <CardDescription>Definitions used consistently throughout this page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 text-sm sm:px-5">
            <div>
              <p className="font-medium">Money-weighted return</p>
              <p className="text-muted-foreground">
                XIRR discounts every dated investor cash flow and the terminal value. Multiple roots
                are reported as ambiguous instead of selecting one silently.
              </p>
            </div>
            <div>
              <p className="font-medium">Cash-flow gain</p>
              <p className="text-muted-foreground">
                Terminal value plus withdrawals and sales, less contributions and purchases. It is
                an absolute economic result, not an annualized percentage.
              </p>
            </div>
            <div>
              <p className="font-medium">Realized attribution</p>
              <p className="text-muted-foreground">
                Weighted-average cost attribution for analysis. It is not a tax-lot or tax-return
                calculation.
              </p>
            </div>
            <div>
              <p className="font-medium">Time-weighted return</p>
              <p className="text-muted-foreground">
                Withheld until valuations exist around every external flow. Zerodha snapshot periods
                use Modified Dietz and are labelled estimates.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
