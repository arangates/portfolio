"use client";

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

export function CommodityInventoryArchiveButton({ id, label }: { id: string; label: string }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function archive() {
    setPending(true);
    try {
      const response = await fetch(
        `/api/commodity-inventory/records?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        },
      );
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not archive inventory item");
      toast.success(`${label} archived`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not archive inventory item");
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
            The item will leave the current inventory; its dated measurement history remains stored.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={pending} onClick={archive}>
            Archive
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
