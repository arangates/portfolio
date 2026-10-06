import { auth } from "@portfolio/auth";
import { auditEvent, db } from "@portfolio/db";
import { and, desc, eq, gte } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ArchiveIcon,
  CalendarClockIcon,
  HistoryIcon,
  PencilLineIcon,
  PlusIcon,
  RefreshCwIcon,
  UploadIcon,
} from "@portfolio/ui/components/icons";

import { PageHeader } from "@/components/page-header";
import { ActivityFilters } from "./activity-filters";
import { Badge } from "@portfolio/ui/components/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@portfolio/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@portfolio/ui/components/empty";

const modules = [
  "Portfolio",
  "Cash accounts",
  "Investments",
  "Salary",
  "Household",
  "FIRE planning",
  "Imports",
  "Mortgage",
  "Tax",
  "Settings",
] as const;
type Module = (typeof modules)[number];

function moduleFor(entityType: string): Module {
  const type = entityType.toLowerCase();
  if (/notification_preference|settings|portfolio_preference/.test(type)) return "Settings";
  if (/bank|cash|transaction|exchange_rate/.test(type)) return "Cash accounts";
  if (/salary/.test(type)) return "Salary";
  if (/tax/.test(type)) return "Tax";
  if (/household|contract|purchase|budget/.test(type)) return "Household";
  if (/fire|family_member/.test(type)) return "FIRE planning";
  if (/import|manual_data_backup/.test(type)) return "Imports";
  if (/mortgage/.test(type)) return "Mortgage";
  if (
    /mutual_fund|commodity|instrument|position|ledger|portfolio|trade|capital_deployment/.test(type)
  )
    return "Investments";
  return "Portfolio";
}

function titleFor(entityType: string) {
  return entityType.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function describe(action: string, entityType: string) {
  const verbs: Record<string, string> = {
    created: "added",
    updated: "updated",
    archived: "archived",
    imported: "imported",
    synced: "synced",
    deleted: "deleted",
    merged: "merged",
  };
  return `${verbs[action.toLowerCase()] ?? action} ${titleFor(entityType)}`;
}

function dateBoundary(range: string) {
  const days = range === "day" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : null;
  if (!days) return null;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function metadataSummary(metadata: Record<string, unknown> | null) {
  if (!metadata) return null;
  const parts: string[] = [];
  for (const key of [
    "rows",
    "rowCount",
    "created",
    "updated",
    "datasets",
    "records",
    "profilesMerged",
  ]) {
    const value = metadata[key];
    if (typeof value === "number" && value > 0) {
      const label =
        key === "rows" || key === "rowCount"
          ? "rows"
          : key === "datasets"
            ? "datasets"
            : key === "profilesMerged"
              ? "profiles merged"
              : key;
      parts.push(`${value} ${label}`);
    }
  }
  return parts.length ? parts.join(" · ") : null;
}

function actionIcon(action: string) {
  switch (action.toLowerCase()) {
    case "created":
      return PlusIcon;
    case "archived":
      return ArchiveIcon;
    case "imported":
      return UploadIcon;
    case "synced":
      return RefreshCwIcon;
    default:
      return PencilLineIcon;
  }
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ module?: string; range?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const params = await searchParams;
  const preference = await db.query.portfolioPreference.findFirst({
    where: (table, { eq }) => eq(table.userId, session.user.id),
    columns: { timeZone: true },
  });
  const timeZone = preference?.timeZone ?? "UTC";
  const selectedModule = modules.includes(params.module as Module)
    ? (params.module as Module)
    : "All modules";
  const range = ["day", "7d", "30d"].includes(params.range ?? "") ? params.range! : "all";
  const boundary = dateBoundary(range);
  const events = await db
    .select({
      id: auditEvent.id,
      action: auditEvent.action,
      entityType: auditEvent.entityType,
      metadata: auditEvent.metadata,
      createdAt: auditEvent.createdAt,
    })
    .from(auditEvent)
    .where(
      and(
        eq(auditEvent.userId, session.user.id),
        ...(boundary ? [gte(auditEvent.createdAt, boundary)] : []),
      ),
    )
    .orderBy(desc(auditEvent.createdAt))
    .limit(300);
  const filtered =
    selectedModule === "All modules"
      ? events
      : events.filter((event) => moduleFor(event.entityType) === selectedModule);
  const grouped = new Map<string, typeof filtered>();
  for (const event of filtered) {
    const day = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(event.createdAt);
    grouped.set(day, [...(grouped.get(day) ?? []), event]);
  }

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 py-6">
      <PageHeader
        title="Activity"
        description="A clear history of changes across your financial workspace."
      />
      <ActivityFilters initialModule={selectedModule} initialRange={range} />

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Audited updates, imports, and syncs, newest first.</CardDescription>
          <CardAction>
            <Badge variant="secondary">
              {filtered.length} {filtered.length === 1 ? "event" : "events"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {filtered.length ? (
            [...grouped.entries()].map(([day, dayEvents]) => (
              <section key={day} className="flex flex-col gap-2">
                <h3 className="px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {new Intl.DateTimeFormat("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    timeZone,
                  }).format(dayEvents[0]!.createdAt)}
                </h3>
                <ol className="divide-y rounded-lg border">
                  {dayEvents.map((event) => {
                    const Icon = actionIcon(event.action);
                    return (
                      <li
                        key={event.id}
                        className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:gap-4"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Icon className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">
                            {describe(event.action, event.entityType)}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{moduleFor(event.entityType)}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {titleFor(event.entityType)}
                            </span>
                            {metadataSummary(event.metadata) ? (
                              <span className="text-xs text-muted-foreground">
                                · {metadataSummary(event.metadata)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <time
                          className="flex shrink-0 items-center gap-1.5 pl-12 text-xs text-muted-foreground sm:pl-0"
                          dateTime={event.createdAt.toISOString()}
                        >
                          <CalendarClockIcon />
                          {new Intl.DateTimeFormat("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone,
                          }).format(event.createdAt)}
                        </time>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HistoryIcon />
                </EmptyMedia>
                <EmptyTitle>No activity found</EmptyTitle>
                <EmptyDescription>
                  Try another module or date range. New audited updates will appear here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        This log includes changes captured by audited saves, archive actions, imports, and syncs. It
        does not track individual database cells or edits made outside the app. Sensitive financial
        values are not shown. The list displays the latest 300 matching records.
      </p>
    </div>
  );
}
