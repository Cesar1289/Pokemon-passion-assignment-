# PokeVault Intelligence — Replit Build Spec

Build a Pokémon TCG web app for collectors, traders, and competitive players called "PokeVault Intelligence." It helps users verify real cards, track price trends, judge trade fairness, and manage personal collections.

## Tech Stack
- Backend: Node.js + Express 5
- Database: PostgreSQL (all data must persist across sessions and refreshes)
- Frontend: vanilla HTML/CSS/JavaScript served from `public/`
- Auth: scrypt password hashing + session cookies
- Deployment: run on port 5000, public Replit URL

## User Accounts & Authentication
- Register, login, logout.
- Only logged-in users can create/edit binder entries, save favorites, and write notes. Visitors can browse Home, Directory, Card Detail, and Trade Comparison.
- Binder data is tied to the owner's user id — no one can edit another user's binder.

## The 5 Domain Views

### View 1 — Home / Dashboard
- Hero search bar that jumps to any card
- "Top 10 Movers": the 10 cards whose simulated price moved the most
- Daily Fun Fact: one rotating Pokémon TCG fact
- Site-wide dark/light mode toggle, saved to localStorage so it persists

### View 2 — Card Directory & Catalog
- Type tab bar: "All" plus one scrollable tab per Pokémon type present in the catalog
- Search bar plus filters by Set and Rarity (multi-select: several filters at once)
- Sort by name or by price (low-to-high / high-to-low)
- Responsive grid of cards with a heart (favorite) icon on each card
- "Favorites only" filter for logged-in users
- Friendly empty state: "No cards match your filters — try clearing them"

### View 3 — Card Detail
- High-res artwork and real set info (set name, number, rarity, type, year, artist)
- 30-day simulated price history chart (labeled "simulated data" on the page)
- Spoiler toggle: hidden authentication tips revealed on click (era-specific: 1st Ed stamp fonts, Gold Star ink/holo texture, modern SIR print patterns)
- Favorite button and personal notes (logged-in users)
- Related cards row (same set or same Pokémon line)

### View 4 — Trade Comparison
- Pick cards for "your side" and "their side"
- Show each side's total simulated market value
- Verdict formula: within 10% = FAIR, 10–25% = ONE-SIDED, over 25% = BAD TRADE
- Verdict banner with a short explanation of the math

### View 5 — Personal Binder (primary CRUD entity)
- CREATE binder entries (pick a card, set condition, quantity, notes)
- READ portfolio total (sum of all card values) and full binder list
- UPDATE condition, quantity, and notes
- DELETE cards from the binder
- Export CSV button that downloads the whole binder as a spreadsheet
- Empty state: "Your binder is empty — add your first card!"

### View 6 — Community Binders (bonus view)
- Browse a list of users who turned their binder public: avatar, username, number of cards
- Click a user to open a view-only showcase page of their binder
- Opt-in "Make my binder public" toggle per user, default private
- Optional "Hide my portfolio total" setting
- View-only: visitors can never edit someone else's binder

## Navigation
- Persistent navbar on every page: Home, Directory, Compare, Binder, Community, Login/Logout on the right
- Same layout and styling across all views; collapses to a hamburger menu on mobile

## Database Tables
users (with is_public binder-sharing flag and hide_value flag), cards (seed catalog), binder_entries, favorites, notes, price_history. All user-created/updated/deleted data persists across sessions and refreshes.

## Seed Content
8 hero cards with rich data (set, number, rarity, type, year, artist, simulated price, 30-day simulated history, authentication tips):
1. Charizard (1st Ed) — Base Set 1999, Rare Holo
2. Pikachu Illustrator — CoroCoro Promo 1998
3. Umbreon VMAX (Alt Art) — Evolving Skies 2021, Secret Rare
4. Iono (SIR) — Paldean Fates 2024, Special Illustration Rare
5. Gengar VMAX (Alt Art) — Fusion Strike 2021, Secret Rare
6. Rayquaza Gold Star — EX Deoxys 2005
7. Charizard ex (SIR) — Obsidian Flames 2023
8. Lugia (1st Ed) — Neo Genesis 2000, Rare Holo
Plus 10–15 common/uncommon filler cards so the Rarity and Type filters show real variety. Seed the database on boot so a fresh visitor sees full content. See docs/seed-content-pack.md for exact values, authentication tips, fun facts, and a price-history generator function.

## 10 Custom Features (mapped)
1. Search Bar — Home + Directory
2. Category Filters — Directory (Set/Rarity, multi-select)
3. Sorting Options — Directory (name, price asc/desc)
4. Favorites Button — Card Detail + Directory hearts + favorites filter
5. Dark/Light Mode — site-wide toggle saved in localStorage
6. Top 10 List — Home (Top 10 Movers)
7. Spoiler Toggle — Card Detail (authentication tips)
8. Comparison Tool — Trade Comparison view
9. Personal Notes — Card Detail (logged-in)
10. CSV Download/Export — Binder

## Responsive Design
- Mobile (under 600px): single column, hamburger navbar, 1–2 cards per row, stacked trade comparison
- Tablet (600–1000px): 2–3 cards per row, two-column binder form
- Desktop (over 1000px): full grid, side-by-side comparison, sticky navbar
- Use CSS media queries and flexible grid layouts; same content and functionality at every size

## Validation & Feedback
- Client + server validation: required fields, valid username/password rules, positive numbers only, ownership checks server-side
- Success toast messages ("Card added to binder!")
- Error banners on failures
- Friendly empty states for empty binders and no search results

## Brand Style
- Colors: Poké Red #EE1515 (buttons/accents), Base Yellow #FFCB05 (highlights), Deep Navy #0A1E3C (dark mode base), Binder Cream #FFF8E7 (light mode background)
- Fonts: Lilita One for headings, Nunito for body text
- Card images hotlinked from PokéTCG.io; all other art must be original CSS/SVG; do NOT use any official Pokémon logos
