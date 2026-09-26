import { getAmbientInsights } from "@portfolio/api/ambient-insights";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";
import { Card, CardHeader, CardTitle, CardDescription } from "@portfolio/ui/components/card";
import { Badge } from "@portfolio/ui/components/badge";
import { buttonVariants } from "@portfolio/ui/components/button";
import Link from "next/link";
import { cn } from "@portfolio/ui/lib/utils";
import * as Icons from "lucide-react";

export async function AmbientInsightsSection() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const insights = await getAmbientInsights(session.user.id);
  if (!insights || insights.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium tracking-tight">Active Insights</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {insights.map((insight) => {
          const Icon = (Icons as any)[insight.icon] || Icons.InfoIcon;

          let borderColor = "border-border";
          if (insight.severity === "critical") borderColor = "border-red-500/50";
          else if (insight.severity === "warning") borderColor = "border-amber-500/50";
          else if (insight.severity === "info") borderColor = "border-blue-500/50";

          return (
            <Card
              key={insight.id}
              className={cn("flex flex-col justify-between overflow-hidden relative", borderColor)}
            >
              <div
                className="absolute top-0 left-0 w-1 h-full bg-border"
                style={{
                  backgroundColor:
                    insight.severity === "critical"
                      ? "var(--red-500)"
                      : insight.severity === "warning"
                        ? "var(--amber-500)"
                        : "var(--blue-500)",
                }}
              />
              <CardHeader className="pl-6 pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        insight.severity === "critical"
                          ? "text-red-500"
                          : insight.severity === "warning"
                            ? "text-amber-500"
                            : "text-blue-500",
                      )}
                    />
                    <CardTitle className="text-sm font-semibold">{insight.title}</CardTitle>
                  </div>
                  {insight.metric && (
                    <Badge variant="secondary" className="font-mono text-xs">
                      {insight.metric}
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs mt-2 line-clamp-3 leading-relaxed">
                  {insight.description}
                </CardDescription>
              </CardHeader>

              {insight.actionHref && insight.actionLabel && (
                <div className="px-6 pb-4 pt-0 mt-auto">
                  <Link
                    href={insight.actionHref as any}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "w-full text-xs h-8",
                    )}
                  >
                    {insight.actionLabel}
                  </Link>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
