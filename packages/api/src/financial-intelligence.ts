import type { getFirePlan } from "./fire-queries";
import type { getHouseholdDashboard } from "./household-queries";
import type { getPortfolioOverview } from "./portfolio-queries";

export type InsightCategory = "liquidity" | "portfolio" | "fire" | "spending" | "data";
export type InsightSeverity = "critical" | "warning" | "opportunity" | "info";
export type FinancialInsight = {
  id: string;
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  observation: string;
  whyItMatters: string;
  recommendation: string;
  confidence: number;
  sources: string[];
  metric?: { label: string; value: string };
};

export type IntelligenceSnapshot = {
  insights: FinancialInsight[];
  briefing: { headline: string; summary: string; status: "attention" | "on-track" | "opportunity" };
  quality: { score: number; notices: string[] };
  baseline: {
    netWorth: number;
    liquidAssets: number;
    monthlyExpenses: number;
    annualSavings: number;
    retirementYear: number | null;
  };
};

type Portfolio = Awaited<ReturnType<typeof getPortfolioOverview>>;
type FirePlan = Awaited<ReturnType<typeof getFirePlan>>;
type Household = Awaited<ReturnType<typeof getHouseholdDashboard>>;

const severityRank: Record<InsightSeverity, number> = {
  critical: 0,
  warning: 1,
  opportunity: 2,
  info: 3,
};
const money = (value: number, currency: string) =>
  new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(
    value,
  );

export function buildFinancialIntelligence(
  portfolio: Portfolio,
  fire: FirePlan,
  household: Household,
): IntelligenceSnapshot {
  const currency = portfolio.preference.baseCurrency;
  const insights: FinancialInsight[] = [];
  const notices: string[] = [];
  const liquid = portfolio.totals.liquidValue;
  const monthlyExpenses = fire.configured ? fire.monthlyExpenses : household.metrics.netMonthly;
  const essential = fire.configured ? fire.monthlyEssentialExpenses : monthlyExpenses;
  const runway = essential > 0 ? liquid / essential : null;
  const annualSavings = fire.configured ? fire.profile.annualSavings : 0;

  if (runway !== null && runway < 6)
    insights.push({
      id: "liquidity-runway",
      category: "liquidity",
      severity: runway < 3 ? "critical" : "warning",
      title: "Your safety runway is thin",
      observation: `${runway.toFixed(1)} months of essential spending is covered by liquid assets.`,
      whyItMatters:
        "A short runway can force investments to be sold during a bad market or before planned income arrives.",
      recommendation: `Prioritize building liquid reserves to at least ${money(essential * 6, currency)} before increasing risk exposure.`,
      confidence: 0.88,
      sources: ["portfolio", "FIRE expenses"],
      metric: { label: "Runway", value: `${runway.toFixed(1)} months` },
    });
  if (runway !== null && runway >= 12)
    insights.push({
      id: "cash-deployment",
      category: "liquidity",
      severity: "opportunity",
      title: "Excess liquidity may be deployable",
      observation: `${runway.toFixed(1)} months of essential spending is held in liquid assets.`,
      whyItMatters: "Cash above your safety reserve may be slowing long-term compounding.",
      recommendation: `Review deploying up to ${money(Math.max(0, liquid - essential * 12), currency)} against your target allocation.`,
      confidence: 0.8,
      sources: ["portfolio", "FIRE expenses"],
      metric: {
        label: "Potentially deployable",
        value: money(Math.max(0, liquid - essential * 12), currency),
      },
    });
  const largest = portfolio.allocation.at(0);
  if (largest && portfolio.totals.netWorth > 0 && largest.value / portfolio.totals.netWorth > 0.4)
    insights.push({
      id: "concentration",
      category: "portfolio",
      severity: "warning",
      title: "One allocation dominates your wealth",
      observation: `${largest.category} represents ${Math.round((largest.value / portfolio.totals.netWorth) * 100)}% of net worth.`,
      whyItMatters:
        "A concentrated allocation makes one asset class disproportionately important to your financial plan.",
      recommendation:
        "Set a target range and direct new contributions toward underrepresented assets before selling anything.",
      confidence: 0.92,
      sources: ["portfolio snapshot"],
      metric: { label: "Largest allocation", value: largest.category },
    });
  if (fire.configured) {
    const target = fire.profile.plannedRetirementYear;
    const currentYear = new Date().getUTCFullYear();
    if (target && target <= currentYear + 2 && annualSavings <= 0)
      insights.push({
        id: "fire-savings",
        category: "fire",
        severity: "critical",
        title: "Your FIRE plan has no active savings engine",
        observation: "The plan has a near-term retirement date but no annual savings recorded.",
        whyItMatters: "The target depends on ongoing contributions as well as portfolio returns.",
        recommendation:
          "Update annual savings and validate the retirement year against current expenses and investable assets.",
        confidence: 0.9,
        sources: ["FIRE profile", "FIRE results"],
      });
    if (!fire.profile) notices.push("FIRE assumptions are incomplete.");
  } else
    notices.push("Add a FIRE profile to connect savings, spending, and retirement trajectory.");
  if (portfolio.unconvertedCurrencies.length)
    notices.push(`FX rates missing for ${portfolio.unconvertedCurrencies.join(", ")}.`);
  if (!portfolio.assets.length)
    notices.push("Import portfolio data to unlock allocation and concentration insights.");
  if (!household.configured)
    notices.push("Household data is not configured; spending insights are limited.");

  insights.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
  const top = insights[0];
  const score = Math.max(
    0,
    Math.round(
      100 - notices.length * 12 - insights.filter((i) => i.severity === "critical").length * 15,
    ),
  );
  return {
    insights,
    briefing: top
      ? {
          headline: top.title,
          summary: top.recommendation,
          status:
            top.severity === "critical" || top.severity === "warning" ? "attention" : "opportunity",
        }
      : {
          headline: "Your financial picture is ready for review",
          summary: "Import more source data to reveal connections and recommendations.",
          status: "on-track",
        },
    quality: { score, notices },
    baseline: {
      netWorth: portfolio.totals.netWorth,
      liquidAssets: liquid,
      monthlyExpenses,
      annualSavings,
      retirementYear: fire.configured ? fire.profile.plannedRetirementYear : null,
    },
  };
}

export type { Portfolio, FirePlan, Household };
