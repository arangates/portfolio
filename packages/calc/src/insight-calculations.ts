export type SnapshotEvidence = {
  key: string;
  name: string;
  kind: string;
  href: string;
  currency: string;
  asOf: string;
  createdAt: string;
  value: number | null;
  sourceKey?: string;
  revisionId?: string;
  quantity?: number | null;
  price?: number | null;
  share?: number;
};
export function sourceFreshness(
  asOf: string | Date | null | undefined,
  maxAgeDays: number,
  now = new Date(),
) {
  if (!asOf) return { status: "unknown", ageDays: null, label: "Source date missing" };
  const date = new Date(asOf);
  if (!Number.isFinite(date.getTime()))
    return { status: "unknown", ageDays: null, label: "Source date missing" };
  const day = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const ageDays = Math.floor((day(now) - day(date)) / 86400000);
  if (ageDays < 0) return { status: "future", ageDays, label: "Future-dated source" };
  return {
    status: ageDays > maxAgeDays ? "stale" : "current",
    ageDays,
    label:
      ageDays > maxAgeDays
        ? `Review · ${ageDays} days old`
        : ageDays === 0
          ? "Source dated today"
          : `Source ${ageDays} day${ageDays === 1 ? "" : "s"} old`,
  };
}
export function latestSnapshotRevisions(rows: SnapshotEvidence[]) {
  const revisions = new Map<string, SnapshotEvidence>();
  for (const row of rows)
    if (row.sourceKey) {
      const key = `${row.sourceKey}/${row.asOf}`;
      const previous = revisions.get(key);
      if (
        !previous ||
        row.createdAt > previous.createdAt ||
        (row.createdAt === previous.createdAt &&
          (row.revisionId ?? "") > (previous.revisionId ?? ""))
      )
        revisions.set(key, row);
    }
  return rows.filter(
    (row) =>
      !row.sourceKey ||
      revisions.get(`${row.sourceKey}/${row.asOf}`)?.revisionId === row.revisionId,
  );
}
export function compareSnapshots(evidence: SnapshotEvidence[]) {
  const rows = latestSnapshotRevisions(evidence);
  const dates = new Map<string, string[]>();
  for (const row of rows)
    if (row.sourceKey)
      dates.set(
        row.sourceKey,
        [...new Set([...(dates.get(row.sourceKey) ?? []), row.asOf])].sort().reverse().slice(0, 2),
      );
  const groups = new Map<string, SnapshotEvidence[]>();
  for (const row of rows) {
    const group = groups.get(row.key) ?? [];
    group.push(row);
    groups.set(row.key, group);
  }
  return [...groups.values()]
    .map((group) => {
      const ordered = group.toSorted(
        (a, b) => b.asOf.localeCompare(a.asOf) || b.createdAt.localeCompare(a.createdAt),
      );
      const current = ordered[0]!;
      const previous =
        ordered.find(
          (row) =>
            row.asOf !== current.asOf &&
            (!current.sourceKey || row.asOf === dates.get(current.sourceKey)?.[1]),
        ) ?? null;
      const reason = !previous
        ? "A previous dated snapshot is needed."
        : previous.currency !== current.currency
          ? "Currency changed; a native-currency comparison is unavailable."
          : current.value === null ||
              previous.value === null ||
              !Number.isFinite(current.value) ||
              !Number.isFinite(previous.value)
            ? "A recorded valuation is missing."
            : null;
      const delta = reason === null ? current.value! - previous!.value! : null;
      const percent = delta === null || !previous?.value ? null : delta / Math.abs(previous.value);
      const drivers: Array<{ label: string; amount: number }> = [];
      if (
        delta !== null &&
        previous &&
        current.quantity != null &&
        previous.quantity != null &&
        current.price != null &&
        previous.price != null
      ) {
        const oldShare = previous.share ?? 1,
          newShare = current.share ?? 1;
        drivers.push({
          label: "Quantity / area",
          amount: (current.quantity - previous.quantity) * previous.price * oldShare,
        });
        drivers.push({
          label: "Price",
          amount: current.quantity * (current.price - previous.price) * oldShare,
        });
        drivers.push({
          label: "Ownership share",
          amount: current.quantity * current.price * (newShare - oldShare),
        });
        const residual = delta - drivers.reduce((sum, row) => sum + row.amount, 0);
        if (Math.abs(residual) > 0.01)
          drivers.push({ label: "Other recorded valuation differences", amount: residual });
      }
      return { current, previous, delta, percent, reason, drivers };
    })
    .filter(
      (row) => !row.current.sourceKey || row.current.asOf === dates.get(row.current.sourceKey)?.[0],
    )
    .sort((a, b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0));
}
