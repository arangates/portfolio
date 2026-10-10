"use client";

import { useOperationBusy } from "@/hooks/use-operation-busy";
import { appFetch } from "@/lib/app-activity";
import { Button } from "@portfolio/ui/components/button";
import { LinkIcon, RefreshCwIcon } from "@portfolio/ui/components/icons";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function ZerodhaSyncButton({ isConnected }: { isConnected: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  useOperationBusy(pending);

  if (!isConnected) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          window.location.href = "/api/zerodha/connect";
        }}
      >
        <LinkIcon />
        Connect Zerodha
      </Button>
    );
  }

  async function handleSync() {
    setPending(true);
    try {
      const response = await appFetch("/api/zerodha/sync", { method: "POST" });
      const payload = (await response.json()) as {
        error?: string;
        result?: {
          holdingsSynced: number;
          tradesSynced: number;
          errors: Array<{ item: string; message: string }>;
        };
      };

      if (!response.ok || !payload.result) {
        throw new Error(payload.error ?? "Zerodha sync failed");
      }

      toast.success(
        `Synced ${payload.result.holdingsSynced} holdings and ${payload.result.tradesSynced} trades from Zerodha`,
      );
      if (payload.result.errors.length > 0) {
        toast.warning(`${payload.result.errors.length} items had sync warnings`);
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Zerodha sync failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleSync} disabled={pending}>
      <RefreshCwIcon className={pending ? "animate-spin" : undefined} />
      {pending ? "Syncing Zerodha…" : "Sync Zerodha"}
    </Button>
  );
}
