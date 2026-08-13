# Selvam documentation

This Fumadocs application contains the versioned product and engineering handbook for Selvam.

The content intentionally covers only durable decisions:

- supported portfolio workflows and current calculation boundaries;
- application architecture and package responsibilities;
- historical snapshots, import deduplication and ownership enforcement;
- security and sensitive-data handling;
- Vercel and Neon production operations.

Documentation pages live in `content/docs` and are ordered by `content/docs/meta.json`.

```bash
pnpm --filter fumadocs dev
pnpm --filter fumadocs types:check
pnpm --filter fumadocs lint
pnpm --filter fumadocs build
```

The local documentation server uses <http://localhost:4000>.
