# PokeVault Intelligence

Pokémon TCG collector app for catalog browsing, simulated value research, trade comparison, and private binder management.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/pokevault-intelligence/` — React web frontend, responsive pages, and brand styling.
- `artifacts/api-server/src/routes/` — Express account, catalog, dashboard, and binder endpoints.
- `lib/db/src/schema/` — PostgreSQL tables and relationships.
- `lib/api-spec/openapi.yaml` — API contract; regenerate client and validation schemas after changes.

## Architecture decisions

- All prices and price histories are simulated, not live market quotes.
- The supplied specification explicitly requested local scrypt password authentication. Sessions use random opaque cookies with hashed tokens persisted in PostgreSQL.
- Private binder entries, favorites, and notes must always be scoped to the authenticated owner.
- Binder sharing is opt-in and defaults to private; public showcases never include personal notes, and owners can hide the aggregate portfolio value.
- Card artwork uses PokémonTCG.io URLs. When the source lacks an exact print, show an explicit unavailable-artwork illustration rather than a different card.

## Product

Six domain views: overview, searchable/filterable card index, card detail, multi-card trade comparison, private binder, and public Community Binders. Accounts support registration/login/logout; collectors can save favorites and notes, manage binder entries, export CSV, and opt in to binder sharing.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
