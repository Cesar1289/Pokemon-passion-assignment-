# PokeVault Intelligence — Design Doc

A Pokémon TCG web app for collectors, traders, and competitive players. Version 3, supersedes the old PokéPanel plan.

## 1. Purpose & Target Audience

- **Fandom:** Pokémon Trading Card Game (TCG)
- **Target users:** Pokémon card collectors, traders, and competitive players
- **Problems solved:**
  1. It is hard to tell real cards from fakes — hidden authentication tips teach users what to check.
  2. Prices change fast and are scattered — one place shows each card's value and 30-day trend.
  3. Trades are hard to judge — a fairness engine says whether a trade is even.
  4. Collections get messy — a personal binder tracks what you own, its condition, and your notes.

## 2. Tech Stack

- **Backend:** Node.js + Express 5 (same stack as the quizCE course)
- **Database:** PostgreSQL (data persists across sessions and page refreshes)
- **Frontend:** Vanilla HTML/CSS/JavaScript served from `public/`
- **Auth:** scrypt password hashing + session cookies (same pattern as the quiz app)
- **Hosting:** Replit, deployed via the public Replit URL

## 3. User Accounts & Authentication

- Users can **register, log in, and log out**.
- Only **logged-in** users can create, edit, or delete binder items, save favorites, and write personal notes.
- Logged-out visitors can still browse the Home, Directory, Card Detail, and Trade Comparison views.
- Login, Sign Up, and Account views exist but do NOT count toward the 5 domain views.

## 4. The 6 Domain Views (5 required + 1 bonus)

### View 1 — Home / Dashboard
- Hero search bar (jump straight to any card)
- **Top 10 Movers**: the 10 cards whose simulated price moved the most
- **Daily Fun Fact**: one rotating Pokémon TCG fact
- Site-wide dark/light mode toggle (saved to localStorage so it persists)

### View 2 — Card Directory & Catalog
- **Type tab bar:** "All" plus one tab per Pokémon type in the catalog (Grass, Fire, Water, Lightning, Psychic, Darkness, Dragon, Colorless, ...), horizontally scrollable so it never overflows; the tabs are generated from the data, so only types that exist show up
- Search bar plus filters by **Set and Rarity** (multi-select: several filters at once)
- Sort by name or by price (low-to-high / high-to-low)
- Responsive grid of cards with a heart icon on each card (favorites)
- "Favorites only" filter for logged-in users

### View 3 — Card Detail
- High-res artwork and real set info (set name, number, rarity, type, year)
- **30-day simulated price history** (clearly labeled "simulated data")
- **Spoiler toggle**: hidden authentication tips revealed on click (era-specific: 1st Ed stamp fonts, Gold Star ink/holo texture, modern SIR print patterns)
- Favorite button and personal notes (logged-in users)
- Related cards suggestion (same set or same Pokémon line)

### View 4 — Trade Comparison
- Pick two cards (or two stacks of cards) side by side
- Shows each side's total simulated market value
- **Fairness engine formula:** within 10% = FAIR, 10–25% = ONE-SIDED, over 25% = BAD TRADE
- Verdict banner with a short explanation of the math

### View 5 — Personal Binder (primary CRUD entity)
- **Create** binder entries (pick a card, set condition, quantity, notes)
- **Read** portfolio total (sum of all card values) and full binder list
- **Update** condition, quantity, and notes anytime
- **Delete** cards from the binder
- **Export CSV** downloads the whole binder as a spreadsheet

### View 6 — Community Binders (bonus view)
- Browse a list of users who turned their binder public: avatar, username, number of cards
- Click a user to open a view-only showcase page of their binder (card list, quantities, conditions)
- Each user has an **opt-in "Make my binder public" toggle** — default is private, nobody is shared unless they choose to be
- Optional **"Hide my portfolio total"** setting, for collectors who don't want the money value displayed
- View-only: visitors can never edit someone else's binder

## 5. Navigation

- One persistent **navbar** on every page: Home, Directory, Compare, Binder, Community, plus Login/Logout on the right.
- Same layout, colors, and component styling on all views so the app feels like one product.
- Navbar collapses into a hamburger menu on mobile.

## 6. Database & Persistence

- PostgreSQL tables: `users` (with `is_public` binder-sharing flag and `hide_value` flag), `cards` (seed catalog), `binder_entries`, `favorites`, `notes`, `price_history`.
- All user-created/updated/deleted data (binder entries, favorites, notes) persists across sessions and page refreshes.
- Binder entries are tied to their owner's user id — nobody can edit someone else's binder.

## 7. Seed Content (8 hero cards + catalog fillers)

| Card | Set | Rarity | Why it's in the seed |
|---|---|---|---|
| Charizard (1st Ed) | Base Set, 1999 | Rare Holo | Vintage authentication example (stamp font) |
| Pikachu Illustrator | Promo, 1998 | Promo | Grail card, provenance story |
| Umbreon VMAX (Alt Art) | Evolving Skies, 2021 | Secret Rare | Modern alt-art favorite |
| Iono (SIR) | Paldean Fates, 2024 | Special Illustration Rare | Competitive-adjacent card |
| Gengar VMAX (Alt Art) | Fusion Strike, 2021 | Secret Rare | Modern alt-art example |
| Rayquaza Gold Star | EX Deoxys, 2005 | Gold Star Holo | Mid-2000s print era |
| Charizard ex (SIR) | Obsidian Flames, 2023 | Special Illustration Rare | Current-era flagship |
| Lugia (1st Ed) | Neo Genesis, 2000 | Rare Holo | Vintage holo example |

- Plus ~10–15 common/uncommon filler cards so the Rarity and Type filters have real variety.
- Each seed card stores rich data: set, number, rarity, type, HP/stage, artist, release year, simulated price, 30-day simulated history, and authentication tips.

## 8. The 10 Custom Features (mapped to views)

1. Search Bar — Home + Directory
2. Category Filters — Directory (Set / Rarity / Type, multi-select)
3. Sorting Options — Directory (name, price asc/desc)
4. Favorites Button — Card Detail + Directory hearts + favorites filter
5. Dark/Light Mode — site-wide toggle, saved in localStorage
6. Top 10 List — Home (Top 10 Movers)
7. Spoiler Toggle — Card Detail (authentication tips)
8. Comparison Tool — Trade Comparison view
9. Personal Notes — Card Detail (logged-in)
10. CSV Download/Export — Binder

## 8b. Extra Features (beyond the required 10)

- **Type tab bar** in the Directory (quick browsing by Pokémon type)
- **Community Binders** with opt-in public sharing and a hide-portfolio-total option

## 9. Responsive Design

- **Mobile (under 600px):** single-column layout, hamburger navbar, 1–2 cards per row, stacked trade comparison.
- **Tablet (600–1000px):** 2–3 cards per row, two-column binder form.
- **Desktop (over 1000px):** full grid, side-by-side comparison, sticky navbar.
- Built with CSS media queries and flexible grid layouts — same content and functionality at every size.

## 10. Validation & Feedback

- **Client + server validation:** required fields, valid username/password rules, numbers must be positive, ownership checks server-side.
- **Success feedback:** toast messages ("Card added to binder!").
- **Error feedback:** inline error banners ("Prices load failed, try again").
- **Empty states:** friendly messages like "No cards match your filters — try clearing them" or "Your binder is empty — add your first card!"

## 11. Deployment

- Live on Replit, accessible via the public Replit URL; database seeded on boot so a fresh visitor sees full content immediately.

## 12. Design System & UI Polish (Collectr-inspired)

**Overall feel:** a stock-trading app for cards — dark, sleek, data-forward. Dark mode is the DEFAULT theme; light mode is the alternate.

**Design tokens (CSS variables in `:root`, one `styles.css`):**

```css
:root {
  --bg: #0A1E3C;             /* Deep Navy base — dark default */
  --surface: #12294A;        /* cards and panels */
  --surface-border: #1E3A63;
  --text: #EEF4FF;
  --text-muted: #8FA6C9;
  --accent: #EE1515;         /* Poké Red — primary actions only */
  --accent-2: #FFCB05;       /* Base Yellow — highlights */
  --gain: #2ECC71;           /* price up */
  --loss: #FF5A5A;           /* price down */
  --radius: 14px;
  --radius-sm: 8px;
  --shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  --font-head: 'Outfit', sans-serif;
  --font-body: 'Nunito', sans-serif;
}

[data-theme="light"] {
  --bg: #FFF8E7;             /* Binder Cream */
  --surface: #FFFFFF;
  --surface-border: #E8DFC8;
  --text: #0A1E3C;
  --text-muted: #5A6B85;
  --shadow: 0 8px 24px rgba(10, 30, 60, 0.12);
}
```

**Fonts:** Outfit for headings (sleek and modern, the "pro" look) + Nunito for body. (Alternative: keep Lilita One headings for a playful card-shop feel — but Outfit reads more professional.)

**Collectr-style data moments:**
- **Hero stat tiles** on Home, like Collectr's landing stats: big numbers for "cards tracked", "sets covered", "total portfolio value"
- **Top 10 Movers** with green ▲ / red ▼ arrows and % change per card
- **Binder portfolio chart** styled like a stock line graph with a gradient fill and total value + 30-day % gain/loss header
- Every price anywhere in the app shows its direction color (green up, red down)

**Card grid:**
- 14px rounded corners, soft shadow, hover lift (`translateY(-4px)` + stronger shadow, 200ms ease)
- Rarity pills color-coded: Common gray, Uncommon green, Rare blue, Holo gold, Secret/SIR purple, Promo/Gold Star red
- Price chip pinned to the bottom of every card tile

**Polish checklist:**
- One spacing scale used everywhere: 4 / 8 / 12 / 16 / 24 / 32px
- Skeleton loaders while data loads (no blank flashes)
- Visible focus outlines for keyboard users; aria-labels on icon-only buttons
- Empty states with a small original SVG illustration + one friendly sentence
- Toasts slide in bottom-right; error banners sit at the top of forms in a red-tinted panel

**Art rules:** card images hotlinked from PokéTCG.io; all other art is original CSS/SVG (logos, icons, backgrounds); no official Pokémon logos in the app chrome.

## 13. Low-Fi Wireframes (one per view)

**Home / Dashboard**
```
[ NAV: Home  Directory  Compare  Binder        Light/Dark | Login ]
[          HERO: "Know your cards' worth."  [ Search... ]      ]
[  Top 10 Movers (list)          |  Daily Fun Fact card        ]
[  Quick links: Browse cards | Compare a trade | Open binder    ]
```

**Card Directory**
```
[ NAV ]
[ Tabs: All | Grass | Fire | Water | Lightning | Psychic | Darkness | Dragon → ]
[ Search: [___________]  Filters: Set▾ Rarity▾  Sort: Price ▾ ]
[ card ][ card ][ card ][ card ]   (♥ on each, grid reflows on mobile)
[            Empty state if no matches               ]
```

**Card Detail**
```
[ NAV ]
[ Artwork  |  Name, set, number, rarity, type        ]
[          |  30-day price chart (simulated)         ]
[          |  ♥ Favorite | Notes box (login)         ]
[ Spoiler: "Authentication tips" — tap to reveal    ]
[ Related cards row                                  ]
```

**Trade Comparison**
```
[ NAV ]
[ Your side: pick cards            | Their side: pick cards ]
[ Total: $X                        | Total: $Y              ]
[        VERDICT: FAIR / ONE-SIDED / BAD TRADE           ]
```

**Personal Binder**
```
[ NAV ]
[ Portfolio total: $X | Export CSV button               ]
[ Add card form: card▾ condition▾ qty notes [Add]       ]
[ Binder table: card | condition | qty | value | Edit/Del ]
[ Empty state: "Your binder is empty — add a card!"     ]
```

**Community Binders (bonus)**
```
[ NAV ]
[ Public binders: (avatar) Alex — 14 cards | (avatar) Sam — 8 cards | ... ]
[ Click a user → showcase of their cards (view-only, portfolio total     ]
[ hidden if they chose "hide value")                                     ]
```

## 14. Build Phases

1. **Foundation:** Express + DB tables, register/login/logout, navbar, dark/light mode.
2. **Browsing:** seed cards, Directory (search/filter/sort), Card Detail.
3. **Binder CRUD:** create/read/update/delete + CSV export + portfolio total.
4. **Interactive features:** Trade Comparison engine, favorites, notes, spoiler toggle, Top 10, fun fact.
5. **Polish & deploy:** responsive breakpoints, validation/toasts/empty states, final testing, public URL.

## Appendix — AI Guidance Panel (project helpers, not in-app content)

Four personas guide the build: **Dr. Vintage** (authenticity), **Penny** (market/pricing), **Red** (competitive meta), and **Pixel** (web architecture/UX). Protocol: experts outside a topic answer "N/A"; active experts answer in 1–3 simple sentences; deeper detail only on request.
