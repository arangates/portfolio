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
}: {
  kind: "zerodha_holdings" | "degiro";
  title: string;
  description: string;
  accept: string;
  multiple?: boolean;
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
    const body = new FormData(event.currentTarget);
    body.set("kind", kind);
    try {
      const response = await fetch("/api/portfolio/imports", { method: "POST", body });
      const result = (await response.json()) as {
        error?: string;
        results?: Array<{ duplicate: boolean; insertedRows: number; rowCount: number }>;
      };
      if (!response.ok) throw new Error(result.error ?? "Import failed");
      const inserted = result.results?.reduce((total, item) => total + item.insertedRows, 0) ?? 0;
      const duplicate = result.results?.every((item) => item.duplicate) ?? false;
      setMessage(
        duplicate
          ? "This exact export was imported earlier. No history was duplicated."
          : `${inserted} new historical rows were added. The source files and raw rows were archived.`,
      );
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
        Import latest export
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
                {multiple
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
