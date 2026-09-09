import { Badge } from "@portfolio/ui/components/badge";
import { sourceFreshness } from "@portfolio/api/insight-calculations";
import { formatDate } from "@/lib/format";
export function FreshnessBadge({
  asOf,
  maxAgeDays = 31,
}: {
  asOf: string | Date | null | undefined;
  maxAgeDays?: number;
}) {
  const freshness = sourceFreshness(asOf, maxAgeDays);
  return (
    <Badge
      variant="outline"
      className={
        freshness.status === "stale" || freshness.status === "future"
          ? "border-amber-500/50 text-amber-700 dark:text-amber-400"
          : "text-muted-foreground"
      }
      title={`${asOf && freshness.ageDays !== null ? formatDate(asOf) : "Unknown source date"}. Review threshold: ${maxAgeDays} days. This describes source age, not verification or live pricing.`}
    >
      {freshness.label}
    </Badge>
  );
}
