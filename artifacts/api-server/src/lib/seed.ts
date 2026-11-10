import { inArray, sql } from "drizzle-orm";
import {
  binderEntriesTable,
  cardNotesTable,
  cardsTable,
  db,
  favoritesTable,
  priceHistoryTable,
} from "@workspace/db";
import { logger } from "./logger";

type SeedCard = {
  id: string;
  name: string;
  setName: string;
  setId: string;
  number: string;
  rarity: string;
  type: string;
  year: number;
  artist: string;
  imageUrl?: string;
  marketPrice: number;
  authenticationTip: string;
  tags: string[];
};

const fillerAuthenticationTip =
  "Compare print clarity, card-back color, and edges with a verified card from the same era.";

const seedCards: SeedCard[] = [
  {
    id: "base1-4",
    name: "Charizard (1st Ed)",
    setName: "Base Set",
    setId: "base1",
    number: "4",
    rarity: "Rare Holo",
    type: "Fire",
    year: 1999,
    artist: "Mitsuhiro Arita",
    marketPrice: 7200,
    authenticationTip: [
      'The "1st Edition" stamp sits left of the artwork; fakes often use the wrong font or wrong shadow depth.',
      "Real 1999 cards have a slightly darker card back blue than modern prints — compare against a known-real modern card.",
      "Hold to a light: real holo stock shows an even glow, fakes look blotchy or too dark.",
    ].join("\n"),
    tags: ["Charizard", "Vintage", "1st Edition"],
  },
  {
    id: "basep-1",
    name: "Pikachu Illustrator",
    setName: "CoroCoro Promo",
    setId: "basep",
    number: "1",
    rarity: "Promo",
    type: "Lightning",
    year: 1998,
    artist: "Atsuko Nishida",
    imageUrl: "/artwork-unavailable.svg",
    marketPrice: 900000,
    authenticationTip: [
      "Never buy this raw (ungraded): with fewer than 40 real copies, only trust PSA/CGC/BGS-graded examples with provenance.",
      "Fakes usually get the brush-stroke art texture and the Japanese text spacing wrong.",
    ].join("\n"),
    tags: ["Pikachu", "Promo", "Trophy"],
  },
  {
    id: "swsh7-215",
    name: "Umbreon VMAX (Alt Art)",
    setName: "Evolving Skies",
    setId: "swsh7",
    number: "215",
    rarity: "Secret Rare",
    type: "Darkness",
    year: 2021,
    artist: "Keiko Fukuyama",
    marketPrice: 680,
    authenticationTip: [
      'Nicknamed "Moonbreon": check the gold outer border texture — fakes are smoother and shinier.',
      "Real card text (especially the HP) is crisp under magnification; fakes look slightly blurry.",
    ].join("\n"),
    tags: ["Umbreon", "Eeveelution", "Alt Art"],
  },
  {
    id: "sv4pt5-237",
    name: "Iono (SIR)",
    setName: "Paldean Fates",
    setId: "sv4pt5",
    number: "237",
    rarity: "Special Illustration Rare",
    type: "Psychic",
    year: 2024,
    artist: "Naoki Saito",
    marketPrice: 55,
    authenticationTip: [
      "Modern Scarlet & Violet fakes are very common: real SIRs have a textured, almost linen-like foil you can feel with a fingertip.",
      "The yellow border on fakes is often too bright or orange-ish.",
    ].join("\n"),
    tags: ["Iono", "Trainer", "SIR"],
  },
  {
    id: "swsh8-271",
    name: "Gengar VMAX (Alt Art)",
    setName: "Fusion Strike",
    setId: "swsh8",
    number: "271",
    rarity: "Secret Rare",
    type: "Darkness",
    year: 2021,
    artist: "aky CG Works",
    marketPrice: 380,
    authenticationTip: [
      'Check the "VMAX" text styling and the purple foil pattern — fakes lose the layered rainbow shimmer.',
      "Corner cuts on real cards are uniformly rounded; fakes often have slightly angled cuts.",
    ].join("\n"),
    tags: ["Gengar", "Alt Art", "VMAX"],
  },
  {
    id: "exd-107",
    name: "Rayquaza Gold Star",
    setName: "EX Deoxys",
    setId: "ex8",
    number: "107",
    rarity: "Gold Star Holo",
    type: "Dragon",
    year: 2005,
    artist: "Masakazu Fukuda",
    marketPrice: 3400,
    authenticationTip: [
      "The gold star icon next to the name should have clean, sharp points — fakes stamp it too thick.",
      "Real 2005 holos have a spiral shimmer pattern; counterfeits look glittery or flat.",
    ].join("\n"),
    tags: ["Rayquaza", "Gold Star", "Vintage"],
  },
  {
    id: "sv3-223",
    name: "Charizard ex (SIR)",
    setName: "Obsidian Flames",
    setId: "sv3",
    number: "223",
    rarity: "Special Illustration Rare",
    type: "Fire",
    year: 2023,
    artist: "Jiro Sasumo",
    marketPrice: 120,
    authenticationTip: [
      'The lowercase "ex" logo has a specific slant and gloss — compare against a verified image at full size.',
      "Real SIR foil is textured; smooth glossy foil is a red flag.",
    ].join("\n"),
    tags: ["Charizard", "SIR", "Pokémon ex"],
  },
  {
    id: "neo1-9",
    name: "Lugia (1st Ed)",
    setName: "Neo Genesis",
    setId: "neo1",
    number: "9",
    rarity: "Rare Holo",
    type: "Colorless",
    year: 2000,
    artist: "Hironobu Yoshida",
    marketPrice: 2100,
    authenticationTip: [
      "The 1st Edition stamp sits right of the artwork (different spot than Base Set) — placement errors are a tell.",
      "Check the 2000 copyright line and the sparkle holo pattern, which fakes usually get too busy.",
    ].join("\n"),
    tags: ["Lugia", "Vintage", "1st Edition"],
  },
  {
    id: "sv1-13",
    name: "Sprigatito",
    setName: "Scarlet & Violet Base",
    setId: "sv1",
    number: "13",
    rarity: "Common",
    type: "Grass",
    year: 2023,
    artist: "Mizue",
    marketPrice: 0.15,
    authenticationTip: fillerAuthenticationTip,
    tags: ["Sprigatito", "Common"],
  },
  {
    id: "sv1-23",
    name: "Fuecoco",
    setName: "Scarlet & Violet Base",
    setId: "sv1",
    number: "23",
    rarity: "Common",
    type: "Fire",
    year: 2023,
    artist: "Saya Tsuruta",
    marketPrice: 0.1,
    authenticationTip: fillerAuthenticationTip,
    tags: ["Fuecoco", "Common"],
  },
  {
    id: "sv1-50",
    name: "Quaxly",
    setName: "Scarlet & Violet Base",
    setId: "sv1",
    number: "50",
    rarity: "Common",
    type: "Water",
    year: 2023,
    artist: "Narumi Sato",
    marketPrice: 0.1,
    authenticationTip: fillerAuthenticationTip,
    tags: ["Quaxly", "Common"],
  },
  {
    id: "sv3pt5-25",
    name: "Pikachu",
    setName: "Scarlet & Violet 151",
    setId: "sv3pt5",
    number: "25",
    rarity: "Common",
    type: "Lightning",
    year: 2023,
    artist: "Mitsuhiro Arita",
    marketPrice: 1.5,
    authenticationTip: fillerAuthenticationTip,
    tags: ["Pikachu", "151", "Common"],
  },
  {
    id: "sv3pt5-4",
    name: "Charmander",
    setName: "Scarlet & Violet 151",
    setId: "sv3pt5",
    number: "4",
    rarity: "Common",
    type: "Fire",
    year: 2023,
    artist: "Mitsuhiro Arita",
    marketPrice: 1,
    authenticationTip: fillerAuthenticationTip,
    tags: ["Charmander", "151", "Common"],
  },
  {
    id: "sv3pt5-7",
    name: "Squirtle",
    setName: "Scarlet & Violet 151",
    setId: "sv3pt5",
    number: "7",
    rarity: "Common",
    type: "Water",
    year: 2023,
    artist: "Mitsuhiro Arita",
    marketPrice: 0.75,
    authenticationTip: fillerAuthenticationTip,
    tags: ["Squirtle", "151", "Common"],
  },
  {
    id: "sv3pt5-1",
    name: "Bulbasaur",
    setName: "Scarlet & Violet 151",
    setId: "sv3pt5",
    number: "1",
    rarity: "Common",
    type: "Grass",
    year: 2023,
    artist: "Mitsuhiro Arita",
    marketPrice: 0.75,
    authenticationTip: fillerAuthenticationTip,
    tags: ["Bulbasaur", "151", "Common"],
  },
  {
    id: "swsh1-153",
    name: "Wooloo",
    setName: "Sword & Shield Base",
    setId: "swsh1",
    number: "153",
    rarity: "Common",
    type: "Colorless",
    year: 2020,
    artist: "Atsuko Nishida",
    marketPrice: 0.05,
    authenticationTip: fillerAuthenticationTip,
    tags: ["Wooloo", "Common"],
  },
  {
    id: "swsh6-28",
    name: "Snom",
    setName: "Chilling Reign",
    setId: "swsh6",
    number: "28",
    rarity: "Common",
    type: "Water",
    year: 2021,
    artist: "Miki Tanaka",
    marketPrice: 0.1,
    authenticationTip: fillerAuthenticationTip,
    tags: ["Snom", "Common"],
  },
  {
    id: "swsh12pt5-60",
    name: "Ralts",
    setName: "Crown Zenith",
    setId: "swsh12pt5",
    number: "60",
    rarity: "Common",
    type: "Psychic",
    year: 2023,
    artist: "Mizue",
    imageUrl: "/artwork-unavailable.svg",
    marketPrice: 0.2,
    authenticationTip: fillerAuthenticationTip,
    tags: ["Ralts", "Common"],
  },
  {
    id: "sv1-109",
    name: "Garchomp",
    setName: "Scarlet & Violet Base",
    setId: "sv1",
    number: "109",
    rarity: "Uncommon",
    type: "Dragon",
    year: 2023,
    artist: "Mitsuhiro Arita",
    imageUrl: "/artwork-unavailable.svg",
    marketPrice: 0.5,
    authenticationTip: fillerAuthenticationTip,
    tags: ["Garchomp", "Uncommon"],
  },
  {
    id: "sv1-151",
    name: "Noctowl",
    setName: "Scarlet & Violet Base",
    setId: "sv1",
    number: "151",
    rarity: "Common",
    type: "Colorless",
    year: 2023,
    artist: "Mitsuhiro Arita",
    imageUrl: "/artwork-unavailable.svg",
    marketPrice: 0.08,
    authenticationTip: fillerAuthenticationTip,
    tags: ["Noctowl", "Common"],
  },
];

const retiredSeedCardIds = [
  "base1-2",
  "base1-15",
  "base1-58",
  "base1-46",
  "base1-69",
  "swsh7-204",
  "swsh7-183",
  "swsh8-205",
  "sv3-125",
  "sv3-49",
  "sv4pt5-25",
  "neo1-60",
  "base1-44",
  "base1-63",
  "base1-68",
  "base1-57",
  "base1-65",
  "base1-45",
  "base1-62",
];

/**
 * Stable simulated daily prices copied from the repository's seed-content spec.
 * Day numbers are mapped to calendar dates when persisted to PostgreSQL.
 */
export function priceHistory(base: number, days = 30): Array<{ day: number; price: number }> {
  const history: Array<{ day: number; price: number }> = [];
  let seed = Math.round(base * 100) || 1;
  let price = base;
  for (let d = days; d >= 1; d -= 1) {
    seed = (seed * 9301 + 49297) % 233280;
    const wobble = (seed / 233280 - 0.5) * 0.06;
    price = Math.max(base * 0.8, Math.min(base * 1.2, price * (1 + wobble)));
    history.push({ day: days - d + 1, price: Math.round(price * 100) / 100 });
  }
  return history;
}

function imageUrl(card: SeedCard): string {
  return card.imageUrl
    ?? `https://images.pokemontcg.io/${card.setId}/${card.number.replace(/^0+/, "")}_hires.png`;
}

export async function seedCatalog(): Promise<void> {
  const seedIds = seedCards.map((card) => card.id);
  const existingLegacy = await db
    .select({ id: cardsTable.id })
    .from(cardsTable)
    .where(inArray(cardsTable.id, retiredSeedCardIds));
  const legacyIds = existingLegacy.map((card) => card.id);

  const referencedLegacyIds = new Set<string>();
  if (legacyIds.length > 0) {
    const [binderRefs, favoriteRefs, noteRefs] = await Promise.all([
      db.select({ cardId: binderEntriesTable.cardId }).from(binderEntriesTable)
        .where(inArray(binderEntriesTable.cardId, legacyIds)),
      db.select({ cardId: favoritesTable.cardId }).from(favoritesTable)
        .where(inArray(favoritesTable.cardId, legacyIds)),
      db.select({ cardId: cardNotesTable.cardId }).from(cardNotesTable)
        .where(inArray(cardNotesTable.cardId, legacyIds)),
    ]);
    for (const ref of [...binderRefs, ...favoriteRefs, ...noteRefs]) {
      referencedLegacyIds.add(ref.cardId);
    }
  }
  const removableLegacyIds = legacyIds.filter((id) => !referencedLegacyIds.has(id));
  const retainedLegacyIds = legacyIds.filter((id) => referencedLegacyIds.has(id));
  if (retainedLegacyIds.length > 0) {
    logger.warn(
      { cardIds: retainedLegacyIds },
      "Kept retired seed cards that still have collector data",
    );
  }

  const histories = new Map<string, Array<{ day: number; price: number }>>();
  const cards = seedCards.map((card) => {
    const history = priceHistory(card.marketPrice);
    histories.set(card.id, history);
    const first = history[0]?.price ?? card.marketPrice;
    const last = history[history.length - 1]?.price ?? card.marketPrice;
    return {
      ...card,
      imageUrl: imageUrl(card),
      trendPercent: Number((((last - first) / first) * 100).toFixed(2)),
    };
  });

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const historyRows: Array<typeof priceHistoryTable.$inferInsert> = [];
  for (const card of seedCards) {
    const history = histories.get(card.id) ?? [];
    for (const point of history) {
      const date = new Date(today);
      date.setUTCDate(date.getUTCDate() - (history.length - point.day));
      const day = date.toISOString().slice(0, 10);
      historyRows.push({
        id: `${card.id}-${day}`,
        cardId: card.id,
        day,
        value: point.price,
      });
    }
  }

  await db.transaction(async (tx) => {
    await tx
      .insert(cardsTable)
      .values(cards)
      .onConflictDoUpdate({
        target: cardsTable.id,
        set: {
          name: sql`excluded.name`,
          setName: sql`excluded.set_name`,
          setId: sql`excluded.set_id`,
          number: sql`excluded.number`,
          rarity: sql`excluded.rarity`,
          type: sql`excluded.type`,
          year: sql`excluded.year`,
          artist: sql`excluded.artist`,
          imageUrl: sql`excluded.image_url`,
          marketPrice: sql`excluded.market_price`,
          trendPercent: sql`excluded.trend_percent`,
          authenticationTip: sql`excluded.authentication_tip`,
          tags: sql`excluded.tags`,
        },
      });
    await tx
      .delete(priceHistoryTable)
      .where(inArray(priceHistoryTable.cardId, seedIds));
    await tx.insert(priceHistoryTable).values(historyRows);
    if (removableLegacyIds.length > 0) {
      await tx.delete(cardsTable).where(inArray(cardsTable.id, removableLegacyIds));
    }
  });

  logger.info(
    {
      cardCount: seedCards.length,
      historyPointCount: historyRows.length,
      removedLegacyCardCount: removableLegacyIds.length,
    },
    "Synchronized the PokeVault seed catalog",
  );
}
