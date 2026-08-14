"use client";

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
import { Progress } from "@portfolio/ui/components/progress";
import { Spinner } from "@portfolio/ui/components/spinner";
import { FilesIcon, UploadIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

type UploadResult = {
  fileName: string;
  status: "imported" | "duplicate" | "failed";
  message: string;
};

const MAX_FILES = 50;
const MAX_FILE_SIZE = 4 * 1024 * 1024;
const CONCURRENCY = 3;

async function uploadFile(file: File): Promise<UploadResult> {
  const body = new FormData();
  body.set("file", file);
  try {
    const response = await fetch("/api/salary/imports", { method: "POST", body });
    const payload = (await response.json()) as {
      error?: string;
      result?: { duplicate: boolean; periodLabel: string; validationStatus: string };
    };
    if (!response.ok || !payload.result) {
      throw new Error(payload.error ?? "Import failed");
    }
    return {
      fileName: file.name,
      status: payload.result.duplicate ? "duplicate" : "imported",
      message: payload.result.duplicate
        ? `${payload.result.periodLabel} was already imported.`
        : `${payload.result.periodLabel} imported and ${payload.result.validationStatus.replace("_", " ")}.`,
    };
  } catch (error) {
    return {
      fileName: file.name,
      status: "failed",
      message: error instanceof Error ? error.message : "Import failed",
    };
  }
}

export function SalaryUploadDialog() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [results, setResults] = useState<UploadResult[]>([]);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const files = Array.from(new FormData(form).getAll("files")).filter(
      (value): value is File => value instanceof File && value.size > 0,
    );
    setError(null);
    setResults([]);
    if (files.length === 0) return setError("Select at least one PDF payslip.");
    if (files.length > MAX_FILES) return setError(`Select no more than ${MAX_FILES} PDFs.`);
    const invalid = files.find(
      (file) => !file.name.toLowerCase().endsWith(".pdf") || file.size > MAX_FILE_SIZE,
    );
    if (invalid) return setError(`${invalid.name} must be a PDF smaller than 4 MB.`);

    setPending(true);
    setCompleted(0);
    setTotal(files.length);
    const collected: UploadResult[] = [];
    for (let index = 0; index < files.length; index += CONCURRENCY) {
      const batch = await Promise.all(files.slice(index, index + CONCURRENCY).map(uploadFile));
      collected.push(...batch);
      setResults([...collected]);
      setCompleted(collected.length);
    }
    setPending(false);
    if (collected.some((result) => result.status !== "failed")) {
      form.reset();
      router.refresh();
    }
  }

  const imported = results.filter((result) => result.status === "imported").length;
  const duplicates = results.filter((result) => result.status === "duplicate").length;
  const failed = results.filter((result) => result.status === "failed").length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <UploadIcon data-icon="inline-start" />
        Import payslips
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import salary history</DialogTitle>
          <DialogDescription>
            Select up to 50 PDF payslips. Files are processed individually with duplicate detection.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-5">
          <FieldGroup>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="salary-files">PDF payslips</FieldLabel>
              <Input
                id="salary-files"
                name="files"
                type="file"
                accept=".pdf,application/pdf"
                multiple
                required
                disabled={pending}
                aria-invalid={Boolean(error)}
              />
              <FieldDescription>
                Maximum 50 files and 4 MB per PDF. Exact duplicates are skipped automatically.
              </FieldDescription>
              {error ? <FieldError>{error}</FieldError> : null}
            </Field>
          </FieldGroup>
          {total > 0 ? (
            <div className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <FilesIcon className="size-4" />
                  {pending ? "Processing payslips" : "Import complete"}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {completed}/{total}
                </span>
              </div>
              <Progress value={total === 0 ? 0 : (completed / total) * 100} />
              {!pending ? (
                <p className="text-xs text-muted-foreground">
                  {imported} imported · {duplicates} duplicates · {failed} failed
                </p>
              ) : null}
              {results.filter((result) => result.status === "failed").length > 0 ? (
                <div className="space-y-1 text-xs text-destructive">
                  {results
                    .filter((result) => result.status === "failed")
                    .slice(0, 3)
                    .map((result) => (
                      <p key={result.fileName} className="truncate">
                        {result.fileName}: {result.message}
                      </p>
                    ))}
                </div>
              ) : null}
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
              {pending ? `Processing ${completed}/${total}` : "Import PDFs"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
