"use client";

import { usePathname } from "next/navigation";
import { Skeleton } from "@portfolio/ui/components/skeleton";

type LoadingKind =
  | "overview"
  | "analytics"
  | "settings"
  | "calendar"
  | "notes"
  | "activity"
  | "chat"
  | "cash-flow"
  | "documents"
  | "inr"
  | "eur"
  | "fixed-deposits"
  | "indian-equity"
  | "global-equity"
  | "tradebook"
  | "salary"
  | "salary-detail"
  | "tax"
  | "household"
  | "planning"
  | "mortgage"
  | "labs"
  | "returns"
  | "commodities"
  | "property"
  | "mutual-funds"
  | "deployment"
  | "twin";

function kindForPath(pathname: string): LoadingKind {
  if (pathname.startsWith("/dashboard/chat")) return "chat";
  if (pathname.startsWith("/dashboard/settings")) return "settings";
  if (pathname.startsWith("/dashboard/calendar")) return "calendar";
  if (pathname.startsWith("/dashboard/notes")) return "notes";
  if (pathname.startsWith("/dashboard/activity")) return "activity";
  if (pathname.startsWith("/dashboard/analytics")) return "analytics";
  if (pathname.startsWith("/dashboard/cash-flow")) return "cash-flow";
  if (/^\/dashboard\/(documents|imports)(\/|$)/.test(pathname)) return "documents";
  if (pathname.startsWith("/dashboard/inr")) return "inr";
  if (pathname.startsWith("/dashboard/eur")) return "eur";
  if (pathname.startsWith("/dashboard/fixed-deposits")) return "fixed-deposits";
  if (pathname.startsWith("/dashboard/indian-equity")) return "indian-equity";
  if (pathname.startsWith("/dashboard/global-equity")) return "global-equity";
  if (pathname.startsWith("/dashboard/tradebook")) return "tradebook";
  if (/^\/dashboard\/salary\/[^/]+/.test(pathname)) return "salary-detail";
  if (pathname.startsWith("/dashboard/salary")) return "salary";
  if (pathname.startsWith("/dashboard/tax")) return "tax";
  if (pathname.startsWith("/dashboard/household")) return "household";
  if (pathname.startsWith("/dashboard/fire")) return "planning";
  if (pathname.startsWith("/dashboard/mortgage")) return "mortgage";
  if (pathname.startsWith("/dashboard/labs")) return "labs";
  if (pathname.startsWith("/dashboard/returns")) return "returns";
  if (pathname.startsWith("/dashboard/commodities")) return "commodities";
  if (pathname.startsWith("/dashboard/real-estate")) return "property";
  if (pathname.startsWith("/dashboard/mutual-funds")) return "mutual-funds";
  if (pathname.startsWith("/dashboard/deployment")) return "deployment";
  if (pathname.startsWith("/dashboard/twin")) return "twin";
  return "overview";
}

function PageHeading({ action = false }: { action?: boolean }) {
  return (
    <div className="flex flex-col gap-3 px-4 sm:flex-row sm:items-start sm:justify-between lg:px-6">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-7 w-52 max-w-[70%] rounded-md" />
        <Skeleton className="h-4 w-full max-w-2xl rounded-md" />
      </div>
      {action ? <Skeleton className="h-9 w-36 shrink-0 rounded-lg" /> : null}
    </div>
  );
}

function MetricCards({ count = 4, columns = 4 }: { count?: number; columns?: 3 | 4 }) {
  return (
    <div
      className={`grid gap-3 px-4 sm:grid-cols-2 lg:px-6 ${columns === 3 ? "@5xl/main:grid-cols-3" : "xl:grid-cols-4"}`}
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="rounded-xl border bg-card p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Skeleton className="size-4 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>
          <Skeleton className="mt-4 h-7 w-32 max-w-full rounded-md" />
          <Skeleton className="mt-3 h-3 w-4/5 rounded" />
          <Skeleton className="mt-2 h-3 w-3/5 rounded" />
        </div>
      ))}
    </div>
  );
}

function Panel({ height = "h-72", rows = 0 }: { height?: string; rows?: number }) {
  return (
    <div className="min-w-0 rounded-xl border bg-card p-4 sm:p-5">
      <Skeleton className="h-5 w-40 rounded-md" />
      <Skeleton className="mt-2 h-3 w-64 max-w-full rounded" />
      {rows > 0 ? (
        <div className="mt-5 divide-y">
          {Array.from({ length: rows }, (_, index) => (
            <div key={index} className="flex items-center gap-3 py-3">
              <Skeleton className="size-8 shrink-0 rounded-lg" />
              <Skeleton className="h-4 min-w-0 flex-1 rounded" />
              <Skeleton className="h-4 w-20 shrink-0 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <Skeleton className={`mt-5 w-full rounded-lg ${height}`} />
      )}
    </div>
  );
}

function TablePanel({ rows = 6 }: { rows?: number }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border bg-card">
      <div className="space-y-2 border-b p-4 sm:p-5">
        <Skeleton className="h-5 w-40 rounded-md" />
        <Skeleton className="h-3 w-60 max-w-full rounded" />
      </div>
      <div className="space-y-0 px-4 sm:px-5">
        <div className="flex items-center gap-4 border-b py-3">
          {["w-1/4", "w-1/5", "w-1/6", "w-1/5"].map((width, index) => (
            <Skeleton key={`${width}-${index}`} className={`h-3 ${width} rounded`} />
          ))}
        </div>
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-4 border-b py-4 last:border-0">
            <Skeleton className="h-4 w-1/4 rounded" />
            <Skeleton className="h-4 w-1/5 rounded" />
            <Skeleton className="h-4 w-1/6 rounded" />
            <Skeleton className="ml-auto h-4 w-1/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-5 py-4 sm:py-5 md:gap-6 md:py-6">
      <PageHeading action />
      <MetricCards />
      <div className="grid min-w-0 gap-4 px-4 xl:grid-cols-2 lg:px-6">
        <Panel height="h-80" />
        <Panel height="h-80" />
      </div>
      <div className="px-4 lg:px-6">
        <TablePanel rows={5} />
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-5 py-4 sm:py-5 md:gap-6 md:py-6">
      <PageHeading />
      <div className="mx-4 flex gap-5 overflow-hidden border-b pb-3 lg:mx-6">
        {["w-20", "w-24", "w-28", "w-20"].map((width, index) => (
          <Skeleton key={index} className={`h-8 shrink-0 rounded-md ${width}`} />
        ))}
      </div>
      <div className="space-y-6 px-4 lg:px-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48 rounded-md" />
          <Skeleton className="h-4 w-96 max-w-full rounded" />
        </div>
        <Panel height="h-80" />
        <div className="grid gap-4 xl:grid-cols-2">
          <Panel height="h-64" />
          <Panel height="h-64" />
        </div>
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-5 py-4 sm:py-5 md:gap-6 md:py-6">
      <PageHeading />
      <div className="flex min-w-0 flex-col gap-5 px-4 lg:flex-row lg:items-start lg:gap-8 lg:px-6">
        <div className="flex w-full gap-2 overflow-hidden border-b pb-2 lg:sticky lg:top-20 lg:w-60 lg:flex-col lg:border-0 lg:pb-0">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-28 shrink-0 rounded-lg lg:h-12 lg:w-full" />
          ))}
        </div>
        <div className="min-w-0 flex-1 space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-5 w-36 rounded-md" />
            <Skeleton className="h-4 w-64 max-w-full rounded" />
          </div>
          <Panel rows={4} />
          <Panel rows={3} />
        </div>
      </div>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="flex flex-col gap-5 py-6">
      <PageHeading />
      <section className="mx-4 space-y-4 lg:mx-6" aria-hidden="true">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="size-9 rounded-md" />
            <Skeleton className="h-9 w-40 rounded-md" />
            <Skeleton className="size-9 rounded-md" />
            <Skeleton className="h-9 w-16 rounded-md" />
          </div>
          <div className="flex gap-1">
            <Skeleton className="h-9 w-16 rounded-md" />
            <Skeleton className="h-9 w-16 rounded-md" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 min-w-0 flex-1 rounded-md" />
          <Skeleton className="h-9 w-32 max-w-full rounded-md" />
        </div>
        <Skeleton className="h-3 w-80 max-w-full rounded" />
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="grid grid-cols-7 border-b">
            {Array.from({ length: 7 }, (_, index) => (
              <div key={index} className="py-2">
                <Skeleton className="mx-auto h-3 w-7 rounded" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: 42 }, (_, index) => (
              <div
                key={index}
                className="min-h-20 min-w-0 border-b border-r p-1 sm:min-h-32 sm:p-2"
              >
                <Skeleton className="size-6 rounded-full" />
                {index % 4 === 0 ? (
                  <Skeleton className="mt-1 hidden h-3 w-full rounded sm:block" />
                ) : null}
                {index % 5 === 0 ? <Skeleton className="mt-1 h-3 w-4/5 rounded" /> : null}
              </div>
            ))}
          </div>
        </div>
        {[0, 1, 2].map((section) => (
          <div key={section} className="rounded-xl border bg-card p-4">
            <Skeleton className="h-5 w-56 max-w-full rounded-md" />
            {section > 0 ? <Skeleton className="mt-2 h-3 w-4/5 rounded" /> : null}
            <div className="mt-3 divide-y">
              {[0, 1].map((row) => (
                <div key={row} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-40 max-w-[60%] rounded" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-32 rounded" />
                    <Skeleton className="h-3 w-4/5 rounded" />
                  </div>
                  <Skeleton className="h-4 w-16 shrink-0 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
        <Skeleton className="h-3 w-96 max-w-full rounded" />
      </section>
    </div>
  );
}

function NotesSkeleton() {
  return (
    <div className="flex flex-col gap-5 py-6">
      <PageHeading />
      <div className="mx-4 flex h-[640px] overflow-hidden rounded-2xl border bg-card lg:mx-6">
        <div className="hidden w-64 border-r p-4 sm:flex sm:flex-col gap-3">
          <Skeleton className="h-6 w-24 rounded-md" />
          <div className="space-y-2 pt-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        </div>
        <div className="w-80 border-r p-4 flex flex-col gap-3">
          <Skeleton className="h-8 w-full rounded-lg" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="space-y-1.5 p-2 rounded-xl border border-border/40">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 p-6 flex flex-col gap-4">
          <Skeleton className="h-7 w-48 rounded-md" />
          <Skeleton className="h-4 w-32 rounded" />
          <div className="space-y-2 pt-4">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
            <Skeleton className="h-4 w-4/5 rounded" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="flex flex-col gap-5 py-4 sm:py-5 md:py-6">
      <PageHeading />
      <div className="mx-4 flex flex-wrap gap-2 lg:mx-6">
        <Skeleton className="h-9 w-48 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <div className="space-y-0 px-4 lg:px-6">
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index} className="flex gap-4 border-b py-5">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3 max-w-96 rounded" />
              <Skeleton className="h-3 w-1/3 max-w-56 rounded" />
            </div>
            <Skeleton className="h-4 w-20 shrink-0 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div className="flex min-h-[calc(100svh-4rem)] flex-1 flex-col justify-end px-4 py-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-7">
        <Skeleton className="ml-auto h-10 w-2/5 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-11/12 rounded" />
          <Skeleton className="h-4 w-4/5 rounded" />
          <Skeleton className="h-4 w-3/5 rounded" />
        </div>
        <Skeleton className="ml-auto h-10 w-1/3 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-10/12 rounded" />
          <Skeleton className="h-4 w-2/3 rounded" />
        </div>
        <Skeleton className="mt-8 h-16 w-full rounded-2xl" />
      </div>
    </div>
  );
}

function CashFlowSkeleton() {
  return (
    <div className="flex flex-col gap-5 py-4 sm:py-5 md:gap-6 md:py-6">
      <PageHeading action />
      <MetricCards />
      <div className="grid min-w-0 gap-4 px-4 xl:grid-cols-2 lg:px-6">
        <Panel height="h-72" />
        <Panel height="h-72" />
      </div>
      <div className="px-4 lg:px-6">
        <TablePanel rows={5} />
      </div>
    </div>
  );
}

function ReportSkeleton({
  metrics = 4,
  charts = 0,
  tables = 1,
  rows = 5,
  panels = 0,
  action = true,
}: {
  metrics?: number;
  charts?: number;
  tables?: number;
  rows?: number;
  panels?: number;
  action?: boolean;
}) {
  return (
    <div className="flex flex-col gap-5 py-4 sm:py-5 md:gap-6 md:py-6">
      <PageHeading action={action} />
      {metrics > 0 ? <MetricCards count={metrics} /> : null}
      {charts > 0 ? (
        <div className="grid min-w-0 gap-4 px-4 lg:px-6 xl:grid-cols-2">
          {Array.from({ length: charts }, (_, index) => (
            <Panel key={index} height={charts === 1 ? "h-80" : "h-72"} />
          ))}
        </div>
      ) : null}
      {panels > 0 ? (
        <div className="grid min-w-0 gap-4 px-4 lg:px-6 xl:grid-cols-2">
          {Array.from({ length: panels }, (_, index) => (
            <Panel key={index} rows={index === 0 ? 4 : 3} />
          ))}
        </div>
      ) : null}
      {tables > 0 ? (
        <div className={`grid min-w-0 gap-4 px-4 lg:px-6 ${tables > 1 ? "xl:grid-cols-2" : ""}`}>
          {Array.from({ length: tables }, (_, index) => (
            <TablePanel key={index} rows={rows} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DocumentsSkeleton() {
  return (
    <div className="flex flex-col gap-5 py-4 sm:py-5 md:gap-6 md:py-6">
      <PageHeading action />
      <div className="grid min-w-0 gap-4 px-4 lg:px-6 xl:grid-cols-2">
        <Panel height="h-48" />
      </div>
      <div className="px-4 lg:px-6">
        <TablePanel rows={7} />
      </div>
    </div>
  );
}

function EurSkeleton() {
  return <ReportSkeleton metrics={3} tables={1} rows={5} />;
}

function InrSkeleton() {
  return <ReportSkeleton metrics={4} charts={2} rows={6} />;
}

function FixedDepositsSkeleton() {
  return <ReportSkeleton metrics={4} charts={0} tables={2} rows={6} />;
}

function IndianEquitySkeleton() {
  return <ReportSkeleton metrics={4} charts={2} rows={8} />;
}

function GlobalEquitySkeleton() {
  return <ReportSkeleton metrics={4} charts={2} tables={2} rows={8} />;
}

function TradebookSkeleton() {
  return <ReportSkeleton metrics={4} charts={2} tables={3} rows={6} />;
}

function SalarySkeleton() {
  return <ReportSkeleton metrics={4} charts={2} tables={4} rows={5} />;
}

function SalaryDetailSkeleton() {
  return <ReportSkeleton metrics={4} charts={0} tables={2} rows={7} />;
}

function TaxSkeleton() {
  return <ReportSkeleton metrics={4} charts={2} rows={6} />;
}

function HouseholdSkeleton() {
  return <ReportSkeleton metrics={4} charts={2} tables={5} panels={3} rows={5} />;
}

function PlanningSkeleton() {
  return (
    <div className="flex flex-col gap-5 py-4 sm:py-5 md:gap-6 md:py-6">
      <PageHeading action />
      <MetricCards count={4} />
      <div className="px-4 lg:px-6">
        <Panel height="h-28" />
      </div>
      <div className="px-4 lg:px-6">
        <TablePanel rows={4} />
      </div>
      <div className="grid min-w-0 gap-4 px-4 lg:px-6 xl:grid-cols-2">
        <Panel height="h-80" />
        <Panel height="h-80" />
      </div>
      <div className="grid min-w-0 gap-4 px-4 lg:px-6 xl:grid-cols-2">
        {Array.from({ length: 5 }, (_, index) => (
          <TablePanel key={index} rows={5} />
        ))}
      </div>
      <div className="grid gap-4 px-4 md:grid-cols-3 lg:px-6">
        {Array.from({ length: 3 }, (_, index) => (
          <Panel key={index} rows={3} />
        ))}
      </div>
    </div>
  );
}

function MortgageSkeleton() {
  return (
    <div className="flex flex-col gap-5 py-4 sm:py-5 md:gap-6 md:py-6">
      <div className="flex flex-col gap-3 px-4 sm:flex-row sm:items-start sm:justify-between lg:px-6">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-7 w-40 rounded-md" />
          <Skeleton className="h-4 w-full max-w-3xl rounded-md" />
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
      </div>
      <MetricCards count={6} columns={3} />
      <div className="px-4 lg:px-6">
        <div className="space-y-3 rounded-xl border bg-card p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
          <div className="flex justify-between gap-3">
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="h-3 w-28 rounded" />
          </div>
        </div>
      </div>
      <div className="flex gap-2 overflow-hidden px-4 lg:px-6">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-9 w-28 shrink-0 rounded-lg" />
        ))}
      </div>
      <div className="px-4 lg:px-6">
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="border-b px-4 py-4 sm:px-5">
            <Skeleton className="h-5 w-56 max-w-full rounded-md" />
          </div>
          <div className="grid gap-px bg-border md:grid-cols-2">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="space-y-2 bg-card p-4 sm:p-5">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-4/5 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid min-w-0 gap-4 px-4 lg:grid-cols-2 lg:px-6">
        {Array.from({ length: 4 }, (_, index) => (
          <Panel key={index} height="h-[340px]" />
        ))}
      </div>
    </div>
  );
}

function LabsSkeleton() {
  return (
    <div className="flex flex-col gap-5 py-4 sm:py-5 md:gap-6 md:py-6">
      <PageHeading action={false} />
      <div className="space-y-12 px-4 lg:px-6">
        {[0, 1, 2, 3].map((section) => (
          <section key={section} className="space-y-3">
            <Skeleton className="h-6 w-52 rounded-md" />
            <Skeleton className="h-4 w-96 max-w-full rounded" />
            <Panel height={section < 2 ? "h-48" : "h-64"} />
          </section>
        ))}
      </div>
    </div>
  );
}

function ReturnsSkeleton() {
  return <ReportSkeleton metrics={4} charts={2} tables={2} panels={2} rows={6} />;
}

function CommoditiesSkeleton() {
  return <ReportSkeleton metrics={4} charts={2} tables={2} rows={6} />;
}

function PropertySkeleton() {
  return <ReportSkeleton metrics={4} charts={2} rows={7} />;
}

function MutualFundsSkeleton() {
  return (
    <div className="flex flex-col gap-5 py-4 sm:py-5 md:gap-6 md:py-6">
      <PageHeading action />
      <MetricCards count={4} />
      <div className="grid min-w-0 gap-4 px-4 lg:px-6 xl:grid-cols-2">
        <Panel height="h-80" />
        <Panel height="h-80" />
      </div>
      <div className="px-4 lg:px-6">
        <Panel height="h-64" />
      </div>
    </div>
  );
}

function DeploymentSkeleton() {
  return <ReportSkeleton metrics={4} charts={2} tables={3} panels={2} rows={6} />;
}

function TwinSkeleton() {
  return <ReportSkeleton metrics={8} charts={2} tables={1} panels={4} rows={7} />;
}

const layouts: Record<LoadingKind, () => React.JSX.Element> = {
  overview: OverviewSkeleton,
  analytics: AnalyticsSkeleton,
  settings: SettingsSkeleton,
  calendar: CalendarSkeleton,
  notes: NotesSkeleton,
  activity: ActivitySkeleton,
  chat: ChatSkeleton,
  "cash-flow": CashFlowSkeleton,
  documents: DocumentsSkeleton,
  inr: InrSkeleton,
  eur: EurSkeleton,
  "fixed-deposits": FixedDepositsSkeleton,
  "indian-equity": IndianEquitySkeleton,
  "global-equity": GlobalEquitySkeleton,
  tradebook: TradebookSkeleton,
  salary: SalarySkeleton,
  "salary-detail": SalaryDetailSkeleton,
  tax: TaxSkeleton,
  household: HouseholdSkeleton,
  planning: PlanningSkeleton,
  mortgage: MortgageSkeleton,
  labs: LabsSkeleton,
  returns: ReturnsSkeleton,
  commodities: CommoditiesSkeleton,
  property: PropertySkeleton,
  "mutual-funds": MutualFundsSkeleton,
  deployment: DeploymentSkeleton,
  twin: TwinSkeleton,
};

export default function DashboardLoading() {
  const pathname = usePathname();
  const Layout = layouts[kindForPath(pathname)];

  return (
    <div
      role="status"
      aria-live="polite"
      className="@container/main mx-auto w-full max-w-[1600px] flex-1"
    >
      <span className="sr-only">Loading page content</span>
      <Layout />
    </div>
  );
}
