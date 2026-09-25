"use client";

import { Button } from "@portfolio/ui/components/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@portfolio/ui/components/drawer";
import { EyeIcon, XIcon } from "lucide-react";

type DetailItem = {
  label: string;
  value: string;
};

type DetailInsight = DetailItem & {
  detail: string;
};

type DetailBreakdown = {
  title: string;
  description: string;
  segments: Array<DetailItem & { amount: number }>;
};

export function RecordDetailsDrawer({
  title,
  description,
  items,
  insights = [],
  breakdown,
  triggerLabel = "Details",
}: {
  title: string;
  description: string;
  items: DetailItem[];
  insights?: DetailInsight[];
  breakdown?: DetailBreakdown;
  triggerLabel?: string;
}) {
  const breakdownTotal = breakdown?.segments.reduce((sum, segment) => sum + segment.amount, 0) ?? 0;

  return (
    <Drawer swipeDirection="right">
      <DrawerTrigger
        render={
          <Button variant="ghost" size="sm" title={`View details for ${title}`}>
            <EyeIcon data-icon="inline-start" />
            {triggerLabel}
          </Button>
        }
      />
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
          {insights.length > 0 ? (
            <section className="grid gap-3 sm:grid-cols-2" aria-label="Key insights">
              {insights.map((insight) => (
                <div key={insight.label} className="border p-3">
                  <p className="text-xs font-medium text-muted-foreground">{insight.label}</p>
                  <p className="mt-1 text-base font-semibold tabular-nums">{insight.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{insight.detail}</p>
                </div>
              ))}
            </section>
          ) : null}
          {breakdown && breakdownTotal > 0 ? (
            <section className="grid gap-3" aria-label={breakdown.title}>
              <div>
                <h3 className="text-sm font-medium">{breakdown.title}</h3>
                <p className="text-xs text-muted-foreground">{breakdown.description}</p>
              </div>
              <div className="flex h-2 overflow-hidden bg-muted" aria-hidden="true">
                {breakdown.segments
                  .filter((segment) => segment.amount > 0)
                  .map((segment, index) => (
                    <div
                      key={segment.label}
                      className={index % 2 === 0 ? "bg-primary" : "bg-chart-2"}
                      style={{ width: `${(segment.amount / breakdownTotal) * 100}%` }}
                    />
                  ))}
              </div>
              <dl className="grid gap-2">
                {breakdown.segments.map((segment) => (
                  <div
                    key={segment.label}
                    className="flex items-baseline justify-between gap-3 text-sm"
                  >
                    <dt className="text-muted-foreground">{segment.label}</dt>
                    <dd className="tabular-nums">{segment.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
          <section className="grid gap-3" aria-label="Record details">
            <h3 className="text-sm font-medium">Record details</h3>
            <dl className="grid gap-4 text-sm">
              {items.map((item) => (
                <div key={item.label} className="grid gap-1 border-b pb-4 last:border-0 last:pb-0">
                  <dt className="text-xs font-medium text-muted-foreground">{item.label}</dt>
                  <dd className="break-words tabular-nums">{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
        <DrawerFooter>
          <DrawerClose
            render={
              <Button variant="outline">
                <XIcon data-icon="inline-start" />
                Close
              </Button>
            }
          />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
