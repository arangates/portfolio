# @portfolio/db

Embedded PostgreSQL database engine, Drizzle ORM schema, and SQL migrations for Selvam.

## Capabilities

- **Embedded PGlite Engine (`embedded.ts`)**: In-process WASM PostgreSQL storing to `./data/selvam.db`. Migrates 70 tables in ~450ms with zero Docker requirement.
- **Drizzle ORM**: Strongly typed schemas for portfolios, ledgers, assets, snapshots, and audit events.
- **Tracked Migrations**: 70 version-controlled SQL migrations under `src/migrations/`.
- **Hybrid Support**: Automatically uses embedded PGlite in sovereign mode, or connects to external PostgreSQL when `DATABASE_URL` is explicitly provided.
