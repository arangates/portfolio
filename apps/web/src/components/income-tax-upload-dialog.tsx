"use client";

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
const MAX_FILES = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const CONCURRENCY = 3;

async function uploadFile(file: File): Promise<UploadResult> {
  const body = new FormData();
  body.set("file", file);
  try {
    const response = await fetch("/api/tax/imports", { method: "POST", body });
    const payload = (await response.json()) as {
      error?: string;
      result?: {
        duplicate: boolean;
        assessmentYearLabel: string;
        formType: string;
        validationStatus: string;
        archive?: { status: DriveArchiveStatus };
      };
    };
    if (!response.ok || !payload.result) throw new Error(payload.error ?? "Import failed");
    const label = `AY ${payload.result.assessmentYearLabel} ${payload.result.formType}`;
    return {
      fileName: file.name,
      status: payload.result.duplicate ? "duplicate" : "imported",
      message:
        (payload.result.duplicate
          ? `${label} was already imported.`
          : `${label} imported and ${payload.result.validationStatus.replace("_", " ")}.`) +
        driveArchiveResultText(payload.result.archive?.status),
    };
  } catch (error) {
    return {
      fileName: file.name,
      status: "failed",
      message: error instanceof Error ? error.message : "Import failed",
    };
  }
}

export function IncomeTaxUploadDialog() {
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
    if (files.length === 0) return setError("Select at least one ITR JSON file.");
    if (files.length > MAX_FILES) return setError(`Select no more than ${MAX_FILES} files.`);
    const invalid = files.find(
      (file) => !file.name.toLowerCase().endsWith(".json") || file.size > MAX_FILE_SIZE,
    );
    if (invalid) return setError(`${invalid.name} must be a JSON file smaller than 10 MB.`);

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
        Import ITR JSON
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import Indian income-tax history</DialogTitle>
          <DialogDescription>
            Select ITR-2 or ITR-3 JSON exports. Each year is normalized and reconciled
            independently.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-5">
          <FieldGroup>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="income-tax-files">ITR JSON files</FieldLabel>
              <Input
                id="income-tax-files"
                name="files"
                type="file"
                accept=".json,application/json"
                multiple
                required
                disabled={pending}
                aria-invalid={Boolean(error)}
              />
              <FieldDescription>
                Maximum 20 files and 10 MB each. Exact duplicates are skipped. When Drive archive is
                enabled, the exact JSON stays in your private Selvam folder.
              </FieldDescription>
              {error ? <FieldError>{error}</FieldError> : null}
            </Field>
          </FieldGroup>
          {total > 0 ? (
            <div className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <FilesIcon className="size-4" />
                  {pending ? "Processing returns" : "Import complete"}
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
              {results
                .filter((result) => result.status === "failed")
                .slice(0, 3)
                .map((result) => (
                  <p key={result.fileName} className="truncate text-xs text-destructive">
                    {result.fileName}: {result.message}
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
              {pending ? `Processing ${completed}/${total}` : "Import JSON"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
