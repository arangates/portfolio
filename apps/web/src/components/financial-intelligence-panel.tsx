"use client";

import { useMemo, useState } from "react";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  CircleGaugeIcon,
  LightbulbIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Badge } from "@portfolio/ui/components/badge";
import { Button } from "@portfolio/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@portfolio/ui/components/card";
import type { IntelligenceSnapshot } from "@portfolio/api/financial-intelligence";

const severityStyles = {
  critical: "border-destructive/40 bg-destructive/10",
  warning: "border-amber-500/40 bg-amber-500/10",
  opportunity: "border-primary/40 bg-primary/10",
  info: "border-border bg-muted/30",
} as const;
const severityLabels = {
  critical: "Critical",
  warning: "Attention",
  opportunity: "Opportunity",
  info: "Insight",
} as const;

export function FinancialIntelligencePanel({
  data,
  compact = false,
}: {
  data: IntelligenceSnapshot;
  compact?: boolean;
}) {
  const [filter, setFilter] = useState<string>("all");
  const [extraSavings, setExtraSavings] = useState(0);
  const [extraSpend, setExtraSpend] = useState(0);
  const visible = data.insights.filter(
    (insight) => filter === "all" || insight.category === filter,
  );
  const scenario = useMemo(() => {
    const annualDelta = extraSavings * 12 - extraSpend * 12;
    return { annualDelta, fiveYear: annualDelta * 5 };
  }, [extraSavings, extraSpend]);
  if (compact)
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <LightbulbIcon className="size-4 text-primary" /> Financial briefing
          </CardTitle>
          <CardDescription>{data.briefing.headline}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">{data.briefing.summary}</p>
          <div className="flex items-center justify-between gap-3">
            <Badge variant="outline">Data quality {data.quality.score}%</Badge>
            <Button variant="ghost" size="sm" render={<a href="/dashboard/intelligence" />}>
              View briefing <ArrowRightIcon />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card">
        <CardHeader className="gap-4 border-b border-border/60">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge className="mb-3 gap-1">
                <CircleGaugeIcon /> Daily financial briefing
              </Badge>
              <CardTitle className="max-w-2xl text-2xl text-balance">
                {data.briefing.headline}
              </CardTitle>
              <CardDescription className="mt-2 max-w-2xl text-sm leading-6">
                {data.briefing.summary}
              </CardDescription>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/40 px-4 py-3 text-right">
              <p className="text-xs text-muted-foreground">Data confidence</p>
              <p className="text-2xl font-semibold">{data.quality.score}%</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-4 sm:p-6">
          <Metric label="Net worth" value={data.baseline.netWorth.toLocaleString()} />
          <Metric label="Liquid assets" value={data.baseline.liquidAssets.toLocaleString()} />
          <Metric label="Monthly spend" value={data.baseline.monthlyExpenses.toLocaleString()} />
          <Metric
            label="Retirement target"
            value={data.baseline.retirementYear?.toString() ?? "Not configured"}
          />
        </CardContent>
      </Card>
      {data.quality.notices.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheckIcon className="size-4 text-amber-500" /> Data quality notes
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.quality.notices.map((notice) => (
              <Badge key={notice} variant="outline" className="font-normal">
                {notice}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm font-medium">Connected discoveries</span>
        {["all", "liquidity", "portfolio", "fire", "spending"].map((item) => (
          <Button
            key={item}
            size="sm"
            variant={filter === item ? "default" : "outline"}
            onClick={() => setFilter(item)}
          >
            {item[0].toUpperCase() + item.slice(1)}
          </Button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {visible.map((insight) => (
          <Card key={insight.id} className={severityStyles[insight.severity]}>
            <CardHeader className="gap-3 pb-3">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-base text-balance">{insight.title}</CardTitle>
                <Badge variant="outline">{severityLabels[insight.severity]}</Badge>
              </div>
              <CardDescription>{insight.observation}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-medium">Why it matters</p>
                <p className="mt-1 leading-6 text-muted-foreground">{insight.whyItMatters}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                <p className="font-medium">Recommended action</p>
                <p className="mt-1 leading-6 text-muted-foreground">{insight.recommendation}</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>Sources: {insight.sources.join(" + ")}</span>
                <span>{Math.round(insight.confidence * 100)}% confidence</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scenario simulator</CardTitle>
          <CardDescription>
            Test how a monthly change compounds without changing your imported records.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              Extra monthly savings{" "}
              <input
                className="w-full accent-primary"
                type="range"
                min="0"
                max="5000"
                step="100"
                value={extraSavings}
                onChange={(event) => setExtraSavings(Number(event.target.value))}
              />
              <span className="block text-muted-foreground">
                {extraSavings.toLocaleString()} / month
              </span>
            </label>
            <label className="space-y-2 text-sm">
              Monthly expense increase{" "}
              <input
                className="w-full accent-destructive"
                type="range"
                min="0"
                max="3000"
                step="100"
                value={extraSpend}
                onChange={(event) => setExtraSpend(Number(event.target.value))}
              />
              <span className="block text-muted-foreground">
                {extraSpend.toLocaleString()} / month
              </span>
            </label>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
            <CheckCircle2Icon
              className={scenario.annualDelta >= 0 ? "text-primary" : "text-destructive"}
            />
            <p className="text-sm leading-6">
              This changes annual cash flow by{" "}
              <strong>{scenario.annualDelta.toLocaleString()}</strong> and five-year contributions
              by <strong>{scenario.fiveYear.toLocaleString()}</strong>, before investment returns.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold">{value}</p>
    </div>
  );
}
