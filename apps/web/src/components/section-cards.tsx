import type { LucideIcon } from "lucide-react";

import { Badge } from "@portfolio/ui/components/badge";
import { cn } from "@portfolio/ui/lib/utils";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@portfolio/ui/components/card";

export type MetricCard = {
  label: string;
  value: string;
  badge?: string;
  note: string;
  detail?: string;
  icon?: LucideIcon;
};

export function SectionCards({ items }: { items: MetricCard[] }) {
  const wideGrid =
    items.length <= 2
      ? "@5xl/main:grid-cols-2"
      : items.length % 3 === 0
        ? "@5xl/main:grid-cols-3"
        : "@5xl/main:grid-cols-4";
  return (
    <div className={cn("grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 lg:px-6", wideGrid)}>
      {items.map((item) => (
        <Card className="@container/card gap-0 py-0 shadow-xs" key={item.label}>
          <CardHeader className="gap-2 p-4 sm:p-5">
            <CardDescription className="flex items-center gap-2 font-medium">
              {item.icon ? <item.icon className="size-4" /> : null}
              {item.label}
            </CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums tracking-tight">
              {item.value}
            </CardTitle>
            {item.badge ? (
              <CardAction>
                <Badge variant="secondary" className="max-w-32 truncate font-normal">
                  {item.badge}
                </Badge>
              </CardAction>
            ) : null}
            <div className="min-w-0 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">{item.note}</span>
              {item.detail ? (
                <span className="hidden @min-[260px]/card:inline"> · {item.detail}</span>
              ) : null}
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
