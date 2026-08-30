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

type TaxpayerOption = { id: string | null; name: string; relationship: string };
type UploadResult = {
  fileName: string;
  status: "imported" | "duplicate" | "failed";
  message: string;
};
const MAX_FILES = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const CONCURRENCY = 3;

async function uploadFile(file: File, taxpayerMemberId: string): Promise<UploadResult> {
  const body = new FormData();
  body.set("file", file);
  body.set("taxpayerMemberId", taxpayerMemberId);
  try {
    const response = await fetch("/api/tax/netherlands/imports", { method: "POST", body });
    const payload = (await response.json()) as {
      error?: string;
      result?: {
        duplicate: boolean;
        taxYear: number;
        outcomeType: string;
        settlementAmount: number;
        validationStatus: string;
        archive?: { status: DriveArchiveStatus };
      };
    };
    if (!response.ok || !payload.result) throw new Error(payload.error ?? "Import failed");
    return {
      fileName: file.name,
      status: payload.result.duplicate ? "duplicate" : "imported",
      message:
        (payload.result.duplicate
          ? `${payload.result.taxYear} was already imported.`
          : `${payload.result.taxYear} imported and ${payload.result.validationStatus.replace("_", " ")}.`) +
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

export function NetherlandsTaxUploadDialog({ taxpayers }: { taxpayers: TaxpayerOption[] }) {
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
    const formData = new FormData(form);
    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File && value.size > 0);
    const taxpayerMemberId = String(formData.get("taxpayerMemberId") ?? "owner");
    setError(null);
    setResults([]);
    if (files.length === 0) return setError("Select at least one final-assessment PDF.");
    if (files.length > MAX_FILES) return setError(`Select no more than ${MAX_FILES} files.`);
    const invalid = files.find(
      (file) => !file.name.toLowerCase().endsWith(".pdf") || file.size > MAX_FILE_SIZE,
    );
    if (invalid) return setError(`${invalid.name} must be a PDF smaller than 10 MB.`);

    setPending(true);
    setCompleted(0);
    setTotal(files.length);
    const collected: UploadResult[] = [];
    for (let index = 0; index < files.length; index += CONCURRENCY) {
      const batch = await Promise.all(
        files.slice(index, index + CONCURRENCY).map((file) => uploadFile(file, taxpayerMemberId)),
      );
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
        Import assessments
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import Dutch final assessments</DialogTitle>
          <DialogDescription>
            Select final income-tax assessments belonging to one taxpayer. Import another family
            member separately.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-5">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="nl-tax-taxpayer">Taxpayer</FieldLabel>
              <select
                id="nl-tax-taxpayer"
                name="taxpayerMemberId"
                defaultValue="owner"
                disabled={pending}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
              >
                {taxpayers.map((taxpayer) => (
                  <option key={taxpayer.id ?? "owner"} value={taxpayer.id ?? "owner"}>
                    {taxpayer.name} · {taxpayer.relationship}
                  </option>
                ))}
              </select>
              <FieldDescription>
                The selected taxpayer is applied to every PDF in this batch.
              </FieldDescription>
            </Field>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="nl-tax-files">Definitieve aanslag PDFs</FieldLabel>
              <Input
                id="nl-tax-files"
                name="files"
                type="file"
                accept=".pdf,application/pdf"
                multiple
                required
                disabled={pending}
                aria-invalid={Boolean(error)}
              />
              <FieldDescription>
                Maximum 20 files and 10 MB each. Exact duplicates are skipped. When Drive archive is
                enabled, the exact PDF stays in your private Selvam folder.
              </FieldDescription>
              {error ? <FieldError>{error}</FieldError> : null}
            </Field>
          </FieldGroup>
          {total > 0 ? (
            <div className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <FilesIcon className="size-4" />
                  {pending ? "Processing assessments" : "Import complete"}
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
              {pending ? `Processing ${completed}/${total}` : "Import PDFs"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
