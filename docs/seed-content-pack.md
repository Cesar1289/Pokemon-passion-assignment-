# PokeVault Intelligence — Seed Content Pack

Everything needed to seed the database. All prices are **simulated** (label them "Simulated data" in the app).

## 1. Hero Cards & Base Prices

| # | Card | Set | Rarity | Type | Base Price (simulated) |
|---|---|---|---|---|---|
| 1 | Charizard (1st Ed) | Base Set, 1999 | Rare Holo | Fire | $7,200 |
| 2 | Pikachu Illustrator | CoroCoro Promo, 1998 | Promo | Lightning | $900,000 |
| 3 | Umbreon VMAX (Alt Art) | Evolving Skies, 2021 | Secret Rare | Darkness | $680 |
| 4 | Iono (SIR) | Paldean Fates, 2024 | Special Illustration Rare | Psychic | $55 |
| 5 | Gengar VMAX (Alt Art) | Fusion Strike, 2021 | Secret Rare | Darkness | $380 |
| 6 | Rayquaza Gold Star | EX Deoxys, 2005 | Gold Star Holo | Dragon | $3,400 |
| 7 | Charizard ex (SIR) | Obsidian Flames, 2023 | Special Illustration Rare | Fire | $120 |
| 8 | Lugia (1st Ed) | Neo Genesis, 2000 | Rare Holo | Colorless | $2,100 |

## 2. Filler Cards (for filter/sort variety)

| # | Card | Set | Rarity | Type | Base Price (simulated) |
|---|---|---|---|---|---|
| 9 | Sprigatito | Scarlet & Violet Base | Common | Grass | $0.15 |
| 10 | Fuecoco | Scarlet & Violet Base | Common | Fire | $0.10 |
| 11 | Quaxly | Scarlet & Violet Base | Common | Water | $0.10 |
| 12 | Pikachu | Scarlet & Violet 151 | Common | Lightning | $1.50 |
| 13 | Charmander | Scarlet & Violet 151 | Common | Fire | $1.00 |
| 14 | Squirtle | Scarlet & Violet 151 | Common | Water | $0.75 |
| 15 | Bulbasaur | Scarlet & Violet 151 | Common | Grass | $0.75 |
| 16 | Wooloo | Sword & Shield Base | Common | Colorless | $0.05 |
| 17 | Snom | Chilling Reign | Common | Water | $0.10 |
| 18 | Ralts | Crown Zenith | Common | Psychic | $0.20 |
| 19 | Garchomp | Scarlet & Violet Base | Uncommon | Dragon | $0.50 |
| 20 | Noctowl | Scarlet & Violet Base | Common | Colorless | $0.08 |

## 3. Authentication Tips (spoiler content per hero card)

**Charizard (1st Ed) — Base Set**
- The "1st Edition" stamp sits left of the artwork; fakes often use the wrong font or wrong shadow depth.
- Real 1999 cards have a slightly darker card back blue than modern prints — compare against a known-real modern card.
- Hold to a light: real holo stock shows an even glow, fakes look blotchy or too dark.

**Pikachu Illustrator — Promo**
- Never buy this raw (ungraded): with fewer than 40 real copies, only trust PSA/CGC/BGS-graded examples with provenance.
- Fakes usually get the brush-stroke art texture and the Japanese text spacing wrong.

**Umbreon VMAX (Alt Art) — Evolving Skies**
- Nicknamed "Moonbreon": check the gold outer border texture — fakes are smoother and shinier.
- Real card text (especially the HP) is crisp under magnification; fakes look slightly blurry.

**Iono (SIR) — Paldean Fates**
- Modern Scarlet & Violet fakes are very common: real SIRs have a textured, almost linen-like foil you can feel with a fingertip.
- The yellow border on fakes is often too bright or orange-ish.

**Gengar VMAX (Alt Art) — Fusion Strike**
- Check the "VMAX" text styling and the purple foil pattern — fakes lose the layered rainbow shimmer.
- Corner cuts on real cards are uniformly rounded; fakes often have slightly angled cuts.

**Rayquaza Gold Star — EX Deoxys**
- The gold star icon next to the name should have clean, sharp points — fakes stamp it too thick.
- Real 2005 holos have a spiral shimmer pattern; counterfeits look glittery or flat.

**Charizard ex (SIR) — Obsidian Flames**
- The lowercase "ex" logo has a specific slant and gloss — compare against a verified image at full size.
- Real SIR foil is textured; smooth glossy foil is a red flag.

**Lugia (1st Ed) — Neo Genesis**
- The 1st Edition stamp sits right of the artwork (different spot than Base Set) — placement errors are a tell.
- Check the 2000 copyright line and the sparkle holo pattern, which fakes usually get too busy.

## 4. 30-Day Price History Generator

Instead of hand-writing 30 prices per card, generate them in your seed script:

```javascript
// Makes a stable, realistic 30-day history from one base price.
// Same card always gets the same history (no randomness surprises).
function priceHistory(base, days = 30) {
  const history = [];
  let seed = Math.round(base * 100) || 1; // unique per card
  let price = base;
  for (let d = days; d >= 1; d--) {
    seed = (seed * 9301 + 49297) % 233280;
    const wobble = (seed / 233280 - 0.5) * 0.06; // up to ±3% daily move
    price = Math.max(base * 0.8, Math.min(base * 1.2, price * (1 + wobble)));
    history.push({ day: days - d + 1, price: Math.round(price * 100) / 100 });
  }
  return history;
}

// Example:
// priceHistory(680) -> [{ day: 1, price: 671.4 }, { day: 2, price: 655.28 }, ...]
```

The Top 10 Movers list on Home can then rank cards by `abs(last - first) / first` (biggest % change over 30 days).

## 5. Daily Fun Facts (rotate one per day)

1. The Pokémon TCG launched in Japan in October 1996.
2. Pikachu Illustrator was never sold in stores — around 39 copies were given as contest prizes in CoroCoro magazine.
3. A graded Pikachu Illustrator sold for over $5 million in 2022, making it the most expensive Pokémon card ever sold.
4. The "1st Edition" stamp marks cards from a set's very first print run.
5. Gold Star Pokémon appear roughly once per 72 booster packs.
6. Umbreon VMAX Alt Art's fan nickname is "Moonbreon."
7. Base Set Charizard's Fire Spin attack needs 4 Energy cards — that's why it was hard to play, despite being the most wanted card.
8. Fake cards often have a brighter or duller back-blue than real ones — comparing backs is the fastest first check.
9. Charizard has appeared in more special illustrations than any other Pokémon.
10. Modern "rotation" removes older sets from tournament play every year — old cards stay collectible even when unplayable.
