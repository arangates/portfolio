import {
  BanknoteIcon,
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
  SettingsIcon,
  TrendingUpIcon,
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
    ],
  },
  {
    label: "Planning",
    items: [
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
