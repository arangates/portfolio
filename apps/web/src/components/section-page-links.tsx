"use client";

import { dashboardNavigation } from "@/lib/navigation";
import { CardDescription, CardTitle } from "@portfolio/ui/components/card";
import { ArrowRightIcon } from "@portfolio/ui/components/icons";
import type { Route } from "next";
import Link from "next/link";

const pageDescriptions: Record<string, string> = {
  "Ask Selvam": "Ask questions about your portfolio and planning data.",
  "Overview & assets": "Review the latest asset snapshot and portfolio allocation.",
  "Selvam Labs": "Explore experimental insights and what-if scenarios.",
  Analytics: "Open cross-domain charts and analysis.",
  Calendar: "See upcoming bills, maturities, renewals and events.",
  Activity: "Review changes, imports and record history.",
  "Fixed deposits": "Track deposit balances, rates and maturity dates.",
  "Unified cash flow": "Review income, spending and investments from imported transactions.",
  "Personal cash flow": "Inspect transactions and trends for personal accounts.",
  "Household cash flow": "Inspect transactions and trends for household accounts.",
  "INR accounts": "Review INR balances and minimum-balance requirements.",
  "EUR accounts": "Review EUR balances and snapshot dates.",
  "Indian equity": "Inspect the latest Indian equity holdings snapshot.",
  "Mutual fund intelligence": "Compare fund performance, risk and overlap.",
  "Verified returns": "Review cash-flow-based investment return calculations.",
  "Tradebook insights": "Analyze imported trade activity and contribution history.",
  "Global equity": "Review international holdings and imported account history.",
  "Real estate": "Inspect property values and related history.",
  Mortgage: "Review loan balance, interest and repayment schedule.",
  Commodities: "Review recorded precious-metal and commodity holdings.",
  Salary: "Inspect payslip history, earnings and deductions.",
  "Income tax": "Review imported Indian tax-return records.",
  "Dutch income tax": "Review Dutch income-tax assessments.",
  "Verified financial twin": "Explore reconciled household cash and investment evidence.",
  "Capital deployment": "Review policy ranges, available capital and maturities.",
  Household: "Inspect household costs, contracts and scenarios.",
  "FIRE planner": "Review retirement projections and saved assumptions.",
  "Source documents": "Review import status, source files and archive history.",
};

const cardTones = [
  {
    gradient: "from-violet-500/25 via-fuchsia-500/10 to-violet-500/35",
    hover:
      "hover:border-violet-400/50 hover:shadow-[0_0_0_1px_rgba(139,92,246,0.24),0_0_30px_rgba(139,92,246,0.2)] focus-visible:shadow-[0_0_0_1px_rgba(139,92,246,0.3),0_0_30px_rgba(139,92,246,0.2)]",
    iconGlow: "group-hover/card:shadow-[0_0_26px_rgba(139,92,246,0.38)]",
  },
  {
    gradient: "from-sky-500/25 via-blue-500/10 to-blue-500/35",
    hover:
      "hover:border-blue-400/50 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.24),0_0_30px_rgba(59,130,246,0.2)] focus-visible:shadow-[0_0_0_1px_rgba(59,130,246,0.3),0_0_30px_rgba(59,130,246,0.2)]",
    iconGlow: "group-hover/card:shadow-[0_0_26px_rgba(59,130,246,0.38)]",
  },
  {
    gradient: "from-emerald-500/25 via-teal-500/10 to-emerald-500/35",
    hover:
      "hover:border-emerald-400/50 hover:shadow-[0_0_0_1px_rgba(16,185,129,0.24),0_0_30px_rgba(16,185,129,0.2)] focus-visible:shadow-[0_0_0_1px_rgba(16,185,129,0.3),0_0_30px_rgba(16,185,129,0.2)]",
    iconGlow: "group-hover/card:shadow-[0_0_26px_rgba(16,185,129,0.38)]",
  },
  {
    gradient: "from-rose-500/25 via-red-500/10 to-rose-500/35",
    hover:
      "hover:border-rose-400/50 hover:shadow-[0_0_0_1px_rgba(244,63,94,0.24),0_0_30px_rgba(244,63,94,0.2)] focus-visible:shadow-[0_0_0_1px_rgba(244,63,94,0.3),0_0_30px_rgba(244,63,94,0.2)]",
    iconGlow: "group-hover/card:shadow-[0_0_26px_rgba(244,63,94,0.38)]",
  },
  {
    gradient: "from-amber-500/25 via-orange-500/10 to-amber-500/35",
    hover:
      "hover:border-amber-400/50 hover:shadow-[0_0_0_1px_rgba(245,158,11,0.24),0_0_30px_rgba(245,158,11,0.2)] focus-visible:shadow-[0_0_0_1px_rgba(245,158,11,0.3),0_0_30px_rgba(245,158,11,0.2)]",
    iconGlow: "group-hover/card:shadow-[0_0_26px_rgba(245,158,11,0.38)]",
  },
  {
    gradient: "from-cyan-500/25 via-sky-500/10 to-cyan-500/35",
    hover:
      "hover:border-cyan-400/50 hover:shadow-[0_0_0_1px_rgba(6,182,212,0.24),0_0_30px_rgba(6,182,212,0.2)] focus-visible:shadow-[0_0_0_1px_rgba(6,182,212,0.3),0_0_30px_rgba(6,182,212,0.2)]",
    iconGlow: "group-hover/card:shadow-[0_0_26px_rgba(6,182,212,0.38)]",
  },
  {
    gradient: "from-indigo-500/25 via-violet-500/10 to-indigo-500/35",
    hover:
      "hover:border-indigo-400/50 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.24),0_0_30px_rgba(99,102,241,0.2)] focus-visible:shadow-[0_0_0_1px_rgba(99,102,241,0.3),0_0_30px_rgba(99,102,241,0.2)]",
    iconGlow: "group-hover/card:shadow-[0_0_26px_rgba(99,102,241,0.38)]",
  },
  {
    gradient: "from-lime-500/25 via-green-500/10 to-lime-500/35",
    hover:
      "hover:border-lime-400/50 hover:shadow-[0_0_0_1px_rgba(132,204,22,0.24),0_0_30px_rgba(132,204,22,0.2)] focus-visible:shadow-[0_0_0_1px_rgba(132,204,22,0.3),0_0_30px_rgba(132,204,22,0.2)]",
    iconGlow: "group-hover/card:shadow-[0_0_26px_rgba(132,204,22,0.38)]",
  },
];

export function SectionPageLinks({ section }: { section: string }) {
  const group = dashboardNavigation.find((item) => item.label === section);
  if (!group) return null;

  return (
    <section className="space-y-3 px-4 lg:px-6" aria-labelledby="section-pages">
      <div>
        <h2 id="section-pages" className="text-lg font-semibold tracking-tight">
          Explore this section
        </h2>
        <p className="text-sm text-muted-foreground">
          Open a focused page for source details, controls and full history.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {group.items.map((item, index) => {
          const tone = cardTones[index % cardTones.length]!;
          return (
            <Link
              key={item.title}
              href={item.url as Route}
              className={`group/card block min-w-0 overflow-hidden rounded-[24px] border bg-card shadow-sm outline-none transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${tone.hover}`}
            >
              <div
                className={`relative isolate flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br ${tone.gradient} sm:h-44`}
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_85%,oklch(1_0_0_/_0.16),transparent_52%),linear-gradient(145deg,oklch(0_0_0_/_0.3),transparent_60%)]"
                />
                <div
                  aria-hidden="true"
                  className="absolute -right-8 -bottom-20 -z-10 size-56 rounded-full bg-white/20 blur-3xl transition-transform duration-300 group-hover/card:scale-110 motion-reduce:transition-none"
                />
                <div
                  className={`flex size-24 items-center justify-center rounded-[28px] border border-white/25 bg-white/10 text-white shadow-[inset_0_1px_0_oklch(1_0_0_/_0.18)] backdrop-blur-md transition-[transform,box-shadow] duration-200 group-hover/card:scale-[1.04] motion-reduce:transition-none sm:size-28 ${tone.iconGlow}`}
                >
                  <item.icon aria-hidden="true" weight="regular" className="size-10 sm:size-12" />
                </div>
              </div>
              <div className="flex min-h-32 items-start justify-between gap-4 p-5 sm:p-6">
                <div className="min-w-0 space-y-2">
                  <CardTitle className="text-balance text-lg font-semibold tracking-tight sm:text-xl">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed text-pretty sm:text-base">
                    {pageDescriptions[item.title] ?? "Open this detailed view."}
                  </CardDescription>
                </div>
                <ArrowRightIcon
                  aria-hidden="true"
                  className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover/card:translate-x-1 group-focus-visible/card:translate-x-1 motion-reduce:transition-none"
                />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
