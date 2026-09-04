import { EmptyDataState } from "@/components/empty-data-state";
import { MutualFundIntelligenceCharts } from "@/components/mutual-fund-intelligence-charts";
import { MutualFundSyncButton } from "@/components/mutual-fund-sync-button";
import { PageHeader } from "@/components/page-header";
import { SectionCards } from "@/components/section-cards";
import { formatDate, formatPercent } from "@/lib/format";
import { getMutualFundIntelligence } from "@portfolio/api/mutual-fund-queries";
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
  ActivityIcon,
  CalendarCheckIcon,
  DatabaseZapIcon,
  GitCompareArrowsIcon,
  Layers3Icon,
  LockKeyholeIcon,
  ShieldCheckIcon,
  WavesIcon,
} from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function MutualFundsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const intelligence = await getMutualFundIntelligence(session.user.id);
  const hasSyncedData = intelligence.summary.syncedFunds > 0;

  return (
    <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 py-4 sm:py-5 md:gap-5 md:py-6">
      <PageHeader
        title="Mutual fund intelligence"
        description="Exact ISIN-linked scheme history, reproducible NAV analytics and explicit evidence boundaries—powered by MFAPI and your Zerodha snapshot."
        action={<MutualFundSyncButton hasData={hasSyncedData} />}
      />

      {intelligence.summary.holdingCount === 0 ? (
        <div className="px-4 lg:px-6">
          <EmptyDataState
            icon={DatabaseZapIcon}
            title="Import Zerodha holdings first"
            description="Selvam needs a current holdings snapshot with ISINs before it can link schemes and retrieve official NAV history."
          />
        </div>
      ) : !hasSyncedData ? (
        <div className="px-4 lg:px-6">
          <EmptyDataState
            icon={DatabaseZapIcon}
            title="NAV intelligence is ready to sync"
            description="Use Sync MFAPI data to match holdings by exact ISIN and cache their full NAV history. Fund names are never fuzzy-matched automatically."
            action={<MutualFundSyncButton hasData={false} />}
          />
        </div>
      ) : (
        <>
          <SectionCards
            items={[
              {
                label: "Verified value coverage",
                value: formatPercent(intelligence.summary.valueCoverage, 1),
                badge: `${intelligence.summary.syncedFunds}/${intelligence.summary.holdingCount} holdings`,
                note: "Linked by exact ISIN",
                detail: "No name-only matches",
                icon: ShieldCheckIcon,
              },
              {
                label: "Weighted 1Y scheme return",
                value:
                  intelligence.summary.weighted1yReturn === null
                    ? "—"
                    : formatPercent(intelligence.summary.weighted1yReturn, 1),
                badge: "NAV based",
                note: "Current-value weighted",
                detail: "Not investor XIRR",
                icon: ActivityIcon,
              },
              {
                label: "Weighted 3Y volatility",
                value:
                  intelligence.summary.weightedVolatility3y === null
                    ? "—"
                    : formatPercent(intelligence.summary.weightedVolatility3y, 1),
                badge: "252-day annualized",
                note: "Daily NAV variability",
                detail: "Growth options only",
                icon: WavesIcon,
              },
              {
                label: "Latest market reference",
                value: intelligence.summary.latestNavDate
                  ? formatDate(intelligence.summary.latestNavDate)
                  : "—",
                badge: `${intelligence.summary.exactReconciliationPasses}/${intelligence.summary.exactReconciliations} reconciled`,
                note: "Newest cached MFAPI NAV",
                detail: "Prior published NAV within 0.1%",
                icon: CalendarCheckIcon,
              },
            ]}
          />

          <MutualFundIntelligenceCharts
            funds={intelligence.funds}
            categories={intelligence.categories}
            correlation={intelligence.correlation}
          />

          <div className="px-4 lg:px-6">
            <Card className="gap-0 py-0 shadow-xs">
              <CardHeader className="border-b p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base">Evidence ledger</CardTitle>
                    <CardDescription>
                      What Selvam can calculate now, and what must wait for a dated primary source.
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">No synthetic holdings</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4 sm:p-5">
                <EvidenceCard
                  icon={ShieldCheckIcon}
                  title="NAV performance"
                  status="Verified"
                  description="Daily MFAPI NAVs linked to the imported scheme by exact ISIN."
                />
                <EvidenceCard
                  icon={GitCompareArrowsIcon}
                  title="Stock overlap"
                  status="Needs disclosure"
                  description="Requires a dated official AMC portfolio-disclosure file with constituent weights."
                />
                <EvidenceCard
                  icon={Layers3Icon}
                  title="Sector & group exposure"
                  status="Needs disclosure"
                  description="Requires constituents, sector tags and an official company-group mapping."
                />
                <EvidenceCard
                  icon={LockKeyholeIcon}
                  title="Expense drag"
                  status="Needs factsheet"
                  description="MFAPI has no TER history; Selvam will not estimate this from fund returns."
                />
              </CardContent>
            </Card>
          </div>

          <div className="px-4 lg:px-6">
            <div className="rounded-lg border bg-muted/25 p-4 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Calculation policy</p>
              <p className="mt-1 leading-relaxed">
                Returns below one year are point-to-point. One year and longer are annualized using
                actual elapsed days. Volatility uses the sample standard deviation of aligned daily
                returns × √252. Drawdown is measured from each scheme&apos;s prior NAV peak.
                Correlation uses common NAV dates only and requires at least 60 observations. These
                are scheme analytics, not a buy/sell recommendation and not a substitute for
                investor XIRR.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function EvidenceCard({
  icon: Icon,
  title,
  status,
  description,
}: {
  icon: typeof ShieldCheckIcon;
  title: string;
  status: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-3.5">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <p className="text-sm font-medium">{title}</p>
      </div>
      <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {status}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
