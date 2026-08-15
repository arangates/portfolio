"use client";

import type { FireRecordKind } from "@/components/fire-record-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@portfolio/ui/components/alert-dialog";
import { Button } from "@portfolio/ui/components/button";
import { ArchiveIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type ArchivableKind = Exclude<FireRecordKind, "fire_profile">;

export function FireArchiveButton({
  kind,
  id,
  label,
}: {
  kind: ArchivableKind;
  id: string;
  label: string;
}) {
  const [pending, setPending] = useState(false);
  const router = useRouter();
  async function archive() {
    setPending(true);
    try {
      const response = await fetch(
        `/api/fire/records?kind=${encodeURIComponent(kind)}&id=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not archive record");
      toast.success(`${label} archived`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not archive record");
    } finally {
      setPending(false);
    }
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <ArchiveIcon />
        <span className="sr-only">Archive {label}</span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive {label}?</AlertDialogTitle>
          <AlertDialogDescription>
            It will stop affecting future FIRE calculations while remaining in the audit history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={archive} disabled={pending}>
            Archive
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
