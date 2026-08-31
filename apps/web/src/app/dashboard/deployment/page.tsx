import { CapitalDeploymentCharts } from "@/components/capital-deployment-charts";
import { CapitalDeploymentPolicyDialog } from "@/components/capital-deployment-policy-dialog";
import { EmptyDataState } from "@/components/empty-data-state";
import { PageHeader } from "@/components/page-header";
import { SectionCards } from "@/components/section-cards";
import { TableCard } from "@/components/table-card";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { getCapitalDeploymentEngine } from "@portfolio/api/capital-deployment-queries";
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
  ArrowDownToLineIcon,
  CalendarClockIcon,
  CircleHelpIcon,
  Layers3Icon,
  ListChecksIcon,
  ShieldCheckIcon,
  SparklesIcon,
  WalletCardsIcon,
} from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const confidenceLabels = {
  reconciled: "Reconciled",
  exact: "Exact source",
  derived: "Derived",
  inferred: "Inferred",
} as const;

const statusLabels = {
  below: "Below range",
  above: "Above range",
  within: "Within range",
  unconfigured: "Not configured",
} as const;

export default async function CapitalDeploymentPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const engine = await getCapitalDeploymentEngine(session.user.id);
  const currency = engine.preference.baseCurrency;

  if (engine.summary.investmentTotal <= 0) {
    return (
      <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col py-4 sm:py-5 md:py-6">
        <PageHeader
          title="Capital deployment"
          description="Turn imported investment activity, reserves and maturities into an evidence-graded action plan."
        />
        <div className="mt-4 px-4 lg:px-6">
          <EmptyDataState
            icon={WalletCardsIcon}
            title="No deployable investment data"
            description="Import holdings, tradebooks or Degiro history, or add fixed deposits and cash accounts first."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 py-4 sm:py-5 md:gap-5 md:py-6">
      <PageHeader
        title="Capital deployment"
        description="A verified view of investable capital, purchase flows, scheduled liquidity and contribution-only actions."
        action={
          <CapitalDeploymentPolicyDialog
            policy={engine.policy}
            allocation={engine.allocation}
            stagingCandidates={engine.stagingCandidates}
            baseCurrency={currency}
          />
        }
      />

      {engine.missingCurrencies.length > 0 ? (
        <div className="px-4 lg:px-6">
          <div className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
            <CircleHelpIcon className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <p>
              Missing stored FX rates for {engine.missingCurrencies.join(", ")}. Affected values are
              excluded rather than silently treated as zero.
            </p>
          </div>
        </div>
      ) : null}

      <SectionCards
        items={[
          {
            label: "Investable capital",
            value: formatCurrency(engine.summary.investmentTotal, currency),
            badge: engine.asOf ? formatDate(engine.asOf) : "Latest records",
            note: "Marketable holdings, fixed deposits and cash",
            detail: "Property and reserved physical assets excluded",
            icon: Layers3Icon,
          },
          {
            label: "Available to deploy",
            value: formatCurrency(engine.summary.availableCapital, currency),
            badge: engine.selectedStaging ? "Staging + cash" : "Cash surplus",
            note: `${formatCurrency(engine.summary.stagingAvailable, currency)} staging reserve above floor`,
            detail: engine.policy.includeBankCash
              ? "Includes broker cash and opted-in bank cash above configured minimums"
              : "Operational bank balances are excluded by policy",
            icon: ArrowDownToLineIcon,
          },
          {
            label: "Scheduled liquidity",
            value: formatCurrency(engine.summary.scheduledLiquidity, currency),
            badge: `${engine.policy.fixedDepositHorizonDays} days`,
            note: "Projected proceeds from active fixed deposits",
            detail: "Not counted as cash before maturity",
            icon: CalendarClockIcon,
          },
          {
            label: "Zerodha reconciliation",
            value: formatPercent(engine.summary.zerodhaValueCoverage, 2),
            badge: `${engine.summary.zerodhaReconciledPositions}/${engine.summary.zerodhaPositions} positions`,
            note: "Latest holding value backed by imported trade units",
            detail: "Unmatched opening units remain explicitly flagged",
            icon: ShieldCheckIcon,
          },
        ]}
      />

      <CapitalDeploymentCharts
        allocation={engine.allocation}
        flows={engine.flows}
        maturityWindows={engine.maturityWindows}
        currency={currency}
      />

      <section className="space-y-3 px-4 lg:px-6" aria-labelledby="deployment-actions">
        <div>
          <h2 id="deployment-actions" className="text-lg font-semibold tracking-tight">
            Action queue
          </h2>
          <p className="text-sm text-muted-foreground">
            Deterministic checks first; inferred events never become instructions automatically.
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {engine.actions.length === 0 ? (
            <Card className="lg:col-span-2">
              <CardContent className="flex items-center gap-3 py-5 text-sm text-muted-foreground">
                <ListChecksIcon className="size-4" /> No policy breaches or near-term maturity
                checks require attention.
              </CardContent>
            </Card>
          ) : (
            engine.actions.map((action) => (
              <Card key={action.key} className="gap-3 py-4 shadow-xs">
                <CardHeader className="px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-sm">{action.title}</CardTitle>
                      <CardDescription>{action.description}</CardDescription>
                    </div>
                    <Badge variant={action.severity === "attention" ? "destructive" : "outline"}>
                      {action.severity}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-3 px-4 text-sm">
                  <span className="text-muted-foreground">
                    {confidenceLabels[action.confidence]}
                  </span>
                  {action.amount !== null ? (
                    <span className="font-medium tabular-nums">
                      {formatCurrency(action.amount, currency)}
                    </span>
                  ) : null}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      <div className="grid min-w-0 gap-4 px-4 xl:grid-cols-2 lg:px-6">
        <TableCard
          title="Allocation control"
          description="Current position, policy range and next contribution by bucket."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bucket</TableHead>
                <TableHead className="text-right">Current</TableHead>
                <TableHead className="text-right">Policy</TableHead>
                <TableHead className="text-right">Next</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {engine.allocation.map((item) => (
                <TableRow key={item.bucket}>
                  <TableCell>
                    <p className="font-medium">{item.label}</p>
                    <Badge
                      variant={item.status === "within" ? "secondary" : "outline"}
                      className="mt-1"
                    >
                      {statusLabels[item.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <p>{formatCurrency(item.currentValue, currency)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatPercent(item.currentWeight, 1)}
                    </p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.targetWeight === null ? (
                      "—"
                    ) : (
                      <>
                        <p>{formatPercent(item.targetWeight, 1)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatPercent(item.minimumWeight ?? 0, 0)}–
                          {formatPercent(item.maximumWeight ?? 0, 0)}
                        </p>
                      </>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {item.nextContribution > 0
                      ? formatCurrency(item.nextContribution, currency)
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>

        <TableCard
          title="Fixed-deposit maturity schedule"
          description="Projected proceeds; taxes and premature-withdrawal penalties are not estimated."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Institution</TableHead>
                <TableHead>Maturity</TableHead>
                <TableHead className="text-right">Projected</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {engine.maturities.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.bank}</TableCell>
                  <TableCell>
                    <p>{formatDate(item.maturityDate)}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.daysUntil < 0
                        ? `${Math.abs(item.daysUntil)} days overdue`
                        : item.daysUntil === 0
                          ? "Due today"
                          : `${item.daysUntil} days`}
                    </p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(item.maturityValue, item.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      </div>

      <div className="grid min-w-0 gap-4 px-4 xl:grid-cols-2 lg:px-6">
        <TableCard
          title="Possible staging transfers"
          description="Timing-and-amount matches only. Confirm against the actual STP instruction before relying on them."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Possible destinations</TableHead>
                <TableHead className="text-right">Matched</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {engine.inferredTransfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                    No candidate transfers found for the selected staging reserve.
                  </TableCell>
                </TableRow>
              ) : (
                engine.inferredTransfers.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p>{formatDate(item.soldAt)}</p>
                      <Badge variant="outline" className="mt-1">
                        {item.matchConfidence} match
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-72">
                      <p className="line-clamp-2">{item.destinations.join(", ")}</p>
                      <p className="text-xs text-muted-foreground">
                        Sale {formatCurrency(item.saleAmount, currency)}
                      </p>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(item.purchaseAmount, currency)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableCard>

        <div className="space-y-3">
          <div>
            <h2 className="text-base font-semibold">Evidence register</h2>
            <p className="text-sm text-muted-foreground">
              The confidence boundary attached to each family of insights.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {engine.evidence.map((item) => (
              <Card key={item.key} className="gap-3 py-4 shadow-xs">
                <CardHeader className="px-4">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm">{item.label}</CardTitle>
                    <Badge variant={item.grade === "inferred" ? "outline" : "secondary"}>
                      {confidenceLabels[item.grade]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 px-4">
                  <p className="font-medium tabular-nums">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <div className="flex gap-3 rounded-lg border bg-muted/25 p-4 text-sm text-muted-foreground">
          <SparklesIcon className="mt-0.5 size-4 shrink-0" />
          <p>
            Selvam recommends where a future contribution can go; it does not predict returns,
            confirm an STP, estimate tax, or initiate a transaction.
          </p>
        </div>
      </div>
    </div>
  );
}
