"use client";

import { Button } from "@portfolio/ui/components/button";
import { RefreshCwIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function MutualFundSyncButton({ hasData }: { hasData: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function sync() {
    setPending(true);
    try {
      const response = await fetch("/api/mutual-funds/sync", { method: "POST" });
      const payload = (await response.json()) as {
        error?: string;
        result?: { matched: number; synced: number; navRowsWritten: number; errors: unknown[] };
      };
      if (!response.ok || !payload.result) throw new Error(payload.error ?? "MFAPI sync failed");
      toast.success(
        `Synced ${payload.result.synced} funds · ${payload.result.navRowsWritten.toLocaleString("en-IN")} NAV observations`,
      );
      if (payload.result.errors.length > 0) {
        toast.warning(`${payload.result.errors.length} fund syncs need attention`);
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "MFAPI sync failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button size="sm" onClick={sync} disabled={pending}>
      <RefreshCwIcon className={pending ? "animate-spin" : undefined} />
      {pending ? "Syncing MFAPI…" : hasData ? "Refresh NAV data" : "Sync MFAPI data"}
    </Button>
  );
}
