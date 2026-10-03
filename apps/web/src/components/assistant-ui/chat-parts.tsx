"use client";

import { Button } from "@portfolio/ui/components/button";
import { cn } from "@portfolio/ui/lib/utils";
import {
  BrainIcon,
  CheckIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  FileTextIcon,
  LinkIcon,
  ShieldQuestionIcon,
  XIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useState, type FC, type ReactNode } from "react";

const sectionLabels: Record<string, string> = {
  fire: "FIRE plan and retirement scenarios",
  household: "household budget and expenses",
  personal_cash_flow: "personal cash flow records",
  joint_cash_flow: "joint household cash flow",
  fixed_deposits: "fixed deposit records",
  salary: "salary and payslip data",
  verified_returns: "verified investment returns",
  global_equity: "global equity holdings",
};

const HIDDEN_KEYS = new Set(["source", "retrievedAt", "configured"]);

function humanize(key: string) {
  const spaced = key.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function formatScalar(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(2);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

const isScalar = (value: unknown) =>
  value === null || ["string", "number", "boolean"].includes(typeof value);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function RecordTable({ rows }: { rows: Record<string, unknown>[] }) {
  const columns = Object.keys(rows[0] ?? {})
    .filter((key) => rows.some((row) => isScalar(row[key])))
    .slice(0, 5);
  if (columns.length === 0) return null;
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-xs">
        <thead className="bg-muted/40 text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-2.5 py-1.5 font-medium">
                {humanize(column)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 6).map((row, index) => (
            <tr key={index} className="border-t">
              {columns.map((column) => (
                <td key={column} className="px-2.5 py-1.5 tabular-nums">
                  {formatScalar(row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Generative UI: renders a structured tool result as stat tiles and tables.
function ToolResultView({ result }: { result: unknown }) {
  if (!isRecord(result)) return null;
  const stats = Object.entries(result).filter(
    ([key, value]) => !HIDDEN_KEYS.has(key) && isScalar(value) && value !== null,
  );
  const tables = Object.entries(result).filter(
    (entry): entry is [string, Record<string, unknown>[]] =>
      Array.isArray(entry[1]) && entry[1].length > 0 && entry[1].every(isRecord),
  );
  const nested = Object.entries(result).filter(
    (entry): entry is [string, Record<string, unknown>] =>
      isRecord(entry[1]) && Object.values(entry[1]).some(isScalar),
  );
  if (!stats.length && !tables.length && !nested.length) return null;
  return (
    <div className="flex flex-col gap-3 border-t px-3 py-3">
      {stats.length > 0 && (
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {stats.slice(0, 9).map(([key, value]) => (
            <div key={key} className="min-w-0 rounded-lg bg-muted/40 px-2.5 py-2">
              <dt className="truncate text-[11px] text-muted-foreground">{humanize(key)}</dt>
              <dd className="truncate text-sm font-medium tabular-nums">{formatScalar(value)}</dd>
            </div>
          ))}
        </dl>
      )}
      {nested.slice(0, 2).map(([key, value]) => (
        <div key={key} className="flex flex-col gap-1.5">
          <p className="text-[11px] font-medium text-muted-foreground">{humanize(key)}</p>
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Object.entries(value)
              .filter(([, v]) => isScalar(v) && v !== null)
              .slice(0, 6)
              .map(([k, v]) => (
                <div key={k} className="min-w-0 rounded-lg bg-muted/40 px-2.5 py-2">
                  <dt className="truncate text-[11px] text-muted-foreground">{humanize(k)}</dt>
                  <dd className="truncate text-sm font-medium tabular-nums">{formatScalar(v)}</dd>
                </div>
              ))}
          </dl>
        </div>
      ))}
      {tables.slice(0, 2).map(([key, rows]) => (
        <div key={key} className="flex flex-col gap-1.5">
          <p className="text-[11px] font-medium text-muted-foreground">{humanize(key)}</p>
          <RecordTable rows={rows} />
        </div>
      ))}
    </div>
  );
}

type ToolPart = {
  toolName: string;
  args?: unknown;
  result?: unknown;
  isError?: boolean;
  status: { type: string };
  approval?: { id: string; approved?: boolean; resolution?: string };
  respondToApproval?: (response: { approved: boolean }) => Promise<void>;
};

export const ToolCard: FC<{ part: ToolPart }> = ({ part }) => {
  const [open, setOpen] = useState(true);
  const [pending, setPending] = useState(false);
  const args = (part.args ?? {}) as Record<string, unknown>;
  const section = typeof args.section === "string" ? args.section : "";
  const label =
    part.toolName === "getFinancialSection"
      ? (sectionLabels[section] ?? "your latest Selvam records")
      : part.toolName;
  const awaitingApproval =
    part.approval !== undefined &&
    part.approval.approved === undefined &&
    !part.approval.resolution &&
    part.result === undefined;
  const denied = part.approval?.approved === false;
  const running = !denied && !awaitingApproval && part.result === undefined && !part.isError;
  const source =
    isRecord(part.result) && typeof part.result.source === "string" ? part.result.source : null;

  async function respond(approved: boolean) {
    if (!part.respondToApproval) return;
    setPending(true);
    try {
      await part.respondToApproval({ approved });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="my-2 overflow-hidden rounded-xl border bg-muted/25 text-xs">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-muted-foreground transition-colors hover:text-foreground"
      >
        {awaitingApproval ? (
          <ShieldQuestionIcon className="size-3.5 text-amber-500" aria-hidden="true" />
        ) : denied || part.isError ? (
          <XIcon className="size-3.5 text-destructive" aria-hidden="true" />
        ) : running ? (
          <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <CheckIcon className="size-3.5 text-emerald-500" aria-hidden="true" />
        )}
        <span className="min-w-0 flex-1 truncate">
          {awaitingApproval
            ? `Approval needed to read ${label}`
            : denied
              ? `Access denied for ${label}`
              : part.isError
                ? `Could not read ${label}`
                : `${running ? "Checking" : "Checked"} ${label}`}
        </span>
        <ChevronDownIcon
          className={cn("size-3.5 transition-transform duration-150", !open && "-rotate-90")}
          aria-hidden="true"
        />
      </button>
      {awaitingApproval && (
        <div className="flex flex-wrap items-center gap-2 border-t px-3 py-2.5">
          <p className="min-w-0 flex-1 text-muted-foreground">
            Selvam wants to read this sensitive data to answer your question.
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => void respond(false)}
          >
            Deny
          </Button>
          <Button size="sm" disabled={pending} onClick={() => void respond(true)}>
            Allow
          </Button>
        </div>
      )}
      {open && !awaitingApproval && <ToolResultView result={part.result} />}
      {open && source && (
        <div className="border-t px-3 py-2">
          <Link
            href={source as Route}
            className="inline-flex items-center gap-1 text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            <ExternalLinkIcon className="size-3" aria-hidden="true" />
            Open source records
          </Link>
        </div>
      )}
    </div>
  );
};

export const ReasoningBlock: FC<{ text: string; running: boolean }> = ({ text, running }) => (
  <details
    open={running || undefined}
    className="group my-2 rounded-xl border bg-muted/25 px-3 py-2 text-xs text-muted-foreground"
  >
    <summary className="flex cursor-pointer list-none items-center gap-2 select-none">
      <BrainIcon className={cn("size-3.5", running && "animate-pulse")} aria-hidden="true" />
      <span className="font-medium text-foreground">
        {running ? "Thinking…" : "Thought process"}
      </span>
      <ChevronDownIcon
        className="ml-auto size-3.5 transition-transform duration-150 group-open:rotate-180"
        aria-hidden="true"
      />
    </summary>
    <p className="mt-2 leading-relaxed whitespace-pre-wrap">{text}</p>
  </details>
);

export const SourceChip: FC<{ url?: string; title?: string; id: string }> = ({
  url,
  title,
  id,
}) => {
  const label = title || (url ? (/^https?:/.test(url) ? new URL(url).hostname : url) : id);
  const content: ReactNode = (
    <>
      <LinkIcon className="size-3 shrink-0" aria-hidden="true" />
      <span className="max-w-48 truncate">{label}</span>
    </>
  );
  const className =
    "my-1 mr-1.5 inline-flex items-center gap-1 rounded-full border bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground";
  if (!url) return <span className={className}>{content}</span>;
  return /^https?:/.test(url) ? (
    <a href={url} target="_blank" rel="noreferrer noopener" className={className}>
      {content}
    </a>
  ) : (
    <Link href={url as Route} className={className}>
      {content}
    </Link>
  );
};

export const FileChip: FC<{ name?: string; mimeType?: string; data?: string }> = ({
  name,
  mimeType,
  data,
}) =>
  mimeType?.startsWith("image/") && data ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={data}
      alt={name ?? "Attached image"}
      className="max-h-48 max-w-full rounded-xl border object-contain"
    />
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-lg border bg-muted/30 px-2.5 py-1 text-xs">
      <FileTextIcon className="size-3.5" aria-hidden="true" />
      <span className="max-w-48 truncate">{name ?? "Attachment"}</span>
    </span>
  );
