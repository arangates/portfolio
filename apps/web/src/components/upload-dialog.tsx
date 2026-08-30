"use client";

import type { DriveArchiveStatus } from "@/lib/drive-archive-shared";
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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@portfolio/ui/components/field";
import { Input } from "@portfolio/ui/components/input";
import { Spinner } from "@portfolio/ui/components/spinner";
import { UploadIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export function UploadDialog({
  kind,
  title,
  description,
  accept,
  multiple = false,
  triggerLabel = "Import latest export",
}: {
  kind: "zerodha_holdings" | "zerodha_tradebook" | "degiro";
  title: string;
  description: string;
  accept: string;
  multiple?: boolean;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    const selectedFiles = new FormData(event.currentTarget)
      .getAll("files")
      .filter((value): value is File => value instanceof File);
    let completedFiles = 0;
    try {
      const allResults: Array<{
        duplicate: boolean;
        insertedRows: number;
        rowCount: number;
        archive?: { status: DriveArchiveStatus };
      }> = [];
      const groups =
        kind === "zerodha_tradebook" ? selectedFiles.map((file) => [file]) : [selectedFiles];
      for (const [index, group] of groups.entries()) {
        if (groups.length > 1) setMessage(`Processing file ${index + 1} of ${groups.length}…`);
        const body = new FormData();
        body.set("kind", kind);
        for (const file of group) body.append("files", file);
        const response = await fetch("/api/portfolio/imports", { method: "POST", body });
        const result = (await response.json()) as {
          error?: string;
          results?: Array<{
            duplicate: boolean;
            insertedRows: number;
            rowCount: number;
            archive?: { status: DriveArchiveStatus };
          }>;
        };
        if (!response.ok) throw new Error(result.error ?? `Import failed for ${group[0]?.name}`);
        allResults.push(...(result.results ?? []));
        completedFiles += group.length;
      }
      const inserted = allResults.reduce((total, item) => total + item.insertedRows, 0);
      const duplicateFiles = allResults.filter((item) => item.duplicate).length;
      const driveStored = allResults.filter(
        (item) => item.archive?.status === "stored" || item.archive?.status === "already_stored",
      ).length;
      const driveFailed = allResults.filter((item) => item.archive?.status === "failed").length;
      const driveNote =
        driveStored > 0
          ? ` ${driveStored} source file${driveStored === 1 ? " is" : "s are"} safely stored in Google Drive.${driveFailed > 0 ? ` ${driveFailed} archive needs attention.` : ""}`
          : driveFailed > 0
            ? " The financial import succeeded, but the Drive archive needs attention."
            : " Connect Google Drive in Settings to retain exact source files.";
      const duplicate = allResults.length > 0 && duplicateFiles === allResults.length;
      setMessage(
        duplicate
          ? `All selected trade data was imported earlier. No history was duplicated.${driveNote}`
          : kind === "zerodha_tradebook"
            ? `${inserted} unique trades were added from ${allResults.length} file${allResults.length === 1 ? "" : "s"}.${duplicateFiles > 0 ? ` ${duplicateFiles} file${duplicateFiles === 1 ? " was" : "s were"} fully overlapping.` : ""}${driveNote}`
            : `${inserted} new historical rows were added.${driveNote}`,
      );
      router.refresh();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Import failed";
      setError(
        completedFiles > 0
          ? `${completedFiles} file${completedFiles === 1 ? " was" : "s were"} imported before this error: ${message}`
          : message,
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <UploadIcon data-icon="inline-start" />
        {triggerLabel}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-5">
          <FieldGroup>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor={`${kind}-files`}>Export file{multiple ? "s" : ""}</FieldLabel>
              <Input
                id={`${kind}-files`}
                name="files"
                type="file"
                accept={accept}
                multiple={multiple}
                required
                aria-invalid={Boolean(error)}
              />
              <FieldDescription>
                {kind === "zerodha_tradebook"
                  ? "Select up to 10 annual tradebooks. Files are processed one at a time and overlapping trades are deduplicated."
                  : multiple
                    ? "Select both Transactions.csv and Account.csv together. Repeated rows are deduplicated."
                    : "Upload the holdings workbook downloaded from Zerodha Console."}
              </FieldDescription>
              {error ? <FieldError>{error}</FieldError> : null}
              {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
            </Field>
          </FieldGroup>
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
              {pending ? "Importing…" : "Import"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
