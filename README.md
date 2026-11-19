# PokeVault Intelligence

A Pokémon TCG web app for collectors, traders, and competitive players, built for a 9th-grade web design course assignment.

**What it does:** helps users learn card-authentication checks, explore simulated price trends, judge trade fairness, manage personal collections, and opt in to sharing a public binder.

**Stack:** React + Vite frontend, Node.js + Express 5 API, PostgreSQL, scrypt password hashing, and session-cookie authentication.

## Status
Development is active. The app has six views (Overview, Card Index with type tabs and a Sealed tab, Trade Lab, My Binder with Wish List, Community, Login/Register) plus the Pack Opening Simulator. The visual overhaul in docs/visual-overhaul.md is being applied by the Replit Agent. The app is available in Replit Preview; it has not yet been published publicly.

 Built rubric features: Search Bar, Category Filters, Sorting Options, Favorites, Dark/Light Mode, Top 10 Movers, Spoiler Toggle (authentication tips), Trade Comparison Tool, Personal Notes, CSV Export — plus extras: Wish List, Pack Opening Simulator, Sealed products tab, type tab bar, Community Binders.

## Documents
- [Design Doc](docs/design-doc.md) — full spec: purpose, 6 views, CRUD, features, responsive plan, validation, design system & UI polish, feature roadmap (10 queued items)
- [Replit Build Spec](docs/replit-build-spec.md) — the exact prompt to paste into the Replit Agent
- [Seed Content Pack](docs/seed-content-pack.md) — 20 seed cards, 12 sealed products, simulated prices, authentication tips, price-history generator, fun facts
- [Gemini Gem Instructions](docs/gemini-gem-instructions.md) — the 4-expert "PokeVault AI" guidance prompt used in a custom Gemini Gem
- [Visual Overhaul](docs/visual-overhaul.md) — graphics upgrade instructions (3D card tilt, holo foil, glass panels, animated background) with an acceptance checklist

## Rules
- All prices in the app are simulated and labeled as such; real set metadata and card images come from PokéTCG.io hotlinks.
- Original CSS/SVG art only in app chrome — no official Pokémon logos.
