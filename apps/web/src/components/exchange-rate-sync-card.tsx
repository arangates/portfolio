"use client";

import { formatDate } from "@/lib/format";
import { Badge } from "@portfolio/ui/components/badge";
import { Button } from "@portfolio/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@portfolio/ui/components/card";
import { RefreshCwIcon, ShieldCheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type ExchangeRateStatus = {
  official: { rate: number; asOf: string } | null;
  indicative: { rate: number; asOf: string } | null;
  historyCount: number;
  historyStartsAt: string | null;
  liveConfigured: boolean;
};

export function ExchangeRateSyncCard({ status }: { status: ExchangeRateStatus }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function sync() {
    setPending(true);
    try {
      const response = await fetch("/api/exchange-rates/sync", { method: "POST" });
      const payload = (await response.json()) as {
        error?: string;
        result?: {
          official: { imported: number; latestDate: string; latestRate: number };
          indicative: { rate: number } | null;
          indicativeError: string | null;
        };
      };
      if (!response.ok || !payload.result) {
        throw new Error(payload.error ?? "Exchange-rate sync failed");
      }
      toast.success(
        `EUR/INR updated · ECB ${payload.result.official.latestRate.toLocaleString("en-IN", { maximumFractionDigits: 6 })}`,
      );
      if (payload.result.indicativeError) toast.warning(payload.result.indicativeError);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Exchange-rate sync failed");
    } finally {
      setPending(false);
    }
  }

  const current = status.indicative ?? status.official;
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Automatic EUR/INR rates</CardTitle>
            <CardDescription>
              ECB reference rates drive history; an optional Twelve Data quote refreshes current
              valuations.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="gap-1">
            <ShieldCheckIcon className="size-3" /> ECB official
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">Rate used now</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {current
              ? `₹${current.rate.toLocaleString("en-IN", { maximumFractionDigits: 6 })}`
              : "Not synced"}
          </p>
          <p className="text-xs text-muted-foreground">for €1</p>
        </div>
        <div className="rounded-md border bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">Official history</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {status.historyCount.toLocaleString("en-IN")} days
          </p>
          <p className="text-xs text-muted-foreground">
            {status.historyStartsAt
              ? `Since ${formatDate(status.historyStartsAt)}`
              : "Sync to import"}
          </p>
        </div>
        <div className="rounded-md border bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">Current-rate source</p>
          <p className="mt-1 text-sm font-semibold">
            {status.indicative ? "Twelve Data intraday" : "ECB daily reference"}
          </p>
          <p className="text-xs text-muted-foreground">
            {current
              ? formatDate(current.asOf)
              : status.liveConfigured
                ? "Awaiting sync"
                : "No API key needed"}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <p className="max-w-xl text-xs text-muted-foreground">
          Weekend and holiday transactions use the previous ECB business-day rate. Manual rates
          remain available as a fallback.
        </p>
        <Button onClick={sync} disabled={pending}>
          <RefreshCwIcon className={pending ? "animate-spin" : undefined} />
          {pending ? "Syncing rates…" : status.official ? "Refresh rates" : "Sync full history"}
        </Button>
      </CardFooter>
    </Card>
  );
}
