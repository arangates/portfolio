import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@portfolio/ui/components/card";

export function AnalyticsChartCard({
  id,
  title,
  description,
  metric,
  metricTooltip,
  metricLabel,
  children,
}: {
  id?: string;
  title: string;
  description: string;
  metric?: string;
  metricTooltip?: string;
  metricLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <Card id={id} className="min-w-0 scroll-mt-24 gap-0 overflow-hidden py-0 shadow-xs">
      <CardHeader className="gap-1 border-b px-4 py-4 sm:px-5">
        <div className="flex min-w-0 flex-col items-start justify-between gap-3 sm:flex-row sm:gap-4">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {metric ? (
            <div className="shrink-0 text-left sm:text-right">
              <p
                className="text-lg font-semibold tracking-tight tabular-nums"
                title={metricTooltip}
              >
                {metric}
              </p>
              {metricLabel ? (
                <p className="text-[11px] text-muted-foreground">{metricLabel}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="min-w-0 p-2 sm:p-3">{children}</CardContent>
    </Card>
  );
}
