"use client";

import type { HouseholdRecordKind } from "@/components/household-record-dialog";
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

type ArchivableKind = Exclude<HouseholdRecordKind, "household_profile">;

export function HouseholdArchiveButton({
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
        `/api/household/records?kind=${encodeURIComponent(kind)}&id=${encodeURIComponent(id)}`,
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
            It will leave current analytics while its historical records and audit trail remain.
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
