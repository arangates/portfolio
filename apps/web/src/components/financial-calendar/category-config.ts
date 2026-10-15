export interface CategoryConfig {
  label: string;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}

export const FINANCIAL_CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  Deposits: {
    label: "Deposits",
    color: "#30D158",
    bgClass: "bg-emerald-500/10 dark:bg-emerald-500/20",
    borderClass: "border-emerald-500/30",
    textClass: "text-emerald-700 dark:text-emerald-400",
  },
  Contracts: {
    label: "Contracts & Bills",
    color: "#FF9500",
    bgClass: "bg-orange-500/10 dark:bg-orange-500/20",
    borderClass: "border-orange-500/30",
    textClass: "text-orange-700 dark:text-orange-400",
  },
  Salary: {
    label: "Salary & Income",
    color: "#00C7BE",
    bgClass: "bg-teal-500/10 dark:bg-teal-500/20",
    borderClass: "border-teal-500/30",
    textClass: "text-teal-700 dark:text-teal-400",
  },
  Investments: {
    label: "Investments",
    color: "#007AFF",
    bgClass: "bg-blue-500/10 dark:bg-blue-500/20",
    borderClass: "border-blue-500/30",
    textClass: "text-blue-700 dark:text-blue-400",
  },
  "Bank transactions": {
    label: "Bank Transactions",
    color: "#AF52DE",
    bgClass: "bg-purple-500/10 dark:bg-purple-500/20",
    borderClass: "border-purple-500/30",
    textClass: "text-purple-700 dark:text-purple-400",
  },
  Tax: {
    label: "Tax",
    color: "#FF3B30",
    bgClass: "bg-rose-500/10 dark:bg-rose-500/20",
    borderClass: "border-rose-500/30",
    textClass: "text-rose-700 dark:text-rose-400",
  },
  Purchases: {
    label: "Purchases",
    color: "#A2845E",
    bgClass: "bg-amber-600/10 dark:bg-amber-600/20",
    borderClass: "border-amber-600/30",
    textClass: "text-amber-800 dark:text-amber-400",
  },
  Valuations: {
    label: "Valuations",
    color: "#FFCC00",
    bgClass: "bg-yellow-500/10 dark:bg-yellow-500/20",
    borderClass: "border-yellow-500/30",
    textClass: "text-yellow-800 dark:text-yellow-400",
  },
  Planning: {
    label: "Planning",
    color: "#5856D6",
    bgClass: "bg-indigo-500/10 dark:bg-indigo-500/20",
    borderClass: "border-indigo-500/30",
    textClass: "text-indigo-700 dark:text-indigo-400",
  },
  Imports: {
    label: "Imports",
    color: "#8E8E93",
    bgClass: "bg-zinc-500/10 dark:bg-zinc-500/20",
    borderClass: "border-zinc-500/30",
    textClass: "text-zinc-700 dark:text-zinc-400",
  },
};

export function getCategoryConfig(category: string): CategoryConfig {
  return (
    FINANCIAL_CATEGORY_CONFIG[category] ?? {
      label: category,
      color: "#8E8E93",
      bgClass: "bg-zinc-500/10 dark:bg-zinc-500/20",
      borderClass: "border-zinc-500/30",
      textClass: "text-zinc-700 dark:text-zinc-400",
    }
  );
}
