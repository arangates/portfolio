import {
  ArrowRightIcon,
  BanknoteIcon,
  BlocksIcon,
  Building2Icon,
  CoinsIcon,
  Code2Icon,
  DatabaseIcon,
  FileClockIcon,
  Globe2Icon,
  HistoryIcon,
  LandmarkIcon,
  LockKeyholeIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrendingUpIcon,
  WalletCardsIcon,
} from "lucide-react";
import Link from "next/link";

const sourceUrl = process.env.NEXT_PUBLIC_SOURCE_URL;

const assetGroups = [
  {
    icon: BanknoteIcon,
    title: "Cash, clearly separated",
    description: "INR and EUR bank balances stay distinct from investment accounts.",
    accent: "text-emerald-600 dark:text-emerald-300",
  },
  {
    icon: TrendingUpIcon,
    title: "Equity with memory",
    description: "Zerodha snapshots and the complete Degiro ledger preserve every import.",
    accent: "text-sky-600 dark:text-sky-300",
  },
  {
    icon: Building2Icon,
    title: "Assets beyond brokers",
    description: "Fixed deposits, commodities, real estate and manual assets live together.",
    accent: "text-amber-600 dark:text-amber-300",
  },
] as const;

const architecture = [
  ["Next.js 16", "Server-rendered product"],
  ["Neon Postgres", "Durable financial history"],
  ["Better Auth", "Account-owned data"],
  ["Drizzle", "Typed schema and migrations"],
] as const;

export default function HomePage() {
  return (
    <main className="pb-10 text-fd-foreground md:pb-20">
      <section className="relative mx-auto mt-4 min-h-[720px] w-[calc(100%-1rem)] max-w-[1440px] overflow-hidden rounded-3xl border bg-fd-card shadow-2xl shadow-emerald-950/5 md:w-[calc(100%-2rem)] dark:shadow-black/30">
        <div className="landing-grid pointer-events-none absolute inset-0 opacity-70" />
        <div className="aurora pointer-events-none absolute -inset-20 opacity-80 dark:opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-fd-background/0 via-fd-background/5 to-fd-background/80" />

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-5 pt-20 text-center md:pt-28">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-fd-background/65 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur-xl">
            <SparklesIcon className="size-3.5 text-emerald-500" />
            Public source. Private portfolio.
          </div>
          <h1 className="max-w-4xl text-balance text-5xl leading-[0.98] font-medium tracking-[-0.055em] sm:text-6xl lg:text-8xl">
            Know what you own.
            <br />
            <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 bg-clip-text text-transparent">
              Keep every chapter.
            </span>
          </h1>
          <p className="mt-7 max-w-2xl text-balance text-base leading-7 text-fd-muted-foreground sm:text-lg">
            A private, multi-currency portfolio that brings cash, deposits, listed investments,
            commodities and real estate into one durable historical record.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 rounded-full bg-fd-primary px-5 py-3 text-sm font-medium text-fd-primary-foreground shadow-lg shadow-emerald-500/15 transition-transform hover:-translate-y-0.5"
            >
              Explore the handbook
              <ArrowRightIcon className="size-4" />
            </Link>
            {sourceUrl ? (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 rounded-full border bg-fd-background/65 px-5 py-3 text-sm font-medium shadow-sm backdrop-blur-xl transition-colors hover:bg-fd-accent"
              >
                <Code2Icon className="size-4" />
                View source
              </a>
            ) : null}
          </div>
        </div>

        <div className="relative z-10 mx-auto mt-14 w-[94%] max-w-6xl translate-y-4 rounded-2xl border bg-neutral-950/95 p-2 shadow-2xl shadow-black/40 ring-1 ring-white/10 md:translate-y-12">
          <DashboardPreview />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1400px] gap-8 px-6 pt-28 md:px-12 md:pt-36 lg:grid-cols-2">
        <p className="col-span-full max-w-6xl text-3xl leading-tight font-light tracking-[-0.035em] sm:text-4xl lg:text-5xl">
          Financial history should not disappear every time a spreadsheet changes. Selvam keeps
          identities, snapshots and transactions separate—so the latest view stays simple while the
          full record stays intact.
        </p>

        <div className="col-span-full mt-8 grid gap-4 lg:grid-cols-3">
          {assetGroups.map((item) => (
            <article
              key={item.title}
              className="group rounded-2xl border bg-fd-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-14 flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-xl border bg-fd-secondary shadow-sm">
                  <item.icon className={`size-5 ${item.accent}`} />
                </span>
                <ArrowRightIcon className="size-4 text-fd-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
              <h2 className="text-xl font-medium tracking-tight">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-fd-muted-foreground">{item.description}</p>
            </article>
          ))}
        </div>

        <HistoryCard />
        <OwnershipCard />

        <div className="col-span-full mt-8 text-center">
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-300">
            Built for durable ownership
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-medium tracking-[-0.035em] sm:text-5xl">
            A modern stack, with the database as the source of truth.
          </h2>
        </div>

        <div className="col-span-full grid overflow-hidden rounded-2xl border bg-fd-card sm:grid-cols-2 lg:grid-cols-4">
          {architecture.map(([name, description], index) => (
            <div
              key={name}
              className={`p-6 ${index > 0 ? "border-t sm:border-t-0 sm:border-l" : ""} ${index === 2 ? "sm:border-l-0 lg:border-l" : ""}`}
            >
              <p className="font-mono text-xs text-emerald-600 dark:text-emerald-300">
                0{index + 1}
              </p>
              <h3 className="mt-8 font-medium">{name}</h3>
              <p className="mt-1 text-sm text-fd-muted-foreground">{description}</p>
            </div>
          ))}
        </div>

        <section className="relative col-span-full mt-8 overflow-hidden rounded-3xl border bg-neutral-950 px-6 py-16 text-white shadow-2xl md:px-12 md:py-20">
          <div className="landing-dots pointer-events-none absolute inset-0 opacity-50" />
          <div className="absolute -top-40 -right-24 size-96 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="relative z-10 grid items-end gap-12 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="mb-6 flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <Code2Icon className="size-5 text-emerald-300" />
              </div>
              <p className="text-sm font-medium text-emerald-300">Built in public</p>
              <h2 className="mt-3 max-w-3xl text-4xl font-medium tracking-[-0.04em] sm:text-6xl">
                The code is visible. Your financial data never is.
              </h2>
              <p className="mt-6 max-w-2xl leading-7 text-neutral-400">
                The repository contains the application, migrations and documentation—never personal
                workbooks, broker exports, credentials or portfolio values.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {sourceUrl ? (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition-transform hover:-translate-y-0.5"
                >
                  <Code2Icon className="size-4" />
                  Browse GitHub
                </a>
              ) : null}
              <Link
                href="/docs/architecture"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white hover:bg-white/10"
              >
                Architecture
              </Link>
            </div>
          </div>
        </section>
      </section>

      <footer className="mx-auto mt-20 flex w-full max-w-[1400px] flex-col gap-5 border-t px-6 py-8 text-sm text-fd-muted-foreground md:flex-row md:items-center md:justify-between md:px-12">
        <div className="flex items-center gap-2 font-medium text-fd-foreground">
          <WalletCardsIcon className="size-4 text-emerald-500" />
          Selvam
        </div>
        <div className="flex flex-wrap gap-5">
          <Link href="/docs">Documentation</Link>
          <Link href="/docs/security">Security</Link>
          {sourceUrl ? (
            <a href={sourceUrl} target="_blank" rel="noreferrer noopener">
              Source
            </a>
          ) : null}
        </div>
      </footer>
    </main>
  );
}

function DashboardPreview() {
  const nav = [
    [WalletCardsIcon, "Overview"],
    [LandmarkIcon, "Fixed deposits"],
    [TrendingUpIcon, "Indian equity"],
    [Globe2Icon, "Global equity"],
    [Building2Icon, "Real estate"],
    [CoinsIcon, "Commodities"],
  ] as const;

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#090b0b] text-neutral-200">
      <div className="flex h-10 items-center gap-2 border-b border-white/10 px-4 text-xs text-neutral-500">
        <span className="size-2 rounded-full bg-red-400/80" />
        <span className="size-2 rounded-full bg-amber-300/80" />
        <span className="size-2 rounded-full bg-emerald-400/80" />
        <span className="mx-auto -translate-x-8 rounded-md border border-white/5 bg-white/5 px-12 py-1 font-mono text-[10px]">
          selvam.local/dashboard
        </span>
      </div>
      <div className="grid min-h-[410px] grid-cols-[54px_1fr] md:grid-cols-[190px_1fr]">
        <aside className="border-r border-white/10 p-3">
          <div className="mb-7 flex items-center gap-2 px-1">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-300 text-emerald-950">
              <WalletCardsIcon className="size-4" />
            </span>
            <span className="hidden text-sm font-medium md:block">Selvam</span>
          </div>
          <nav className="space-y-1">
            {nav.map(([Icon, label], index) => (
              <div
                key={label}
                className={`flex items-center gap-2 rounded-md px-2 py-2 text-xs ${index === 0 ? "bg-white/10 text-white" : "text-neutral-500"}`}
              >
                <Icon className="size-3.5 shrink-0" />
                <span className="hidden md:block">{label}</span>
              </div>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 p-3 md:p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] text-neutral-500">PORTFOLIO</p>
              <h3 className="mt-1 text-sm font-medium md:text-lg">Overview & assets</h3>
            </div>
            <span className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-neutral-400">
              All accounts
            </span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {[
              ["Net worth", "₹ —", "+ history"],
              ["Liquid assets", "₹ —", "cash + equity"],
              ["Equity P&L", "₹ —", "latest snapshot"],
              ["Data coverage", "Complete", "all valued"],
            ].map(([label, value, detail]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                <p className="truncate text-[9px] text-neutral-500">{label}</p>
                <p className="mt-2 text-sm font-medium md:text-base">{value}</p>
                <p className="mt-1 truncate text-[8px] text-emerald-300/70">{detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 grid gap-2 lg:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/[0.025] p-3">
              <p className="text-[10px] font-medium">Allocation</p>
              <div className="mt-6 space-y-3">
                {[
                  ["Equity", "72%"],
                  ["Cash", "48%"],
                  ["Real estate", "62%"],
                  ["Deposits", "35%"],
                ].map(([name, width]) => (
                  <div key={name} className="grid grid-cols-[62px_1fr] items-center gap-2">
                    <span className="text-[8px] text-neutral-500">{name}</span>
                    <span className="h-1.5 rounded-full bg-white/5">
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300"
                        style={{ width }}
                      />
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.025] p-3">
              <p className="text-[10px] font-medium">Portfolio history</p>
              <svg
                viewBox="0 0 360 126"
                className="mt-2 h-[126px] w-full"
                role="img"
                aria-label="Illustrative portfolio history chart"
              >
                <defs>
                  <linearGradient id="preview-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 110 C42 105, 55 82, 92 88 S143 58, 180 67 S240 30, 275 45 S326 20, 360 12 L360 126 L0 126 Z"
                  fill="url(#preview-fill)"
                />
                <path
                  className="preview-line"
                  d="M0 110 C42 105, 55 82, 92 88 S143 58, 180 67 S240 30, 275 45 S326 20, 360 12"
                  fill="none"
                  stroke="#6ee7b7"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HistoryCard() {
  return (
    <article className="relative mt-8 min-h-[520px] overflow-hidden rounded-2xl border bg-neutral-950 p-7 text-white shadow-xl lg:mt-12">
      <div className="landing-dots absolute inset-0 opacity-40" />
      <div className="relative z-10">
        <span className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/5">
          <HistoryIcon className="size-5 text-emerald-300" />
        </span>
        <h2 className="mt-8 text-3xl font-medium tracking-[-0.035em]">History that compounds.</h2>
        <p className="mt-3 max-w-md leading-7 text-neutral-400">
          Updates append dated snapshots. Imports deduplicate by source hashes. Archive actions hide
          records without destroying the past.
        </p>
      </div>
      <div className="absolute right-5 bottom-5 left-5 rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
        {["Import batch received", "Source rows preserved", "Snapshot appended"].map(
          (label, index) => (
            <div
              key={label}
              className="flex items-center gap-3 border-b border-white/5 py-3 last:border-0"
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-emerald-400/10 font-mono text-[10px] text-emerald-300">
                0{index + 1}
              </span>
              <span className="text-sm text-neutral-300">{label}</span>
              <FileClockIcon className="ml-auto size-4 text-neutral-600" />
            </div>
          ),
        )}
      </div>
    </article>
  );
}

function OwnershipCard() {
  const controls = [
    [LockKeyholeIcon, "Authenticated", "Server session"],
    [DatabaseIcon, "Constrained", "Database owner"],
    [BlocksIcon, "Validated", "Typed writes"],
    [ShieldCheckIcon, "Private", "No shared defaults"],
  ] as const;

  return (
    <article className="relative mt-0 min-h-[520px] overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-100 to-amber-50 p-7 text-emerald-950 shadow-xl lg:mt-12 dark:from-emerald-950 dark:to-neutral-950 dark:text-emerald-50">
      <div className="absolute -right-20 -bottom-20 size-80 rounded-full border-[42px] border-emerald-400/15" />
      <div className="relative z-10">
        <span className="flex size-11 items-center justify-center rounded-xl border border-emerald-950/10 bg-white/60 dark:border-white/10 dark:bg-white/5">
          <ShieldCheckIcon className="size-5" />
        </span>
        <h2 className="mt-8 text-3xl font-medium tracking-[-0.035em]">One owner. Every row.</h2>
        <p className="mt-3 max-w-md leading-7 text-emerald-950/65 dark:text-emerald-100/60">
          Session-scoped queries and composite database constraints keep portfolios isolated by
          construction, not convention.
        </p>
      </div>
      <div className="absolute right-5 bottom-5 left-5 grid grid-cols-2 gap-3">
        {controls.map(([Icon, title, detail]) => (
          <div
            key={title}
            className="rounded-xl border border-emerald-950/10 bg-white/55 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5"
          >
            <Icon className="size-4" />
            <p className="mt-5 text-sm font-medium">{title}</p>
            <p className="text-xs opacity-55">{detail}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
