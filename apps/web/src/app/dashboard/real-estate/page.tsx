import { ArchiveRecordButton } from "@/components/archive-record-button";
import { EmptyDataState } from "@/components/empty-data-state";
import { PageHeader } from "@/components/page-header";
import { PortfolioRecordDialog } from "@/components/portfolio-record-dialog";
import { RealEstateCharts } from "@/components/real-estate-charts";
import { SectionCards } from "@/components/section-cards";
import { TableCard } from "@/components/table-card";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { getRealEstateDashboard } from "@portfolio/api/portfolio-queries";
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
import { Building2Icon, FileCheck2Icon, MapIcon, RulerIcon } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function RealEstatePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const dashboard = await getRealEstateDashboard(session.user.id);
  const { properties, allocation, history, totals, preference, currencies, missingCurrencies } =
    dashboard;
  const currency = preference.baseCurrency;
  const conversionDetail =
    missingCurrencies.length > 0
      ? `Missing rates for ${missingCurrencies.join(", ")}`
      : currencies.length > 1
        ? `${currencies.join(" + ")} converted to ${currency}`
        : `All current valuations in ${currency}`;

  return (
    <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
      <div className="flex flex-col gap-4 py-4 sm:py-5 md:gap-5 md:py-6">
        <PageHeader
          title="Real estate"
          description="Property identity, land area, ownership, legal status and valuation are tracked as account-scoped historical snapshots."
          action={<PortfolioRecordDialog kind="real_estate" values={{ currency }} />}
        />
        {properties.length === 0 ? (
          <div className="px-4 lg:px-6">
            <EmptyDataState
              icon={Building2Icon}
              title="No properties"
              description="Add a property to start a durable valuation history in Selvam."
              action={<PortfolioRecordDialog kind="real_estate" values={{ currency }} />}
            />
          </div>
        ) : (
          <>
            <SectionCards
              items={[
                {
                  label: "Attributable value",
                  value: formatCurrency(totals.ownedValue, currency),
                  badge: `${properties.length} properties`,
                  note: "Your ownership-adjusted value",
                  detail: conversionDetail,
                  icon: Building2Icon,
                },
                {
                  label: "Gross market value",
                  value: formatCurrency(totals.grossValue, currency),
                  badge: formatPercent(
                    totals.grossValue === 0 ? 0 : totals.ownedValue / totals.grossValue,
                    1,
                  ),
                  note: "Full value before ownership allocation",
                  detail: "Badge shows the attributable share",
                  icon: MapIcon,
                },
                {
                  label: "Attributable area",
                  value: `${totals.ownedAreaSquareFeet.toLocaleString("en-IN", { maximumFractionDigits: 0 })} sq. ft.`,
                  badge: `${totals.ownedAreaCents.toLocaleString("en-IN", { maximumFractionDigits: 1 })} cents`,
                  note: "Area weighted by ownership share",
                  detail: "Cents and square feet stay synchronized",
                  icon: RulerIcon,
                },
                {
                  label: "Legal verification",
                  value: `${totals.verified} of ${properties.length} verified`,
                  badge: `${totals.pending} pending · ${totals.unknown} unknown`,
                  note: "Documentation confidence",
                  detail: "Unverified valuations remain provisional",
                  icon: FileCheck2Icon,
                },
              ]}
            />
            <RealEstateCharts allocation={allocation} history={history} currency={currency} />
            <div className="px-4 lg:px-6">
              <TableCard
                title="Property register"
                description="Latest property snapshot; every update retains the earlier valuation."
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Area</TableHead>
                      <TableHead className="text-right">Share</TableHead>
                      <TableHead>Legal</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="w-24">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {properties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell>
                          <div className="font-medium">{property.name}</div>
                          <div className="text-xs text-muted-foreground">
                            As of {formatDate(property.asOf)}
                          </div>
                        </TableCell>
                        <TableCell>{property.owner}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{property.propertyType}</Badge>
                        </TableCell>
                        <TableCell className="max-w-48 truncate">
                          {property.location ?? "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {property.areaSquareFeet.toLocaleString("en-IN", {
                            maximumFractionDigits: 0,
                          })}
                          <div className="text-xs text-muted-foreground">
                            {property.areaCents.toLocaleString("en-IN")} cents
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatPercent(property.ownershipShare, 0)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={property.legalStatus === "verified" ? "secondary" : "outline"}
                          >
                            {property.legalStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(property.ownedValue, property.currency)}
                          {property.currency !== currency && property.baseOwnedValue !== null ? (
                            <div className="text-xs text-muted-foreground">
                              ≈ {formatCurrency(property.baseOwnedValue, currency)}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <PortfolioRecordDialog
                              compact
                              kind="real_estate"
                              values={{
                                ...property,
                                ownershipShare: property.ownershipShare * 100,
                                asOf: property.asOf.toISOString().slice(0, 10),
                              }}
                            />
                            <ArchiveRecordButton
                              kind="real_estate"
                              id={property.id}
                              label={property.name}
                            />
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
