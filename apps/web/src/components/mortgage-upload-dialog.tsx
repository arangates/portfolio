"use client";

import { useOperationBusy } from "@/hooks/use-operation-busy";
import { appFetch } from "@/lib/app-activity";
import { driveArchiveResultText, type DriveArchiveStatus } from "@/lib/drive-archive-shared";
import { Button } from "@portfolio/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@portfolio/ui/components/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@portfolio/ui/components/field";
import { Input } from "@portfolio/ui/components/input";
import { Spinner } from "@portfolio/ui/components/spinner";
import { UploadIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

type ImportResult = {
  duplicate: boolean;
  asOf: string;
  validationStatus: string;
  archive?: { status: DriveArchiveStatus };
};

export function MortgageUploadDialog({ label = "Import overview" }: { label?: string }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  useOperationBusy(pending);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = new FormData(form).get("file");
    setError(null);
    setMessage(null);
    if (!(file instanceof File) || file.size === 0)
      return setError("Select a mortgage overview PDF.");
    if (!file.name.toLowerCase().endsWith(".pdf") || file.size > MAX_FILE_SIZE) {
      return setError("The file must be a PDF smaller than 10 MB.");
    }
    setPending(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await appFetch("/api/mortgage/imports", { method: "POST", body });
      const payload = (await response.json()) as { error?: string; result?: ImportResult };
      if (!response.ok || !payload.result) throw new Error(payload.error ?? "Import failed");
      const { result } = payload;
      setMessage(
        (result.duplicate
          ? "This overview was already imported."
          : `Overview of ${result.asOf} imported${result.validationStatus === "needs_review" ? " — please review the highlighted fields in Settings" : ""}.`) +
          driveArchiveResultText(result.archive?.status),
      );
      form.reset();
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Import failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <UploadIcon data-icon="inline-start" />
        {label}
      </DialogTrigger>
      <DialogContent data-financial-dialog className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import mortgage overview</DialogTitle>
          <DialogDescription>
            Upload the lender&apos;s Hypotheekoverzicht PDF. Balance, rate, payment and dates are
            read from it and every chart updates. Import a newer overview any time to refresh them.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-5">
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor="mortgage-overview-file">Hypotheekoverzicht PDF</FieldLabel>
            <Input
              id="mortgage-overview-file"
              name="file"
              type="file"
              accept=".pdf,application/pdf"
              required
              disabled={pending}
              aria-invalid={Boolean(error)}
            />
            <FieldDescription>
              Maximum 10 MB. Exact duplicates are skipped. When Drive archive is enabled, the PDF
              stays in your private Selvam folder.
            </FieldDescription>
            {error ? <FieldError>{error}</FieldError> : null}
          </Field>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <UploadIcon data-icon="inline-start" />
              )}
              {pending ? "Importing" : "Import PDF"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
