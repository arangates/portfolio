import { ArchiveRecordButton } from "@/components/archive-record-button";
import { EmptyDataState } from "@/components/empty-data-state";
import { PageHeader } from "@/components/page-header";
import { PortfolioRecordDialog } from "@/components/portfolio-record-dialog";
import { RealEstateCharts } from "@/components/real-estate-charts";
import { SectionCards } from "@/components/section-cards";
import { TableCard } from "@/components/table-card";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { getRealEstateHistory, getRealEstatePortfolio } from "@portfolio/api/portfolio-queries";
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
  const [properties, allHistory] = await Promise.all([
    getRealEstatePortfolio(session.user.id),
    getRealEstateHistory(session.user.id),
  ]);
  const currency = properties[0]?.currency ?? "INR";
  const currentCurrencyProperties = properties.filter((property) => property.currency === currency);
  const history = allHistory.filter((point) => point.currency === currency);
  const grossValue = currentCurrencyProperties.reduce(
    (sum, property) => sum + property.marketValue,
    0,
  );
  const ownedValue = currentCurrencyProperties.reduce(
    (sum, property) => sum + property.ownedValue,
    0,
  );
  const ownedArea = currentCurrencyProperties.reduce(
    (sum, property) => sum + property.areaSquareFeet * property.ownershipShare,
    0,
  );
  const verified = properties.filter((property) => property.legalStatus === "verified").length;
  const propertyTypes = [
    ...new Set(currentCurrencyProperties.map((property) => property.propertyType)),
  ];
  const allocation = propertyTypes.map((propertyType) => ({
    category: propertyType,
    value: currentCurrencyProperties
      .filter((property) => property.propertyType === propertyType)
      .reduce((sum, property) => sum + property.ownedValue, 0),
  }));
  const currencies = [...new Set(properties.map((property) => property.currency))];

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <PageHeader
          title="Real estate"
          description="Property identity, land area, ownership, legal status and valuation are tracked as account-scoped historical snapshots."
          action={<PortfolioRecordDialog kind="real_estate" values={{ currency: "INR" }} />}
        />
        {properties.length === 0 ? (
          <div className="px-4 lg:px-6">
            <EmptyDataState
              icon={Building2Icon}
              title="No properties"
              description="Add a property to start a valuation history based on the Real Estate structure in Aranga."
              action={<PortfolioRecordDialog kind="real_estate" values={{ currency: "INR" }} />}
            />
          </div>
        ) : (
          <>
            <SectionCards
              items={[
                {
                  label: "Attributable value",
                  value: formatCurrency(ownedValue, currency),
                  badge: `${currentCurrencyProperties.length} properties`,
                  note: "Full valuation × ownership share",
                  detail:
                    currencies.length > 1
                      ? `Showing ${currency}; ${currencies.length - 1} other currencies retained`
                      : `All current ${currency} valuations`,
                  icon: Building2Icon,
                },
                {
                  label: "Gross market value",
                  value: formatCurrency(grossValue, currency),
                  badge: formatPercent(grossValue === 0 ? 0 : ownedValue / grossValue, 1),
                  note: "Full value before ownership allocation",
                  detail: "Explicit appraisal or area × unit price",
                  icon: MapIcon,
                },
                {
                  label: "Attributable area",
                  value: `${ownedArea.toLocaleString("en-IN", { maximumFractionDigits: 0 })} sq. ft.`,
                  badge: `${propertyTypes.length} types`,
                  note: "Area weighted by ownership share",
                  detail: "Land and home area retained separately",
                  icon: RulerIcon,
                },
                {
                  label: "Legal verification",
                  value: `${verified} verified`,
                  badge: `${properties.length - verified} review`,
                  note: "Document status across current properties",
                  detail: "Use Pending when due diligence is underway",
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
