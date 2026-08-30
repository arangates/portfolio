"use client";

import { authClient } from "@/lib/auth-client";
import { GOOGLE_DRIVE_FILE_SCOPE } from "@/lib/drive-archive-shared";
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
import { Spinner } from "@portfolio/ui/components/spinner";
import {
  ArchiveIcon,
  ExternalLinkIcon,
  FolderPlusIcon,
  LinkIcon,
  PauseIcon,
  PlayIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export type DriveArchiveSummary = {
  available: boolean;
  connected: boolean;
  refreshReady: boolean;
  enabled: boolean;
  rootFolderReady: boolean;
  documentCount: number;
  storedCount: number;
  failedCount: number;
};

export function GoogleDriveArchiveCard({ summary }: { summary: DriveArchiveSummary }) {
  const [pending, setPending] = useState<string | null>(null);
  const router = useRouter();

  async function connect() {
    setPending("connect");
    try {
      const result = await authClient.linkSocial({
        provider: "google",
        callbackURL: "/dashboard/settings?tab=security&drive=connected",
        errorCallbackURL: "/dashboard/settings?tab=security&drive=error",
        scopes: [GOOGLE_DRIVE_FILE_SCOPE],
      });
      if (result.error) throw new Error(result.error.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not connect Google Drive");
      setPending(null);
    }
  }

  async function update(action: "initialize" | "enable" | "disable") {
    setPending(action);
    try {
      const response = await fetch("/api/google-drive/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "initialize"
            ? { action: "initialize" }
            : { action: "set_enabled", enabled: action === "enable" },
        ),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not update the Drive archive");
      toast.success(
        action === "initialize"
          ? "Selvam archive folder created"
          : action === "enable"
            ? "Automatic Drive archive enabled"
            : "Automatic Drive archive paused",
      );
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the Drive archive");
    } finally {
      setPending(null);
    }
  }

  const status = !summary.available
    ? "Unavailable"
    : !summary.connected
      ? "Not connected"
      : !summary.enabled
        ? "Paused"
        : summary.refreshReady
          ? "Active"
          : "Reconnect required";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              <ArchiveIcon className="size-4" />
              Google Drive source archive
            </CardTitle>
            <CardDescription>
              Keep the exact files behind your imported financial history in your own Drive.
            </CardDescription>
          </div>
          <Badge variant={status === "Active" ? "secondary" : "outline"}>{status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3 text-sm">
          <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="text-muted-foreground">
            Selvam requests only permission to manage files it creates. Files stay private, use your
            Google storage quota, and are never shared automatically.
          </p>
        </div>
        {summary.connected ? (
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-md border p-3">
              <p className="text-muted-foreground">Documents</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{summary.documentCount}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-muted-foreground">Stored</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{summary.storedCount}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-muted-foreground">Attention</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{summary.failedCount}</p>
            </div>
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {!summary.available ? (
          <p className="text-sm text-muted-foreground">
            Configure Google OAuth credentials to enable this integration.
          </p>
        ) : !summary.connected || !summary.refreshReady ? (
          <Button type="button" onClick={connect} disabled={Boolean(pending)}>
            {pending === "connect" ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <LinkIcon data-icon="inline-start" />
            )}
            {summary.connected ? "Reconnect Google Drive" : "Connect Google Drive"}
          </Button>
        ) : (
          <>
            {!summary.rootFolderReady ? (
              <Button
                type="button"
                onClick={() => update("initialize")}
                disabled={Boolean(pending)}
              >
                {pending === "initialize" ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <FolderPlusIcon data-icon="inline-start" />
                )}
                Create Selvam folder
              </Button>
            ) : (
              <Button
                variant="outline"
                nativeButton={false}
                render={<a href="/api/google-drive/folder" target="_blank" />}
              >
                <ExternalLinkIcon data-icon="inline-start" />
                Open Drive folder
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => update(summary.enabled ? "disable" : "enable")}
              disabled={Boolean(pending)}
            >
              {pending === "enable" || pending === "disable" ? (
                <Spinner data-icon="inline-start" />
              ) : summary.enabled ? (
                <PauseIcon data-icon="inline-start" />
              ) : (
                <PlayIcon data-icon="inline-start" />
              )}
              {summary.enabled ? "Pause archive" : "Enable archive"}
            </Button>
            <Button variant="ghost" nativeButton={false} render={<a href="/dashboard/documents" />}>
              View documents
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
