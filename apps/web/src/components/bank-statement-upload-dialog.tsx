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
import { Progress } from "@portfolio/ui/components/progress";
import { Spinner } from "@portfolio/ui/components/spinner";
import { FilesIcon, UploadIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

type Result = { name: string; state: "imported" | "duplicate" | "failed"; message: string };

async function upload(file: File, ownershipType: string): Promise<Result> {
  try {
    const body = new FormData();
    body.set("file", file);
    body.set("ownershipType", ownershipType);
    const response = await appFetch("/api/cash-flow/imports", { method: "POST", body });
    const payload = (await response.json()) as {
      error?: string;
      result?: {
        duplicate: boolean;
        provider: string;
        insertedRows: number;
        skippedRows: number;
        validationStatus: string;
        archive?: { status: DriveArchiveStatus };
      };
    };
    if (!response.ok || !payload.result) throw new Error(payload.error ?? "Import failed");
    return {
      name: file.name,
      state: payload.result.duplicate ? "duplicate" : "imported",
      message: payload.result.duplicate
        ? "This exact statement was already imported."
        : `${payload.result.insertedRows} transactions added, ${payload.result.skippedRows} existing rows skipped; ${payload.result.validationStatus.replace("_", " ")}.${driveArchiveResultText(payload.result.archive?.status)}`,
    };
  } catch (error) {
    return {
      name: file.name,
      state: "failed",
      message: error instanceof Error ? error.message : "Import failed",
    };
  }
}

export function BankStatementUploadDialog() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  useOperationBusy(pending);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const files = Array.from(new FormData(form).getAll("files")).filter(
      (value): value is File => value instanceof File && value.size > 0,
    );
    const ownershipType = String(new FormData(form).get("ownershipType") ?? "personal");
    setError(null);
    setResults([]);
    if (!files.length) return setError("Select at least one statement.");
    if (files.length > 24) return setError("Select no more than 24 statements at once.");
    const invalid = files.find(
      (file) => !/\.(pdf|csv)$/i.test(file.name) || file.size > 15 * 1024 * 1024,
    );
    if (invalid) return setError(`${invalid.name} must be a PDF or CSV smaller than 15 MB.`);
    setPending(true);
    const completed: Result[] = [];
    for (let index = 0; index < files.length; index += 2) {
      completed.push(
        ...(await Promise.all(
          files.slice(index, index + 2).map((file) => upload(file, ownershipType)),
        )),
      );
      setResults([...completed]);
    }
    setPending(false);
    if (completed.some((item) => item.state !== "failed")) {
      form.reset();
      router.refresh();
    }
  }
  const done = results.length;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <UploadIcon data-icon="inline-start" />
        Import statements
      </DialogTrigger>
      <DialogContent data-financial-dialog className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import bank statements</DialogTitle>
          <DialogDescription>
            ABN AMRO Statement of Account PDFs and ING transaction CSV exports are detected
            automatically. Import one account per file.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <Field>
            <FieldLabel htmlFor="bank-ownership">Account ownership</FieldLabel>
            <select
              id="bank-ownership"
              name="ownershipType"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="personal">Personal account</option>
              <option value="joint">Joint household account</option>
            </select>
            <FieldDescription>
              This applies to every file in this batch. Import personal and joint statements in
              separate batches.
            </FieldDescription>
          </Field>
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor="bank-files">PDF or CSV statements</FieldLabel>
            <Input
              id="bank-files"
              name="files"
              type="file"
              accept=".pdf,.csv,application/pdf,text/csv"
              multiple
              required
              disabled={pending}
            />
            <FieldDescription>
              Overlapping and exact re-uploads are safe: existing transactions are skipped.
              Joint-account values remain full household values.
            </FieldDescription>
            {error ? <FieldError>{error}</FieldError> : null}
          </Field>
          {pending || done ? (
            <div className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <FilesIcon className="size-4" />
                  {pending ? "Processing statements" : "Import complete"}
                </span>
                <span>{done}</span>
              </div>
              <Progress value={filesProgress(done, pending)} />
              {results.slice(-5).map((item) => (
                <p
                  key={item.name}
                  className={
                    item.state === "failed"
                      ? "text-xs text-destructive"
                      : "text-xs text-muted-foreground"
                  }
                >
                  <span className="font-medium">{item.name}:</span> {item.message}
                </p>
              ))}
            </div>
          ) : null}
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
              {pending ? "Importing" : "Import files"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function filesProgress(done: number, pending: boolean) {
  return pending ? Math.min(95, done * 10) : 100;
}
