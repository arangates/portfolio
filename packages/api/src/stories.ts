import "server-only";

import { getPortfolioOverview, getCurrentFixedDeposits } from "./portfolio-queries";
import { getFirePlan } from "./fire-queries";
import { getSnapshotEvidence } from "./snapshot-insights-queries";
import { convertCurrency } from "./currency-conversion";
import { compareSnapshots } from "./insight-calculations";

export type StoryBadge = {
  text: string;
  variant: "positive" | "negative" | "neutral" | "accent";
};

export type StoryDetail = {
  label: string;
  value: string;
  change?: string;
};

export type StorySlide = {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  metric: string;
  subMetric?: string;
  badge?: StoryBadge;
  details: StoryDetail[];
  callToAction?: {
    label: string;
    href: string;
  };
  visualType: "pulse" | "allocation" | "runway" | "milestone" | "sovereignty";
  accentGradient: string;
};

export type FinancialStoryFeed = {
  updatedAt: string;
  userName: string;
  isSovereign: boolean;
  slides: StorySlide[];
};

const fmtEur = (n: number) =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

const fmtInr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export async function getFinancialStoryFeed(
  userId: string,
  userName = "Aranga",
): Promise<FinancialStoryFeed> {
  const [overview, fire, evidence, deposits] = await Promise.all([
    getPortfolioOverview(userId).catch(() => null),
    getFirePlan(userId).catch(() => null),
    getSnapshotEvidence(userId).catch(() => null),
    getCurrentFixedDeposits(userId).catch(() => []),
  ]);

  const rawNetWorth = overview?.totals?.netWorth ?? 0;
  const hasData = overview && rawNetWorth > 0;

  if (!hasData || !overview) {
    // Welcoming Sovereign Onboarding Pulse
    return {
      updatedAt: new Date().toISOString(),
      userName,
      isSovereign: true,
      slides: [
        {
          id: "sovereign-welcome",
          tag: "INDEPENDENCE",
          title: "Sovereign Operating System",
          subtitle: "Your personal financial dashboard is 100% independent.",
          metric: "Zero Cloud",
          subMetric: "Running entirely on your local machine with embedded PGlite",
          badge: { text: "100% Sovereign", variant: "positive" },
          details: [
            { label: "Database Engine", value: "PGlite (Postgres WASM)" },
            { label: "Storage", value: "./data/selvam.db" },
            { label: "Cloud Services", value: "0 Active Dependencies" },
          ],
          callToAction: { label: "Restore Data", href: "/dashboard/settings" },
          visualType: "sovereignty",
          accentGradient: "from-emerald-500/30 via-teal-500/20 to-sky-500/30",
        },
        {
          id: "sovereign-vault",
          tag: "SECURITY",
          title: "Hardware-Locked Vault",
          subtitle: "Financial records encrypted with authenticated AES-256-GCM.",
          metric: "Encrypted",
          subMetric: "PBKDF2-SHA512 key derivation with zero cloud key escrow",
          badge: { text: "Hardware Private", variant: "accent" },
          details: [
            { label: "Cipher", value: "AES-256-GCM" },
            { label: "Biometrics", value: "Device Authenticated" },
            { label: "Multi-device", value: "Encrypted vault.enc" },
          ],
          callToAction: { label: "View Security", href: "/dashboard/settings" },
          visualType: "sovereignty",
          accentGradient: "from-blue-500/30 via-indigo-500/20 to-violet-500/30",
        },
        {
          id: "sovereign-fx",
          tag: "MARKET FEEDS",
          title: "Direct Public Feeds",
          subtitle: "Free, subscription-less exchange rates and inflation metrics.",
          metric: "ECB Direct",
          subMetric: "European Central Bank official reference feed (EUR/INR)",
          badge: { text: "Free & Public", variant: "neutral" },
          details: [
            { label: "Reference Source", value: "European Central Bank" },
            { label: "API Key", value: "None Required" },
            { label: "Update Cadence", value: "Daily Official Close" },
          ],
          callToAction: { label: "Explore Dashboard", href: "/dashboard" },
          visualType: "pulse",
          accentGradient: "from-amber-500/30 via-orange-500/20 to-rose-500/30",
        },
      ],
    };
  }

  // Active Story Feed with Real Financial Intelligence
  const baseCurrency = overview.preference.baseCurrency ?? "EUR";
  const netWorthEur =
    baseCurrency === "EUR"
      ? rawNetWorth
      : (convertCurrency(rawNetWorth, baseCurrency, "EUR", overview.rates) ?? rawNetWorth);
  const netWorthInr =
    baseCurrency === "INR"
      ? rawNetWorth
      : (convertCurrency(rawNetWorth, baseCurrency, "INR", overview.rates) ?? rawNetWorth);

  let deltaAbs = 0;
  let deltaPct = 0;
  if (evidence && evidence.length > 0) {
    const comparisons = compareSnapshots(evidence);
    const validDeltas = comparisons.filter((c) => c.delta !== null);
    if (validDeltas.length > 0) {
      deltaAbs = validDeltas.reduce((sum, c) => sum + (c.delta ?? 0), 0);
      const totalPrev = validDeltas.reduce((sum, c) => {
        if (c.delta !== null && c.percent && c.percent !== 0) {
          return sum + c.delta / c.percent;
        }
        return sum;
      }, 0);
      deltaPct = totalPrev > 0 ? (deltaAbs / totalPrev) * 100 : 0;
    }
  }

  const slides: StorySlide[] = [
    // Slide 1: Net Worth Pulse
    {
      id: "net-worth-pulse",
      tag: "DAILY PULSE",
      title: "Total Net Worth",
      subtitle: "Consolidated portfolio valuation across global & Indian assets.",
      metric: fmtEur(netWorthEur),
      subMetric: fmtInr(netWorthInr),
      badge: {
        text:
          deltaPct >= 0
            ? `+${deltaPct.toFixed(1)}% this period`
            : `${deltaPct.toFixed(1)}% this period`,
        variant: deltaPct >= 0 ? "positive" : "negative",
      },
      details: [
        { label: "Change", value: deltaAbs >= 0 ? `+${fmtEur(deltaAbs)}` : fmtEur(deltaAbs) },
        { label: "Precision", value: "Realized + Unrealized Marked" },
      ],
      callToAction: { label: "View Analytics", href: "/dashboard/analytics" },
      visualType: "pulse",
      accentGradient: "from-emerald-500/30 via-teal-500/20 to-cyan-500/30",
    },

    // Slide 2: Asset Allocation
    {
      id: "asset-mix",
      tag: "ALLOCATION",
      title: "Wealth Distribution",
      subtitle: "Capital spread across asset categories and currencies.",
      metric: `${overview.liquidAllocation.length} Asset Classes`,
      subMetric: "Liquid vs Invested balance",
      badge: { text: "Rebalanced", variant: "accent" },
      details: overview.liquidAllocation.slice(0, 4).map((a) => {
        const valEur =
          baseCurrency === "EUR"
            ? a.value
            : (convertCurrency(a.value, baseCurrency, "EUR", overview.rates) ?? a.value);
        return {
          label: a.category.replace(/_/g, " ").toUpperCase(),
          value: fmtEur(valEur),
        };
      }),
      callToAction: { label: "Deployment Engine", href: "/dashboard/deployment" },
      visualType: "allocation",
      accentGradient: "from-blue-500/30 via-violet-500/20 to-purple-500/30",
    },
  ];

  // Slide 3: FIRE Runway
  if (fire && fire.configured) {
    const primaryScenario = fire.results[0];
    const fireProgress = primaryScenario ? primaryScenario.progress : null;
    const targetCorpus = primaryScenario ? primaryScenario.requiredCorpus : null;
    const annualExpenses = fire.monthlyExpenses * 12;
    const runwayYears = annualExpenses > 0 ? fire.currentInvestableAssets / annualExpenses : null;

    const targetCorpusEur =
      targetCorpus !== null
        ? baseCurrency === "EUR"
          ? targetCorpus
          : (convertCurrency(targetCorpus, baseCurrency, "EUR", overview.rates) ?? targetCorpus)
        : null;

    const annualExpensesEur =
      baseCurrency === "EUR"
        ? annualExpenses
        : (convertCurrency(annualExpenses, baseCurrency, "EUR", overview.rates) ?? annualExpenses);

    slides.push({
      id: "fire-runway",
      tag: "FIRE ENGINE",
      title: "Financial Independence",
      subtitle: "Autonomous living runway based on verified safe withdrawal rate.",
      metric: runwayYears !== null ? `${runwayYears.toFixed(1)} Years` : "Configured",
      subMetric:
        fireProgress !== null ? `${Math.round(fireProgress * 100)}% of FIRE Target` : undefined,
      badge: {
        text: fireProgress !== null && fireProgress >= 1 ? "FIRE Achieved" : "Accumulating",
        variant: fireProgress !== null && fireProgress >= 1 ? "positive" : "neutral",
      },
      details: [
        { label: "Target Corpus", value: targetCorpusEur !== null ? fmtEur(targetCorpusEur) : "—" },
        { label: "Annual Spending", value: fmtEur(annualExpensesEur) },
      ],
      callToAction: { label: "FIRE Simulation", href: "/dashboard/twin" },
      visualType: "runway",
      accentGradient: "from-amber-500/30 via-rose-500/20 to-red-500/30",
    });
  } else {
    slides.push({
      id: "fire-runway",
      tag: "FIRE ENGINE",
      title: "Financial Independence",
      subtitle: "Simulate your trajectory towards early financial sovereignty.",
      metric: "Plan Ready",
      subMetric: "Configure your target retirement age and expenses",
      badge: { text: "Simulate", variant: "neutral" },
      details: [
        { label: "Twin Engine", value: "Deterministic + Monte Carlo" },
        { label: "Status", value: "Ready to configure" },
      ],
      callToAction: { label: "Configure FIRE Plan", href: "/dashboard/twin" },
      visualType: "runway",
      accentGradient: "from-amber-500/30 via-rose-500/20 to-red-500/30",
    });
  }

  // Slide 4: Upcoming Deadlines (if any FDs exist)
  if (deposits && deposits.length > 0) {
    const nextFd = deposits[0];
    slides.push({
      id: "actionable-deadlines",
      tag: "MATURITY",
      title: "Maturing Deposits",
      subtitle: "Upcoming liquidity events requiring reinvestment or deployment.",
      metric: fmtInr(Number(nextFd?.principal ?? 0)),
      subMetric: `${nextFd?.bank ?? "Bank"} Fixed Deposit`,
      badge: {
        text: nextFd?.maturityDate ? `Matures ${nextFd.maturityDate}` : "Active Deposit",
        variant: "accent",
      },
      details: [
        { label: "Interest Rate", value: `${nextFd?.interestRate ?? 7.5}% p.a.` },
        { label: "Currency", value: nextFd?.currency ?? "INR" },
      ],
      callToAction: { label: "View Cash Flow", href: "/dashboard/cash-flow" },
      visualType: "milestone",
      accentGradient: "from-orange-500/30 via-amber-500/20 to-yellow-500/30",
    });
  }

  // Slide 5: Sovereign Health
  slides.push({
    id: "sovereign-status",
    tag: "SOVEREIGN OS",
    title: "100% Private & Sovereign",
    subtitle: "Your financial operating system operates with complete independence.",
    metric: "Zero External Cloud",
    subMetric: "PGlite embedded database active with AES-256-GCM vault",
    badge: { text: "Fully Sovereign", variant: "positive" },
    details: [
      { label: "Active Engine", value: "Embedded PGlite" },
      { label: "Cloud Quotas", value: "None ($0 / Forever)" },
      { label: "Network Requirement", value: "0ms Offline" },
    ],
    callToAction: { label: "Settings & Vault", href: "/dashboard/settings" },
    visualType: "sovereignty",
    accentGradient: "from-teal-500/30 via-emerald-500/20 to-green-500/30",
  });

  return {
    updatedAt: new Date().toISOString(),
    userName,
    isSovereign: true,
    slides,
  };
}
