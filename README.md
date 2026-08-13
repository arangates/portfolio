# Selvam

A private, multi-currency portfolio SaaS built with Next.js 16, Better Auth, Drizzle, Neon Postgres, shadcn/ui and Turborepo.

## What it provides

- Strict per-user ownership for imports, instruments, positions, ledgers, bank accounts, deposits, commodities, manual assets, snapshots, FX rates and audit events.
- Immutable historical snapshots for holdings, balances, deposits, commodities, real estate and manual valuations.
- Idempotent Zerodha XLSX and Degiro CSV imports with archived source rows and SHA-256 deduplication.
- Separate cash and investment surfaces: INR/EUR bank accounts, Indian equity and Global equity.
- Generic CRUD and archival workflows; archived records retain their history.
- Multi-currency net worth with user-managed, dated exchange rates.
- Allocation, liquidity, equity history, concentration, fee, dividend and maturity analytics.
- Private JSON data export, profile/security controls and account deletion.
- Production security headers, server-only data access, validated mutations, masked financial identifiers and upload limits.

No personal spreadsheet, broker export, credentials or portfolio values are stored in this repository.

## Local setup

Requirements: Node.js 20+, pnpm 11+, and a Neon Postgres database.

```bash
pnpm install
cp apps/web/.env.example apps/web/.env
pnpm db:migrate
pnpm dev:web
```

Open <http://localhost:3001>.

Use a pooled Neon connection for `DATABASE_URL` and a direct connection for `DATABASE_URL_DIRECT`. Migrations automatically prefer the direct URL.

## Environment variables

| Variable              | Purpose                                 |
| --------------------- | --------------------------------------- |
| `DATABASE_URL`        | Pooled application connection           |
| `DATABASE_URL_DIRECT` | Direct migration connection             |
| `BETTER_AUTH_SECRET`  | Random secret of at least 32 characters |
| `BETTER_AUTH_URL`     | Canonical application URL               |
| `CORS_ORIGIN`         | Trusted browser origin                  |

Generate an authentication secret with `openssl rand -base64 32`. Never commit a real `.env` file.

## Database workflow

Schema changes are tracked in `packages/db/src/migrations`.

```bash
pnpm db:generate
pnpm db:migrate
```

Use `db:push` only for disposable local development. Production and preview environments should use migrations. Test migrations on a Neon branch before applying them to production.

To return a database to an empty, signup-ready state without removing its schema, first inspect the target:

```bash
pnpm db:reset-data
```

The command is dry-run by default and prints the exact guarded execution command. Read the Fumadocs page `Resetting application data` before using it against valuable data.

## Verification

```bash
pnpm check-types
pnpm exec oxlint apps/web/src packages/api/src packages/auth/src packages/db/src
pnpm build
```

## Deploying to Vercel

1. Push the repository to GitHub.
2. Import it in Vercel. Select `apps/web` as the Root Directory and keep the detected Next.js preset.
3. Keep Vercel's automatically detected install and output settings. If a manual build command is required, use `cd ../.. && pnpm exec turbo run build --filter=web`.
4. Add `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` and `CORS_ORIGIN` to Production and Preview. Set the two URL variables to the exact HTTPS origin for that environment. Keep `DATABASE_URL_DIRECT` outside the deployed app unless a trusted migration job specifically needs it.
5. Run `pnpm db:migrate` from the repository root against the target Neon branch before the first deployment containing a new migration.
6. Deploy. Subsequent pushes to the production branch create production deployments; other branches create previews.

For preview deployments, use a separate Neon branch and corresponding Vercel environment variables. Do not point untrusted preview code at production data.

## Repository structure

```text
apps/web        Next.js application and authenticated route handlers
packages/api    Server-only portfolio data access, imports and mutations
packages/auth   Better Auth configuration
packages/db     Drizzle schema and tracked migrations
packages/env    Validated environment variables
packages/ui     Shared shadcn/ui components and design tokens
```

Financial analytics are informational and should not be treated as investment or tax advice.
