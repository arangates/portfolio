import type { LucideIcon } from "lucide-react";

import { Badge } from "@zerodha-coin/ui/components/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@zerodha-coin/ui/components/card";

export type MetricCard = {
  label: string;
  value: string;
  badge?: string;
  note: string;
  detail?: string;
  icon?: LucideIcon;
};

export function SectionCards({ items }: { items: MetricCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {items.map((item) => (
        <Card className="@container/card" key={item.label}>
          <CardHeader>
            <CardDescription>{item.label}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {item.value}
            </CardTitle>
            {item.badge || item.icon ? (
              <CardAction>
                <Badge variant="outline">
                  {item.icon ? <item.icon /> : null}
                  {item.badge}
                </Badge>
              </CardAction>
            ) : null}
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 font-medium">{item.note}</div>
            {item.detail ? <div className="text-muted-foreground">{item.detail}</div> : null}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
