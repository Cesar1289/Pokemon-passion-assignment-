# PokeVault Intelligence

A Pokémon TCG web app for collectors, traders, and competitive players, built for a 9th-grade web design course assignment.

**What it does:** helps users learn card-authentication checks, explore simulated price trends, judge trade fairness, manage personal collections, and opt in to sharing a public binder.

**Stack:** React + Vite frontend, Node.js + Express 5 API, PostgreSQL, scrypt password hashing, and session-cookie authentication.

## Status
Development is active. The Replit app has six views and this repository now contains both the app and its planning documents. The app is available in Replit Preview; it has not yet been published publicly.

## Documents
- [Design Doc](docs/design-doc.md) — full spec: purpose, 6 views, CRUD, features, responsive plan, validation, brand style, wireframes
- [Replit Build Spec](docs/replit-build-spec.md) — the exact prompt to paste into the Replit Agent
- [Seed Content Pack](docs/seed-content-pack.md) — 20 seed cards, simulated prices, authentication tips, price-history generator, fun facts
- [Gemini Gem Instructions](docs/gemini-gem-instructions.md) — the 4-expert "PokeVault AI" guidance prompt used in a custom Gemini Gem

## Rules
- All prices in the app are simulated and labeled as such; real set metadata and card images come from PokéTCG.io hotlinks.
- Original CSS/SVG art only in app chrome — no official Pokémon logos.
