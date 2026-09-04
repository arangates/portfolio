import {
  BanknoteIcon,
  BrainCircuitIcon,
  Building2Icon,
  ChartNoAxesCombinedIcon,
  CoinsIcon,
  DatabaseIcon,
  EuroIcon,
  FlameIcon,
  Globe2Icon,
  HandCoinsIcon,
  HouseIcon,
  LandmarkIcon,
  LayoutDashboardIcon,
  ReceiptTextIcon,
  RouteIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrendingUpIcon,
  FilesIcon,
} from "lucide-react";

export const dashboardNavigation = [
  {
    label: "Portfolio",
    items: [
      {
        title: "Overview & assets",
        shortTitle: "Overview",
        url: "/dashboard",
        icon: LayoutDashboardIcon,
        keywords: "dashboard net worth allocation",
      },
      {
        title: "Analytics",
        url: "/dashboard/analytics",
        icon: ChartNoAxesCombinedIcon,
        keywords: "charts trends intelligence wealth cash flow analysis",
      },
      {
        title: "Fixed deposits",
        url: "/dashboard/fixed-deposits",
        icon: LandmarkIcon,
        keywords: "fd maturity interest",
      },
    ],
  },
  {
    label: "Cash accounts",
    items: [
      {
        title: "INR accounts",
        shortTitle: "INR",
        url: "/dashboard/inr",
        icon: BanknoteIcon,
        keywords: "india cash bank rupees",
      },
      {
        title: "EUR accounts",
        shortTitle: "EUR",
        url: "/dashboard/eur",
        icon: EuroIcon,
        keywords: "euro cash bank",
      },
    ],
  },
  {
    label: "Investments",
    items: [
      {
        title: "Indian equity",
        url: "/dashboard/indian-equity",
        icon: TrendingUpIcon,
        keywords: "zerodha holdings shares mutual funds",
      },
      {
        title: "Mutual fund intelligence",
        shortTitle: "Fund intelligence",
        url: "/dashboard/mutual-funds",
        icon: SparklesIcon,
        keywords: "mfapi mutual fund nav risk drawdown correlation performance overlap",
      },
      {
        title: "Verified returns",
        shortTitle: "Returns",
        url: "/dashboard/returns",
        icon: ChartNoAxesCombinedIcon,
        keywords: "performance xirr money weighted return realized unrealized pnl fees dividends",
      },
      {
        title: "Tradebook insights",
        shortTitle: "Tradebook",
        url: "/dashboard/tradebook",
        icon: ReceiptTextIcon,
        keywords: "trades xirr cagr profit turnover investing behaviour",
      },
      {
        title: "Global equity",
        url: "/dashboard/global-equity",
        icon: Globe2Icon,
        keywords: "degiro international stocks",
      },
      {
        title: "Real estate",
        url: "/dashboard/real-estate",
        icon: Building2Icon,
        keywords: "property house mortgage",
      },
      {
        title: "Commodities",
        url: "/dashboard/commodities",
        icon: CoinsIcon,
        keywords: "gold silver brass metals",
      },
    ],
  },
  {
    label: "Income",
    items: [
      {
        title: "Salary",
        url: "/dashboard/salary",
        icon: HandCoinsIcon,
        keywords: "payslip income compensation",
      },
      {
        title: "Income tax",
        url: "/dashboard/tax",
        icon: ReceiptTextIcon,
        keywords: "india itr tax return refund assessment year tds",
      },
      {
        title: "Dutch income tax",
        shortTitle: "Dutch tax",
        url: "/dashboard/tax/netherlands",
        icon: LandmarkIcon,
        keywords: "netherlands belastingdienst definitieve aanslag box 1 2 3 refund",
      },
    ],
  },
  {
    label: "Planning",
    items: [
      {
        title: "Verified financial twin",
        shortTitle: "Financial twin",
        url: "/dashboard/twin",
        icon: BrainCircuitIcon,
        keywords: "intelligence decision engine salary surplus allocation fire tax evidence",
      },
      {
        title: "Capital deployment",
        shortTitle: "Deployment",
        url: "/dashboard/deployment",
        icon: RouteIcon,
        keywords: "capital deployment allocation targets drift stp liquidity action plan",
      },
      {
        title: "Household",
        url: "/dashboard/household",
        icon: HouseIcon,
        keywords: "expenses housing car contracts budget",
      },
      {
        title: "FIRE planner",
        url: "/dashboard/fire",
        icon: FlameIcon,
        keywords: "retirement independence simulation expenses",
      },
    ],
  },
  {
    label: "Data",
    items: [
      {
        title: "Import history",
        url: "/dashboard/imports",
        icon: DatabaseIcon,
        keywords: "upload files batches",
      },
      {
        title: "Source documents",
        url: "/dashboard/documents",
        icon: FilesIcon,
        keywords: "files archive google drive download originals source documents",
      },
      {
        title: "Settings & data",
        shortTitle: "Settings",
        url: "/dashboard/settings",
        icon: SettingsIcon,
        keywords: "profile family privacy account",
      },
    ],
  },
] as const;

export const dashboardPages = dashboardNavigation.flatMap((group) =>
  group.items.map((item) => ({ ...item, group: group.label })),
);

export const dashboardChartNavigation = [
  {
    label: "Financial twin",
    items: [
      {
        title: "Salary to investment policy",
        url: "/dashboard/twin#twin-monthly-flow",
        icon: ChartNoAxesCombinedIcon,
        keywords: "salary household surplus deployment flow sankey",
      },
      {
        title: "Contribution reality check",
        url: "/dashboard/twin#twin-capacity-check",
        icon: ChartNoAxesCombinedIcon,
        keywords: "fire savings observed surplus policy supported contribution",
      },
      {
        title: "Financial twin evidence ledger",
        url: "/dashboard/twin#evidence-ledger",
        icon: ShieldCheckIcon,
        keywords: "evidence confidence data readiness audit",
      },
    ],
  },
  {
    label: "Verified return charts",
    items: [
      {
        title: "Indian investor cash flows",
        url: "/dashboard/returns#verified-indian-cash-flows",
        icon: ChartNoAxesCombinedIcon,
        keywords: "zerodha return contributions redemptions xirr",
      },
      {
        title: "Degiro external cash flows",
        url: "/dashboard/returns#global-account-cash-flows",
        icon: ChartNoAxesCombinedIcon,
        keywords: "degiro deposits withdrawals account return",
      },
      {
        title: "Return by instrument",
        url: "/dashboard/returns#instrument-money-weighted-returns",
        icon: ChartNoAxesCombinedIcon,
        keywords: "fund stock instrument xirr performance",
      },
      {
        title: "Snapshot interval returns",
        url: "/dashboard/returns#snapshot-linked-return",
        icon: ChartNoAxesCombinedIcon,
        keywords: "modified dietz linked return valuation intervals",
      },
    ],
  },
  {
    label: "Capital deployment charts",
    items: [
      {
        title: "Current allocation versus policy",
        url: "/dashboard/deployment#deployment-allocation",
        icon: ChartNoAxesCombinedIcon,
        keywords: "target allocation drift policy investment buckets",
      },
      {
        title: "Purchase and redemption flow",
        url: "/dashboard/deployment#capital-flow-history",
        icon: ChartNoAxesCombinedIcon,
        keywords: "investment flow purchases redemptions contributions",
      },
      {
        title: "Fixed-deposit liquidity ladder",
        url: "/dashboard/deployment#scheduled-liquidity",
        icon: ChartNoAxesCombinedIcon,
        keywords: "fd maturities scheduled liquidity ladder",
      },
    ],
  },
  {
    label: "Analytics charts",
    items: [
      {
        title: "Where your net worth sits",
        url: "/dashboard/analytics#wealth-flow",
        icon: ChartNoAxesCombinedIcon,
        keywords: "wealth flow sankey liquidity asset class",
      },
      {
        title: "Wealth mix",
        url: "/dashboard/analytics#wealth-mix",
        icon: ChartNoAxesCombinedIcon,
        keywords: "allocation assets portfolio composition",
      },
      {
        title: "Liquidity structure",
        url: "/dashboard/analytics#liquidity-structure",
        icon: ChartNoAxesCombinedIcon,
        keywords: "liquid long-term assets available",
      },
    ],
  },
  {
    label: "Overview charts",
    items: [
      {
        title: "Asset allocation",
        url: "/dashboard#asset-allocation",
        icon: ChartNoAxesCombinedIcon,
        keywords: "portfolio allocation categories assets",
      },
      {
        title: "Indian equity history",
        url: "/dashboard#indian-equity-history",
        icon: ChartNoAxesCombinedIcon,
        keywords: "portfolio equity history market invested value",
      },
    ],
  },
  {
    label: "Global equity charts",
    items: [
      {
        title: "Largest positions",
        url: "/dashboard/global-equity#asset-allocation",
        icon: ChartNoAxesCombinedIcon,
        keywords: "global equity positions allocation holdings",
      },
      {
        title: "Global equity history",
        url: "/dashboard/global-equity#indian-equity-history",
        icon: ChartNoAxesCombinedIcon,
        keywords: "global equity history cost basis value",
      },
    ],
  },
  {
    label: "Indian equity charts",
    items: [
      {
        title: "What drives Indian equity P&L",
        url: "/dashboard/analytics#equity-performance",
        icon: ChartNoAxesCombinedIcon,
        keywords: "equity profit loss holdings unrealized",
      },
      {
        title: "Indian equity trajectory",
        url: "/dashboard/analytics#indian-equity-trajectory",
        icon: ChartNoAxesCombinedIcon,
        keywords: "equity history market invested value",
      },
    ],
  },
  {
    label: "Tradebook charts",
    items: [
      {
        title: "Monthly investment flow",
        url: "/dashboard/tradebook#monthly-investment-flow",
        icon: ChartNoAxesCombinedIcon,
        keywords: "tradebook purchases redemptions contributions",
      },
      {
        title: "Where contributions went",
        url: "/dashboard/tradebook#contributions-by-fund",
        icon: ChartNoAxesCombinedIcon,
        keywords: "fund investment purchases contribution",
      },
    ],
  },
  {
    label: "Salary charts",
    items: [
      {
        title: "Earnings and take-home",
        url: "/dashboard/salary#earnings-and-take-home",
        icon: ChartNoAxesCombinedIcon,
        keywords: "salary income net pay gross earnings",
      },
      {
        title: "Tax and retirement contributions",
        url: "/dashboard/salary#tax-and-retirement-contributions",
        icon: ChartNoAxesCombinedIcon,
        keywords: "salary tax pension deductions",
      },
    ],
  },
  {
    label: "Household charts",
    items: [
      {
        title: "Where the monthly budget goes",
        url: "/dashboard/household#household-budget-breakdown",
        icon: ChartNoAxesCombinedIcon,
        keywords: "household expenses budget categories spending",
      },
      {
        title: "Essential versus flexible",
        url: "/dashboard/household#essential-flexible-spend",
        icon: ChartNoAxesCombinedIcon,
        keywords: "household needs choices expenses",
      },
      {
        title: "Scenario comparison",
        url: "/dashboard/household#household-scenario-comparison",
        icon: ChartNoAxesCombinedIcon,
        keywords: "household gross refunds net scenarios",
      },
      {
        title: "Cost per adult by scenario",
        url: "/dashboard/household#household-cost-per-adult",
        icon: ChartNoAxesCombinedIcon,
        keywords: "household adult split scenarios",
      },
    ],
  },
  {
    label: "Real estate charts",
    items: [
      {
        title: "Property allocation",
        url: "/dashboard/real-estate#property-allocation",
        icon: ChartNoAxesCombinedIcon,
        keywords: "real estate property types value",
      },
      {
        title: "Valuation history",
        url: "/dashboard/real-estate#property-valuation-history",
        icon: ChartNoAxesCombinedIcon,
        keywords: "real estate property history snapshots",
      },
    ],
  },
  {
    label: "Commodity charts",
    items: [
      {
        title: "Declared value by holding",
        url: "/dashboard/commodities#declared-value-by-holding",
        icon: ChartNoAxesCombinedIcon,
        keywords: "commodities gold silver holding value",
      },
      {
        title: "Physical inventory reconciliation",
        url: "/dashboard/commodities#physical-inventory-reconciliation",
        icon: ChartNoAxesCombinedIcon,
        keywords: "commodities inventory weight declared itemized",
      },
    ],
  },
  {
    label: "FIRE charts",
    items: [
      {
        title: "Range of possible outcomes",
        url: "/dashboard/fire#fire-outcomes",
        icon: ChartNoAxesCombinedIcon,
        keywords: "fire retirement simulation probability",
      },
      {
        title: "Retirement cash-flow map",
        url: "/dashboard/fire#retirement-cash-flow",
        icon: ChartNoAxesCombinedIcon,
        keywords: "fire retirement expenses income costs",
      },
    ],
  },
  {
    label: "INR account charts",
    items: [
      {
        title: "Cash by account",
        url: "/dashboard/inr#cash-by-account",
        icon: ChartNoAxesCombinedIcon,
        keywords: "bank cash account balance",
      },
      {
        title: "Minimum-balance safety",
        url: "/dashboard/inr#minimum-balance-safety",
        icon: ChartNoAxesCombinedIcon,
        keywords: "bank cash minimum balance headroom",
      },
      {
        title: "INR cash history",
        url: "/dashboard/inr#inr-cash-history",
        icon: ChartNoAxesCombinedIcon,
        keywords: "bank cash history balance snapshots",
      },
    ],
  },
] as const;
