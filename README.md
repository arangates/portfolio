# Selvam

A **100% sovereign, local-first portfolio intelligence application** built with Clean Architecture, Next.js 16, Tauri 2.0 (Rust), embedded WebAssembly PostgreSQL (PGlite), Drizzle ORM, and shadcn/ui.

Selvam runs completely on-device with **zero cloud dependencies**, **zero external telemetry**, and **air-gapped readiness**.

---

## What it provides

- **100% Sovereign & Local-First**: Runs directly on your machine. All 70 database tables run in embedded WASM PostgreSQL (PGlite) saving to `./data/selvam.db`. Zero Docker daemons or cloud accounts required.
- **Native Multi-Platform Shell (Tauri 2.0)**: Compiles to native desktop and mobile installers: macOS (`.dmg`), Windows (`.exe` / `.msi`), Linux (`.AppImage` / `.deb`), and Android (`.apk`).
- **Clean Architecture Decoupling**:
  - `@portfolio/calc`: Pure, zero-dependency financial calculation engine for FIRE simulations, XIRR returns, net worth summaries, and currency conversions (66 tests).
  - `@portfolio/parsers`: Universal, side-effect-free statement parsers for Zerodha tradebooks, Degiro statements, and salary payslips (17 tests).
- **AES-256-GCM Hardware Vault**: Authenticated encryption (`SELV` binary format, 100,000 PBKDF2-SHA512 iterations) protecting local credentials and archived documents.
- **Local Document Vault**: Statement files and tradebooks are archived on-device under `./data/vault/documents/` with SHA-256 deduplication.
- **Financial Stories Pulse**: Instagram/WhatsApp-style 6-second ephemeral financial pulse feed keeping portfolio metrics engaging and visual.
- **Direct Central Bank FX**: European Central Bank (ECB) daily reference rates parsed directly from the official ECB XML feed with zero API keys or rate limits.
- **Multi-Asset History**: Strict per-user ownership for bank deposits, listed equities, mutual funds, commodities, real estate, and salary history with immutable snapshot ledgers.

---

## Quick Start (Sovereign Mode)

### 1. Web Application & PWA

Clone, install, and launch the sovereign web app:

```bash
# Clone the repository
git clone https://github.com/arangates/portfolio.git
cd portfolio

# Install dependencies
pnpm install

# Start the sovereign app
SOVEREIGN_MODE=true pnpm dev:web
```

Open [http://localhost:3001](http://localhost:3001).

- PGlite embeds PostgreSQL in WebAssembly, automatically runs all 70 migrations in ~450ms, and writes to `./data/selvam.db`.
- The sovereign identity (`sovereign-user` / Aranga) is auto-provisioned. You are taken straight to the dashboard with zero login friction.

### 2. Native Desktop Shell (Tauri 2.0)

To run the native desktop shell in development:

```bash
pnpm desktop:dev
```

To build a native installer for your platform (`.dmg` on macOS, `.exe` on Windows, `.AppImage` on Linux):

```bash
pnpm desktop:build
```

Installers are emitted into `src-tauri/target/release/bundle/`.

---

## Repository Structure

```text
src-tauri/        Native desktop & mobile shell (Tauri 2.0 Rust)
apps/
  web/            Sovereign Next.js product & local PWA
  fumadocs/       Interactive product and engineering handbook
packages/
  calc/           Zero-dependency pure financial calculation engine
  parsers/        Universal statement, tradebook & payslip parser engine
  api/            Server-only queries, mutations, and domain use cases
  auth/           Hardware vault (AES-256-GCM) & Better Auth configuration
  db/             Embedded PGlite factory, Drizzle schema & migrations
  env/            Runtime environment validation
  ui/             Shared shadcn/ui components and design tokens
```

---

## Verification & Testing

```bash
# Run calculation and parser engine test suites
pnpm --filter @portfolio/calc test
pnpm --filter @portfolio/parsers test
pnpm --filter @portfolio/db test

# Lint and type check across all packages
pnpm check-types
pnpm exec oxlint apps/web/src packages/api/src packages/auth/src packages/db/src packages/calc/src packages/parsers/src

# Production build
pnpm build
```

---

## Automated Multi-Platform Release Pipeline

Every git tag (e.g. `v1.2.0`) triggers a GitHub Actions cross-platform matrix (`.github/workflows/release.yml`) that automatically builds and publishes:

- **macOS**: DMG and APP bundles (Universal / Apple Silicon & Intel)
- **Windows**: NSIS Setup EXE and MSI
- **Linux**: AppImage and DEB packages
- **Containers**: Multi-arch Docker images to GitHub Container Registry (`ghcr.io/arangates/selvam:latest`)
- **Standalone**: Pre-packaged Node.js `.tar.gz` and `.zip` distributions

---

## Privacy & Security

No personal spreadsheet, broker export, credentials or portfolio values are stored in this repository. All data resides in `./data/selvam.db` and `./data/vault/documents/` on your local physical device.
