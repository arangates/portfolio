import { ArchiveRecordButton } from "@/components/archive-record-button";
import { EmptyDataState } from "@/components/empty-data-state";
import { PageHeader } from "@/components/page-header";
import { PortfolioRecordDialog } from "@/components/portfolio-record-dialog";
import { SectionCards } from "@/components/section-cards";
import { TableCard } from "@/components/table-card";
import { formatCurrency, formatPercent } from "@/lib/format";
import { getCommodityHoldings } from "@zerodha-coin/api/portfolio-queries";
import { auth } from "@zerodha-coin/auth";
import { Badge } from "@zerodha-coin/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@zerodha-coin/ui/components/table";
import { CoinsIcon, GemIcon, ScaleIcon, WarehouseIcon } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function CommoditiesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const holdings = await getCommodityHoldings(session.user.id);
  const inrValue = holdings
    .filter((item) => item.currency === "INR")
    .reduce((sum, item) => sum + item.value, 0);
  const ownedGold = holdings
    .filter((item) => item.commodityType.toLowerCase().includes("gold"))
    .reduce((sum, item) => sum + item.quantityGrams * item.ownershipShare, 0);
  const ownedSilver = holdings
    .filter((item) => item.commodityType.toLowerCase().includes("silver"))
    .reduce((sum, item) => sum + item.quantityGrams * item.ownershipShare, 0);
  const locations = new Set(holdings.map((item) => item.location).filter(Boolean));

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <PageHeader
          title="Commodities"
          description="Physical inventory with dated prices, ownership shares and custody locations."
          action={
            <PortfolioRecordDialog
              kind="commodity"
              values={{ currency: "INR", ownershipShare: 100 }}
            />
          }
        />
        {holdings.length === 0 ? (
          <div className="px-4 lg:px-6">
            <EmptyDataState
              icon={CoinsIcon}
              title="No commodities"
              description="Add gold, silver or another physical holding to begin valuation history."
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
                  label: "INR commodity value",
                  value: formatCurrency(inrValue, "INR"),
                  badge: `${holdings.length} holdings`,
                  note: "Ownership-adjusted latest value",
                  detail: "Other currencies remain in native values",
                  icon: CoinsIcon,
                },
                {
                  label: "Owned gold",
                  value: `${ownedGold.toLocaleString("en-IN")} g`,
                  badge: "Net ownership",
                  note: "Gross grams × ownership share",
                  detail: "Across all gold records",
                  icon: GemIcon,
                },
                {
                  label: "Owned silver",
                  value: `${ownedSilver.toLocaleString("en-IN")} g`,
                  badge: "Net ownership",
                  note: "Gross grams × ownership share",
                  detail: "Across all silver records",
                  icon: ScaleIcon,
                },
                {
                  label: "Custody locations",
                  value: locations.size.toLocaleString("en"),
                  badge: "Inventory",
                  note: "Distinct recorded locations",
                  detail: "Useful for physical custody review",
                  icon: WarehouseIcon,
                },
              ]}
            />
            <div className="px-4 lg:px-6">
              <TableCard
                title="Commodity inventory"
                description="Latest account-owned snapshot per holding."
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Holding</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Gross grams</TableHead>
                      <TableHead className="text-right">Share</TableHead>
                      <TableHead className="text-right">Rate / g</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="w-24">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holdings.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.commodityType}</Badge>
                        </TableCell>
                        <TableCell>{item.location ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {item.quantityGrams.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPercent(item.ownershipShare, 0)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(item.pricePerGram, item.currency)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(item.value, item.currency)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <PortfolioRecordDialog
                              compact
                              kind="commodity"
                              values={{
                                ...item,
                                ownershipShare: item.ownershipShare * 100,
                                asOf: item.asOf.toISOString().slice(0, 10),
                              }}
                            />
                            <ArchiveRecordButton kind="commodity" id={item.id} label={item.name} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
