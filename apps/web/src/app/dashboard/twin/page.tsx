import { FinancialTwinCharts } from "@/components/financial-twin-charts";
import { PageHeader } from "@/components/page-header";
import { SectionCards } from "@/components/section-cards";
import { TableCard } from "@/components/table-card";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { getFinancialTwin } from "@portfolio/api/financial-twin-queries";
import { auth } from "@portfolio/auth";
import { Badge } from "@portfolio/ui/components/badge";
import { buttonVariants } from "@portfolio/ui/components/button";
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
  ArrowRightIcon,
  BadgeCheckIcon,
  BrainCircuitIcon,
  CircleHelpIcon,
  GaugeIcon,
  ListChecksIcon,
  RouteIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TargetIcon,
  WalletCardsIcon,
} from "lucide-react";
import type { Route } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

const gradeLabels = {
  exact: "Exact source",
  reconciled: "Reconciled",
  derived: "Derived",
  limited: "Limited",
} as const;

const domainLabels = {
  data: "Data",
  cashflow: "Cash flow",
  allocation: "Allocation",
  fire: "FIRE",
  tax: "Tax",
  performance: "Returns",
} as const;

function targetLabel(years: number | null) {
  if (years === null) return "Not reached";
  if (years === 0) return "Reached";
  return `${years} year${years === 1 ? "" : "s"}`;
}

export default async function FinancialTwinPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const twin = await getFinancialTwin(session.user.id);
  const currency = twin.baseCurrency;
  const primary = twin.fire.primary;
  const observed = twin.fire.observedPrimary;

  return (
    <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 py-4 sm:py-5 md:gap-5 md:py-6">
      <PageHeader
        title="Verified financial twin"
        description="One evidence-graded decision layer connecting income, household cost, capital allocation, returns, tax history and FIRE."
      />

      <div className="grid gap-3 px-4 lg:grid-cols-2 lg:px-6">
        <div className="flex gap-3 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 text-sm">
          <BrainCircuitIcon className="mt-0.5 size-4 shrink-0 text-blue-600" />
          <p>
            The twin uses a six-month median take-home, current recurring household cost and your
            saved allocation policy. It does not turn a bonus month into a permanent commitment.
          </p>
        </div>
        <div className="flex gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
          <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          <p>
            Moving broker cash, an ultra-short-duration fund or a maturing deposit changes where
            wealth sits—not net worth or today&apos;s FIRE gap. Only new savings enter as
            contributions.
          </p>
        </div>
      </div>

      <SectionCards
        items={[
          {
            label: "Observed monthly surplus",
            value:
              twin.capacity.observedMonthlySurplus === null
                ? "—"
                : formatCurrency(twin.capacity.observedMonthlySurplus, currency),
            badge: gradeLabels[twin.capacity.evidenceGrade],
            note: `${twin.capacity.incomeMonths} recent pay months`,
            detail: "Median take-home minus recurring household cost",
            icon: WalletCardsIcon,
            href: "/dashboard/twin#twin-monthly-flow" as Route,
          },
          {
            label: "Supported deployment",
            value:
              twin.capacity.supportedMonthlyDeployment === null
                ? "—"
                : formatCurrency(twin.capacity.supportedMonthlyDeployment, currency),
            badge: twin.contributionPlan.length
              ? `${twin.contributionPlan.length} destinations`
              : "Policy check",
            note: "Bounded by observed surplus and saved policy",
            detail: "Contribution-only allocation",
            icon: RouteIcon,
            href: "/dashboard/twin#twin-capacity-check" as Route,
          },
          {
            label: "Available existing capital",
            value: formatCurrency(twin.capital.availableCapital, currency),
            badge: "Already owned",
            note: "Staging reserve and eligible cash",
            detail: "Never counted as new income",
            icon: GaugeIcon,
            href: "/dashboard/deployment",
          },
          {
            label: "Decision inputs ready",
            value: `${twin.readiness.ready}/${twin.readiness.total}`,
            badge: formatPercent(twin.readiness.ratio, 0),
            note: twin.asOf
              ? `Latest connected evidence ${formatDate(twin.asOf)}`
              : "No dated evidence",
            detail: "Readiness count, not a probability",
            icon: BadgeCheckIcon,
            href: "/dashboard/twin#evidence-ledger" as Route,
          },
        ]}
      />

      <FinancialTwinCharts
        currency={currency}
        typicalNetIncome={twin.capacity.typicalNetIncome}
        householdCost={twin.capacity.monthlyHouseholdCost}
        observedSurplus={twin.capacity.observedMonthlySurplus}
        policyDeployment={twin.capacity.policyMonthlyDeployment}
        supportedDeployment={twin.capacity.supportedMonthlyDeployment}
        retainedCash={twin.capacity.retainedMonthlyCash}
        fireMonthlySavings={twin.capacity.firePlannedMonthlySavings}
        contributionPlan={twin.contributionPlan}
      />

      <section className="space-y-3 px-4 lg:px-6" aria-labelledby="twin-actions">
        <div>
          <h2 id="twin-actions" className="text-lg font-semibold tracking-tight">
            Decision queue
          </h2>
          <p className="text-sm text-muted-foreground">
            Integrity checks come first, followed by cash-flow and contribution-only opportunities.
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {twin.actions.length === 0 ? (
            <Card className="lg:col-span-2">
              <CardContent className="flex items-center gap-3 py-5 text-sm text-muted-foreground">
                <ListChecksIcon className="size-4" /> No connected decision currently requires
                attention.
              </CardContent>
            </Card>
          ) : (
            twin.actions.map((action) => (
              <Card key={action.key} className="gap-3 py-4 shadow-xs">
                <CardHeader className="px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-sm">{action.title}</CardTitle>
                        <Badge variant="outline">{domainLabels[action.domain]}</Badge>
                      </div>
                      <CardDescription>{action.description}</CardDescription>
                    </div>
                    <Badge variant={action.severity === "attention" ? "destructive" : "secondary"}>
                      {action.severity}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 px-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{gradeLabels[action.confidence]}</span>
                    {action.amount !== null ? (
                      <span className="ml-2 font-medium tabular-nums">
                        {formatCurrency(action.amount, currency)}
                      </span>
                    ) : null}
                  </div>
                  <Link
                    href={action.href as Route}
                    className={buttonVariants({ size: "sm", variant: "ghost" })}
                  >
                    Review <ArrowRightIcon className="size-3.5" />
                  </Link>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      <section className="space-y-3 px-4 lg:px-6" aria-labelledby="fire-bridge">
        <div>
          <h2 id="fire-bridge" className="text-lg font-semibold tracking-tight">
            FIRE assumption bridge
          </h2>
          <p className="text-sm text-muted-foreground">
            The saved plan stays authoritative. The observed column is a separate owner-only
            sensitivity using imported pay and household costs.
          </p>
        </div>
        {primary && observed ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {[
              {
                label: "Saved FIRE plan",
                annualSavings: twin.fire.configuredAnnualSavings ?? 0,
                result: primary,
                badge: "Configured",
              },
              {
                label: "Observed owner-only sensitivity",
                annualSavings: twin.fire.observedAnnualSavings ?? 0,
                result: observed,
                badge: gradeLabels[twin.capacity.evidenceGrade],
              },
            ].map((scenario) => (
              <Card key={scenario.label} className="gap-4 py-4 shadow-xs">
                <CardHeader className="px-4 sm:px-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{scenario.label}</CardTitle>
                      <CardDescription>{scenario.result.name}</CardDescription>
                    </div>
                    <Badge variant="secondary">{scenario.badge}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 px-4 text-sm sm:px-5 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Annual savings</p>
                    <p className="mt-1 font-semibold tabular-nums">
                      {formatCurrency(scenario.annualSavings, currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Years to corpus</p>
                    <p className="mt-1 font-semibold tabular-nums">
                      {targetLabel(scenario.result.yearsToTarget)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Current gap</p>
                    <p className="mt-1 font-semibold tabular-nums">
                      {formatCurrency(scenario.result.gap, currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Simulation success</p>
                    <p className="mt-1 font-semibold tabular-nums">
                      {formatPercent(scenario.result.successProbability, 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex gap-3 py-5 text-sm text-muted-foreground">
              <TargetIcon className="mt-0.5 size-4 shrink-0" /> Configure FIRE and complete the
              cash-flow evidence to activate the assumption bridge.
            </CardContent>
          </Card>
        )}
      </section>

      <div id="evidence-ledger" className="scroll-mt-24">
        <TableCard
          title="Evidence ledger"
          description="What the twin knows, how it knows it and where to correct the source."
          className="mx-4 lg:mx-6"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Connected input</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Evidence</TableHead>
                <TableHead className="hidden lg:table-cell">Boundary</TableHead>
                <TableHead className="text-right">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {twin.evidence.map((item) => (
                <TableRow key={item.key}>
                  <TableCell>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.value}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.status === "ready" ? "secondary" : "outline"}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{gradeLabels[item.grade]}</TableCell>
                  <TableCell className="hidden max-w-xl text-sm text-muted-foreground lg:table-cell">
                    {item.detail}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={item.href as Route}
                      aria-label={`Open ${item.label}`}
                      className={buttonVariants({ size: "icon-sm", variant: "ghost" })}
                    >
                      <CircleHelpIcon className="size-3.5" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      </div>

      <div className="px-4 lg:px-6">
        <div className="flex gap-3 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          <SparklesIcon className="mt-0.5 size-4 shrink-0" />
          <p>
            This engine is deterministic and account-scoped. It does not place trades, renew fixed
            deposits, mark taxes paid or overwrite FIRE assumptions; every external action remains
            an explicit user decision.
          </p>
        </div>
      </div>
    </div>
  );
}
