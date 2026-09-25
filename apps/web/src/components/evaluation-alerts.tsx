"use client";

import { Badge } from "@portfolio/ui/components/badge";
import { Button } from "@portfolio/ui/components/button";
import { Card, CardHeader } from "@portfolio/ui/components/card";
import { cn } from "@portfolio/ui/lib/utils";
import { AlertCircleIcon, AlertTriangleIcon, ArrowRightIcon, InfoIcon, XIcon } from "lucide-react";
import Link from "next/link";

export type Alert = {
  id: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  actionLabel: string | null;
  actionHref: string | null;
  alertKey: string;
  createdAt: Date | string;
};

type Props = {
  alerts: Alert[];
  onDismiss?: (alertId: string) => void;
  onDismissAll?: () => void;
};

export default function EvaluationAlerts({ alerts, onDismiss, onDismissAll }: Props) {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold tracking-tight">Intelligence alerts</h3>
        {onDismissAll && (
          <Button variant="ghost" size="sm" onClick={onDismissAll}>
            Dismiss all
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const isCritical = alert.severity === "critical";
          const isWarning = alert.severity === "warning";

          return (
            <Card
              key={alert.id}
              className={cn(
                "overflow-hidden transition-colors",
                isCritical
                  ? "border-l-4 border-l-red-500 bg-red-500/5"
                  : isWarning
                    ? "border-l-4 border-l-amber-500 bg-amber-500/5"
                    : "border-l-4 border-l-blue-500 bg-blue-500/5",
              )}
            >
              <CardHeader className="p-4">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 shrink-0">
                    {isCritical ? (
                      <AlertTriangleIcon className="w-5 h-5 text-red-500" />
                    ) : isWarning ? (
                      <AlertCircleIcon className="w-5 h-5 text-amber-500" />
                    ) : (
                      <InfoIcon className="w-5 h-5 text-blue-500" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs bg-background/50">
                        {alert.category}
                      </Badge>
                      <h4 className="font-semibold text-sm leading-none">{alert.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                    {alert.actionHref && alert.actionLabel && (
                      <div className="mt-3">
                        <Link
                          href={alert.actionHref as any}
                          className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                        >
                          {alert.actionLabel}
                          <ArrowRightIcon className="w-3 h-3 ml-1" />
                        </Link>
                      </div>
                    )}
                  </div>

                  {onDismiss && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground -mr-2 -mt-2"
                      onClick={() => onDismiss(alert.id)}
                    >
                      <XIcon className="w-4 h-4" />
                      <span className="sr-only">Dismiss</span>
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
