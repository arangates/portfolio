import { ArchiveRecordButton } from "@/components/archive-record-button";
import { CommodityInventoryArchiveButton } from "@/components/commodity-inventory-archive-button";
import { CommodityInventoryDialog } from "@/components/commodity-inventory-dialog";
import { EmptyDataState } from "@/components/empty-data-state";
import { PageHeader } from "@/components/page-header";
import { PortfolioRecordDialog } from "@/components/portfolio-record-dialog";
import { SectionCards } from "@/components/section-cards";
import { TableCard } from "@/components/table-card";
import { formatCurrency, formatPercent } from "@/lib/format";
import { getCommodityInventoryDashboard } from "@portfolio/api/commodity-inventory";
import { getCommodityHoldings } from "@portfolio/api/portfolio-queries";
import { auth } from "@portfolio/auth";
import { Badge } from "@portfolio/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@portfolio/ui/components/table";
import { AlertTriangleIcon, CoinsIcon, GemIcon, ScaleIcon } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const grams = (value: number | null) =>
  value == null ? "—" : `${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })} g`;
const statusLabel: Record<string, string> = {
  reconciled: "Reconciled",
  incomplete: "Incomplete",
  "over-allocated": "Over allocated",
  "not-itemized": "Not itemized",
  "no-declared-total": "No declared total",
};

export default async function CommoditiesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const [holdings, inventory] = await Promise.all([
    getCommodityHoldings(session.user.id),
    getCommodityInventoryDashboard(session.user.id),
  ]);
  const holdingOptions = inventory.holdings.map(({ id, name, commodityType }) => ({
    id,
    name,
    commodityType,
  }));
  const inrValue = holdings
    .filter((item) => item.currency === "INR")
    .reduce((sum, item) => sum + item.value, 0);
  const goldItems = inventory.items.filter((item) =>
    item.commodityType.toLowerCase().includes("gold"),
  );
  const silverItems = inventory.items.filter((item) =>
    item.commodityType.toLowerCase().includes("silver"),
  );
  const goldItemized = goldItems.reduce((sum, item) => sum + (item.grossWeightGrams ?? 0), 0);
  const silverItemized = silverItems.reduce((sum, item) => sum + (item.grossWeightGrams ?? 0), 0);
  const unresolved = inventory.reconciliation.filter(
    (item) => item.status !== "reconciled" && item.status !== "no-declared-total",
  ).length;

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <PageHeader
          title="Commodities"
          description="Declared holdings, physical item provenance and conservative FIRE treatment in one auditable view."
          action={
            <div className="flex flex-wrap gap-2">
              <CommodityInventoryDialog
                holdings={holdingOptions}
                values={{ itemCount: 1, countUnit: "piece" }}
              />
              <PortfolioRecordDialog
                kind="commodity"
                values={{ currency: "INR", ownershipShare: 100 }}
              />
            </div>
          }
        />
        {holdings.length === 0 && inventory.items.length === 0 ? (
          <div className="px-4 lg:px-6">
            <EmptyDataState
              icon={CoinsIcon}
              title="No commodities"
              description="Add a declared commodity holding, then record the physical items beneath it."
              action={
                <PortfolioRecordDialog
                  kind="commodity"
                  values={{ currency: "INR", ownershipShare: 100 }}
                />
              }
            />
          </div>
        ) : (
          <>
            <SectionCards
              items={[
                {
                  label: "Declared commodity value",
                  value: formatCurrency(inrValue, "INR"),
                  badge: `${holdings.length} valued holdings`,
                  note: "Latest ownership-adjusted totals",
                  detail: "Inventory detail is never added a second time",
                  icon: CoinsIcon,
                },
                {
                  label: "Itemized gold",
                  value: grams(goldItemized),
                  badge: "Gross recorded weight",
                  note: `${goldItems.length} item records`,
                  detail: "Purity remains unknown until verified",
                  icon: GemIcon,
                },
                {
                  label: "Itemized silver",
                  value: grams(silverItemized),
                  badge: "Gross recorded weight",
                  note: `${silverItems.length} item records`,
                  detail: "Compared with the declared holding below",
                  icon: ScaleIcon,
                },
                {
                  label: "Reconciliation attention",
                  value: unresolved.toLocaleString("en"),
                  badge: `${inventory.metrics.itemRecords} inventory records`,
                  note: `${inventory.metrics.missingWeight} without weight · ${inventory.metrics.missingPurity} without purity`,
                  detail: `${inventory.metrics.fireEligibleItems} explicitly FIRE eligible`,
                  icon: AlertTriangleIcon,
                },
              ]}
            />
            <div className="grid gap-4 px-4 lg:px-6">
              <TableCard
                title="Declared totals and reconciliation"
                description="The declared holding drives net worth. Itemized weights explain it and expose gaps without duplicating value."
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Holding</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Declared</TableHead>
                      <TableHead className="text-right">Itemized</TableHead>
                      <TableHead className="text-right">Gap</TableHead>
                      <TableHead className="text-right">Coverage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-24">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.reconciliation.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-muted-foreground text-xs">
                            {item.location ?? "No location"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.commodityType}</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {grams(item.quantityGrams)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {grams(item.itemizedGrossGrams)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {grams(item.gapGrams)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {item.coveragePercent == null
                            ? "—"
                            : `${item.coveragePercent.toFixed(1)}%`}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.status === "reconciled" ? "default" : "outline"}>
                            {statusLabel[item.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            {item.quantityGrams != null ? (
                              <PortfolioRecordDialog
                                compact
                                kind="commodity"
                                values={{
                                  ...item,
                                  ownershipShare: (item.ownershipShare ?? 0) * 100,
                                  asOf: item.asOf?.toISOString().slice(0, 10),
                                }}
                              />
                            ) : null}
                            <ArchiveRecordButton kind="commodity" id={item.id} label={item.name} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableCard>
              <TableCard
                title="Physical item inventory"
                description="Each edit appends or updates a dated measurement. Blank values mean unknown—not zero."
                action={
                  <div className="px-6 pt-2">
                    <CommodityInventoryDialog
                      holdings={holdingOptions}
                      values={{ itemCount: 1, countUnit: "piece" }}
                    />
                  </div>
                }
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Holding</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead className="text-right">Gross weight</TableHead>
                      <TableHead className="text-right">Purity</TableHead>
                      <TableHead className="text-right">Ownership</TableHead>
                      <TableHead>Provenance</TableHead>
                      <TableHead>FIRE</TableHead>
                      <TableHead className="w-24">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-muted-foreground text-xs">
                            {item.location ?? "Location not set"} · {item.historyCount} snapshot
                            {item.historyCount === 1 ? "" : "s"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.commodityType}</Badge>
                        </TableCell>
                        <TableCell>
                          {item.itemCount.toLocaleString("en-IN")} {item.countUnit}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {grams(item.grossWeightGrams)}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.purityFraction == null
                            ? "Unknown"
                            : formatPercent(item.purityFraction, 1)}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.ownershipShare == null
                            ? "Unknown"
                            : formatPercent(item.ownershipShare, 0)}
                        </TableCell>
                        <TableCell className="max-w-56 whitespace-normal">
                          {item.provenance ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.fireEligibleValue != null ? "default" : "outline"}>
                            {item.fireEligibleValue != null && item.valuationCurrency
                              ? formatCurrency(item.fireEligibleValue, item.valuationCurrency)
                              : item.eligibleForFire
                                ? "Needs valuation"
                                : "Excluded"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <CommodityInventoryDialog
                              compact
                              holdings={holdingOptions}
                              values={{
                                ...item,
                                purityPercent:
                                  item.purityFraction == null ? null : item.purityFraction * 100,
                                ownershipPercent:
                                  item.ownershipShare == null ? null : item.ownershipShare * 100,
                                liquidationPercent:
                                  item.liquidationFactor == null
                                    ? null
                                    : item.liquidationFactor * 100,
                                asOf: item.asOf?.toISOString().slice(0, 10),
                              }}
                            />
                            <CommodityInventoryArchiveButton id={item.id} label={item.name} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {inventory.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-muted-foreground h-24 text-center">
                          No item-level inventory yet.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </TableCard>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
