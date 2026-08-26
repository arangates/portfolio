import { InstitutionConcentrationPieChart } from "@/components/evilcharts/blocks/market-share-echarts-pie-chart";
import { HouseholdCharts } from "@/components/household-charts";
import { PortfolioFlowChart } from "@/components/portfolio-flow-chart";
import { TableCard } from "@/components/table-card";
import { ZerodhaTradebookCharts } from "@/components/zerodha-tradebook-charts";

export default function ChartPreviewPage() {
  return (
    <main className="mx-auto grid w-full max-w-[1500px] gap-8 py-8">
      <div className="w-full max-w-lg px-4">
        <TableCard
          title="Institution concentration"
          description="Share of active principal by institution. Select a slice to isolate it."
          dataTable={false}
        >
          <InstitutionConcentrationPieChart
            institutions={[
              { institution: "State Bank of India", amount: 4_250_000 },
              { institution: "HDFC Bank", amount: 3_100_000 },
              { institution: "ICICI Bank", amount: 2_300_000 },
              { institution: "Axis Bank", amount: 1_275_000 },
              { institution: "Federal Bank", amount: 875_000 },
            ]}
          />
        </TableCard>
      </div>
      <PortfolioFlowChart
        assets={[
          { category: "Real estate", baseValue: 34_000_000, isLiquid: false },
          { category: "Marketable securities", baseValue: 15_000_000, isLiquid: true },
          { category: "Fixed deposits", baseValue: 11_800_000, isLiquid: true },
          {
            category: "Commodities",
            baseValue: 2_700_000,
            liquidBaseValue: 500_000,
            isLiquid: true,
          },
          { category: "Cash", baseValue: 500_000, isLiquid: true },
          { category: "Vehicle", baseValue: 200_000, isLiquid: false },
        ]}
        netWorth={64_200_000}
        liquidValue={27_800_000}
        currency="INR"
      />
      <HouseholdCharts
        categories={[
          { category: "Housing", amount: 1900 },
          { category: "Childcare", amount: 1250 },
          { category: "Groceries", amount: 520 },
          { category: "Transport", amount: 310 },
          { category: "Utilities", amount: 280 },
          { category: "Shopping", amount: 200 },
          { category: "Insurance", amount: 150 },
        ]}
        scenarios={[
          { name: "Current", grossExpenses: 4610, refunds: 750, netMonthly: 3860, perAdult: 1930 },
          { name: "Doable", grossExpenses: 4200, refunds: 750, netMonthly: 3450, perAdult: 1725 },
        ]}
        currency="EUR"
        essentialExpenses={3500}
        flexibleExpenses={1110}
      />
      <ZerodhaTradebookCharts
        monthly={[
          { month: "Jan 26", buys: 120000, sells: 0, netInvested: 120000 },
          { month: "Feb 26", buys: 160000, sells: 25000, netInvested: 135000 },
        ]}
        funds={[
          { name: "Nippon India Ultra Short Duration", buyAmount: 8_729_990 },
          { name: "Parag Parikh Flexi Cap Fund", buyAmount: 1_850_000 },
          { name: "ICICI Prudential Nifty 50 Index Fund", buyAmount: 1_400_000 },
          { name: "SBI Gold Fund", buyAmount: 1_180_000 },
          { name: "Quant Mid Cap Fund", buyAmount: 1_050_000 },
        ]}
      />
    </main>
  );
}
