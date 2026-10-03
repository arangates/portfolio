"use client";

import {
  MortgageBalanceChart,
  MortgageCostChart,
  MortgageCumulativeChart,
  MortgageEquityChart,
  MortgagePaymentChart,
  MortgageSensitivityChart,
  MortgageYearlyChart,
} from "@/components/mortgage-charts";
import { MortgageSettings } from "@/components/mortgage-settings";
import { MortgageSimulator } from "@/components/mortgage-simulator";
import { MortgageUploadDialog } from "@/components/mortgage-upload-dialog";
import {
  MortgageAmortizationTable,
  MortgagePaymentCalendar,
  MortgagePaymentLedger,
  MortgageRateTable,
  MortgageYearlyTable,
} from "@/components/mortgage-tables";
import { PageHeader } from "@/components/page-header";
import { SectionCards } from "@/components/section-cards";
import { appFetch } from "@/lib/app-activity";
import { formatFullCurrency, formatPercent } from "@/lib/format";
import {
  ING_MORTGAGE_OVERVIEW,
  buildMortgageModel,
  comparePayments,
  type ActualPayment,
  type MortgageSettingsState,
  type Insight,
} from "@portfolio/api/mortgage-calculations";
import type { MortgageRecord, MortgageSnapshot } from "@portfolio/api/mortgage-queries";
import { Badge } from "@portfolio/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@portfolio/ui/components/card";
import { Progress } from "@portfolio/ui/components/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@portfolio/ui/components/tabs";
import { cn } from "@portfolio/ui/lib/utils";
import {
  AlertTriangleIcon,
  CalendarRangeIcon,
  CheckCircle2Icon,
  FlagIcon,
  HouseIcon,
  InfoIcon,
  LandmarkIcon,
  PercentIcon,
  PiggyBankIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
  TableIcon,
  WalletIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const UNSAVED_LOAN_NUMBER = "R 106-784564";
const eur = (value: number) => formatFullCurrency(value, "EUR");
const longDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T12:00:00Z`));
const monthYear = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T12:00:00Z`),
  );
const spanLabel = (months: number) => `${Math.floor(months / 12)}y ${months % 12}m`;

const DEFAULT_SETTINGS: MortgageSettingsState = {
  terms: ING_MORTGAGE_OVERVIEW,
  rateBasis: "implied",
  extras: [],
  appreciation: 0,
};

const TONE_STYLE: Record<Insight["tone"], { icon: typeof InfoIcon; className: string }> = {
  good: { icon: CheckCircle2Icon, className: "text-emerald-600 dark:text-emerald-400" },
  warn: { icon: AlertTriangleIcon, className: "text-amber-600 dark:text-amber-400" },
  info: { icon: InfoIcon, className: "text-blue-600 dark:text-blue-400" },
};

export function MortgageDashboard({
  record,
  snapshots,
  bankPayments,
  coverageStart,
  coverageEnd,
}: {
  record: MortgageRecord | null;
  snapshots: MortgageSnapshot[];
  bankPayments: ActualPayment[];
  coverageStart: string | null;
  coverageEnd: string | null;
}) {
  const router = useRouter();
  const initial = record?.settings ?? DEFAULT_SETTINGS;
  const [settings, setSettings] = useState<MortgageSettingsState>(initial);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const dirty = JSON.stringify(settings) !== JSON.stringify(initial);
  const loanNumber = record?.loanNumber ?? UNSAVED_LOAN_NUMBER;
  const lender = record?.lender ?? "ING";
  const nhg = record ? record.nhg : true;
  const energyLabel = record ? record.energyLabel : "A";

  async function save() {
    setSaving(true);
    setSaveError(null);
    try {
      const response = await appFetch("/api/mortgage/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...settings, loanNumber, energyLabel, nhg }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not save the mortgage");
      router.refresh();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save the mortgage");
    } finally {
      setSaving(false);
    }
  }

  const model = useMemo(
    () =>
      buildMortgageModel({
        terms: settings.terms,
        rateBasis: settings.rateBasis,
        extras: settings.extras,
      }),
    [settings],
  );
  const comparison = useMemo(
    () => comparePayments(model.history, bankPayments, coverageStart, coverageEnd),
    [model.history, bankPayments, coverageStart, coverageEnd],
  );
  const suggestedExtras = useMemo(
    () =>
      comparison
        .filter((row) => row.status === "extra" && row.actual !== null)
        .map((row) => ({
          date: row.date,
          amount: Math.round((row.actual! - row.scheduled) * 100) / 100,
        }))
        .filter(
          (extra) =>
            extra.amount > 0 &&
            !settings.extras.some(
              (existing) => existing.date.slice(0, 7) === extra.date.slice(0, 7),
            ),
        ),
    [comparison, settings.extras],
  );
  const { terms, summary } = model;
  const matched = comparison.filter((row) => row.status === "match").length;
  const missing = comparison.filter((row) => row.status === "missing");
  const odd = comparison.filter((row) => row.status === "different" || row.status === "extra");
  const bankInsights: Insight[] =
    bankPayments.length === 0
      ? [
          {
            id: "bank-none",
            tone: "info",
            title: "No mortgage debits found in bank imports",
            text: "Import your ING current-account statements under Cash accounts and every actual payment will be matched against this schedule.",
          },
        ]
      : [
          {
            id: "bank-match",
            tone: missing.length + odd.length === 0 ? "good" : "warn",
            title: `${matched} of ${comparison.length} instalments verified in your bank`,
            text:
              missing.length + odd.length === 0
                ? "Every instalment with bank coverage was debited at the scheduled amount."
                : `${missing.length} month(s) have no matching debit and ${odd.length} differ from the scheduled amount${odd.some((row) => row.status === "extra") ? " (some look like extra repayments)" : ""}. See the payment ledger.`,
          },
        ];
  const insights = [...bankInsights, ...model.insights];
  const asOf = longDate(terms.asOf);

  return (
    <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
      <div className="flex flex-col gap-4 py-4 sm:py-5 md:gap-5 md:py-6">
        <PageHeader
          title="Mortgage"
          description={`${lender} ${model.terms.monthlyPayment ? "annuity " : ""}mortgage ${loanNumber} · figures from the lender overview of ${asOf}. Past instalments are modelled from the annuity formula and checked against your bank debits.`}
          action={
            <>
              <Badge variant="secondary">
                <LandmarkIcon /> Rate {formatPercent(summary.rate, 2)} ({settings.rateBasis})
              </Badge>
              {nhg || energyLabel ? (
                <Badge variant="outline">
                  {[nhg ? "NHG" : null, energyLabel ? `Energy label ${energyLabel}` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </Badge>
              ) : null}
              <MortgageUploadDialog label={record ? "Import newer overview" : "Import overview"} />
            </>
          }
        />

        <SectionCards
          items={[
            {
              label: "Outstanding debt",
              value: eur(terms.currentBalance),
              badge: formatPercent(1 - summary.repaidShare, 1),
              note: `${eur(summary.repaid)} repaid of ${eur(terms.originalAmount)}`,
              detail: `Reported by the lender on ${asOf}`,
              icon: LandmarkIcon,
            },
            {
              label: "Monthly payment",
              value: eur(terms.monthlyPayment),
              badge: `${formatPercent(summary.interestShare, 0)} interest`,
              note: `${eur(summary.currentInterest)} interest · ${eur(summary.currentPrincipal)} principal`,
              detail: "This month's split at the current balance",
              icon: WalletIcon,
            },
            {
              label: "Interest paid so far",
              value: eur(summary.interestPaid),
              badge: `${summary.paymentsMade} payments`,
              note: `${eur(summary.paidToDate)} paid in total`,
              detail: `${eur(summary.remainingInterest)} interest still to come`,
              icon: PercentIcon,
            },
            {
              label: "Equity (paper)",
              value: eur(summary.equity),
              badge: `LTV ${formatPercent(summary.ltv, 1)}`,
              note: `Value ${eur(terms.propertyValue)} valued ${longDate(terms.valuationDate)}`,
              detail: "Property value is the last known valuation",
              icon: HouseIcon,
            },
            {
              label: "Debt-free",
              value: summary.payoffDate ? monthYear(summary.payoffDate) : "—",
              badge: spanLabel(summary.paymentsRemaining),
              note: `Contract ends ${monthYear(terms.endDate)}`,
              detail:
                summary.monthsAheadOfContract > 0
                  ? `${summary.monthsAheadOfContract} months ahead of contract at the current balance`
                  : "On the contractual schedule",
              icon: FlagIcon,
            },
            {
              label: "Rate reset",
              value: monthYear(terms.fixedRateEndDate),
              badge: spanLabel(summary.monthsToFixedEnd),
              note: `${eur(summary.balanceAtFixedEnd)} still outstanding then`,
              detail: `${formatPercent(summary.shareRepaidAtFixedEnd, 0)} of the loan repaid by then`,
              icon: CalendarRangeIcon,
            },
          ]}
        />

        <div className="px-4 lg:px-6">
          <Card className="gap-3 py-4 shadow-xs">
            <CardContent className="space-y-2 px-4 sm:px-5">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-medium">Repayment progress</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatPercent(summary.repaidShare, 1)} repaid
                </span>
              </div>
              <Progress value={summary.repaidShare * 100} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
                <span>{eur(summary.repaid)} repaid</span>
                <span>{eur(terms.currentBalance)} to go</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="min-w-0 gap-5 px-4 lg:px-6">
          <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-lg border bg-muted/40 p-1 group-data-horizontal/tabs:h-auto sm:inline-flex sm:w-auto">
            <TabsTrigger value="overview" className="h-9 shrink-0 gap-2 px-3">
              <LandmarkIcon className="size-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="payments" className="h-9 shrink-0 gap-2 px-3">
              <WalletIcon className="size-4" /> Payments
            </TabsTrigger>
            <TabsTrigger value="schedule" className="h-9 shrink-0 gap-2 px-3">
              <TableIcon className="size-4" /> Schedule
            </TabsTrigger>
            <TabsTrigger value="simulator" className="h-9 shrink-0 gap-2 px-3">
              <SlidersHorizontalIcon className="size-4" /> What-if
            </TabsTrigger>
            <TabsTrigger value="risk" className="h-9 shrink-0 gap-2 px-3">
              <PiggyBankIcon className="size-4" /> Rate &amp; equity
            </TabsTrigger>
            <TabsTrigger value="settings" className="h-9 shrink-0 gap-2 px-3">
              <SettingsIcon className="size-4" /> Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex min-w-0 flex-col gap-4">
            <Card className="gap-0 py-0 shadow-xs">
              <CardHeader className="border-b px-4 py-4 sm:px-5">
                <CardTitle className="text-base">What your mortgage is telling you</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-px bg-border p-0 md:grid-cols-2">
                {insights.map((insight) => {
                  const tone = TONE_STYLE[insight.tone];
                  return (
                    <div key={insight.id} className="flex gap-3 bg-card p-4 sm:p-5">
                      <tone.icon className={cn("mt-0.5 size-4 shrink-0", tone.className)} />
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-medium">{insight.title}</p>
                        <p className="text-pretty text-sm text-muted-foreground">{insight.text}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            <div className="grid min-w-0 gap-4 xl:grid-cols-2">
              <MortgageBalanceChart model={model} />
              <MortgageCumulativeChart model={model} />
              <MortgageYearlyChart model={model} />
              <MortgageCostChart model={model} />
            </div>
          </TabsContent>

          <TabsContent value="payments" className="flex min-w-0 flex-col gap-4">
            <MortgagePaymentCalendar model={model} comparison={comparison} />
            <MortgagePaymentChart model={model} comparison={comparison} />
            <MortgagePaymentLedger model={model} comparison={comparison} />
          </TabsContent>

          <TabsContent value="schedule" className="flex min-w-0 flex-col gap-4">
            <MortgageYearlyTable model={model} />
            <MortgageAmortizationTable model={model} />
          </TabsContent>

          <TabsContent value="simulator" className="flex min-w-0 flex-col gap-4">
            <MortgageSimulator model={model} />
          </TabsContent>

          <TabsContent value="risk" className="flex min-w-0 flex-col gap-4">
            <div className="grid min-w-0 gap-4 xl:grid-cols-2">
              <MortgageSensitivityChart model={model} />
              <MortgageEquityChart model={model} appreciation={settings.appreciation} />
            </div>
            <MortgageRateTable model={model} />
          </TabsContent>

          <TabsContent value="settings" className="flex min-w-0 flex-col gap-4">
            <MortgageSettings
              settings={settings}
              onChange={setSettings}
              onReset={() => setSettings(DEFAULT_SETTINGS)}
              onSave={save}
              saving={saving}
              saveError={saveError}
              dirty={dirty || !record}
              saved={Boolean(record)}
              issues={record?.validationIssues ?? []}
              snapshots={snapshots}
              suggestedExtras={suggestedExtras}
              defaultSettings={DEFAULT_SETTINGS}
              impliedRate={summary.impliedRate}
              balanceGap={summary.balanceGap}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
